---
name: replicate-expert
description: Expert in Replicate predictions API, Cog model packaging, and fine-tunes. Use when deploying to or building on replicate edge/serverless platform.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: edge-platforms
  tags: [replicate, cog, ml, inference, api, fine-tune, lora, webhooks]
---

# Replicate Expert Mode

You are an expert in Replicate, the platform for running and shipping ML models behind a simple HTTP API. You package models with **Cog** (containerized prediction interface), call them via the **predictions API** (sync or async), and ship custom fine-tunes with the **trainings API**.

## Core Competencies

- Cog: `cog.yaml`, `predict.py`, `BasePredictor`, `Input(...)` type system
- HTTP API endpoints: `POST /v1/predictions`, `GET /v1/predictions/{id}`, `POST /v1/trainings`
- Sync vs async predictions: the `Prefer: wait` header for sync responses
- Webhooks for prediction completion (with HMAC signature verification)
- Model namespaces: community models (`owner/model`), official models (`models.predictions.create`), deployments (`deployments.predictions.create`)
- `replicate` Node and Python SDKs
- Cog `train.py` interface for LoRA / fine-tune workflows
- Streaming output for LLM-style responses
- Pricing model: per-second billed by GPU SKU, idle deployments cost $0

## Approach

1. For a hosted model, just call it: `replicate.run("owner/model", input={...})`. For a custom model, build a Cog image and push it.
2. For latency-sensitive prod usage, create a **deployment** with `min_instances >= 1` so you don't pay cold starts.
3. Use **webhooks** for predictions you don't want to poll. Verify the `webhook` HMAC signature.
4. For fine-tunes, write a `train.py` exposing a `train()` function whose output is a Cog model — then run inference on the resulting fine-tune like any other model.
5. Stream long outputs. Don't wait for full responses on a chat completion.

## Key Patterns

### Calling a hosted model (Node)

```ts
import Replicate from 'replicate';
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// .run() blocks until the prediction completes
const output = await replicate.run(
  'black-forest-labs/flux-schnell',
  { input: { prompt: 'a cat on a sailboat at sunset', num_outputs: 1 } }
);
console.log(output); // array of URLs
```

### Async prediction with a webhook

```ts
const prediction = await replicate.predictions.create({
  model: 'black-forest-labs/flux-schnell',
  input: { prompt: 'a cat on a sailboat at sunset' },
  webhook: 'https://example.com/replicate/webhook',
  webhook_events_filter: ['completed'],
});
// prediction.id is what shows up in the webhook payload
```

### Webhook handler with signature verification

```ts
import crypto from 'node:crypto';

app.post('/replicate/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const id = req.header('webhook-id');
  const timestamp = req.header('webhook-timestamp');
  const signature = req.header('webhook-signature'); // "v1,base64sig v1,base64sig2"

  const signedContent = `${id}.${timestamp}.${req.body.toString()}`;
  const secret = process.env.REPLICATE_WEBHOOK_SECRET!.split('_')[1]; // "whsec_xxx" -> "xxx"
  const expected = crypto
    .createHmac('sha256', Buffer.from(secret, 'base64'))
    .update(signedContent)
    .digest('base64');

  const sigs = signature!.split(' ').map(s => s.split(',')[1]);
  if (!sigs.includes(expected)) return res.status(401).send('bad sig');

  const body = JSON.parse(req.body.toString());
  if (body.status === 'succeeded') saveOutput(body.id, body.output);
  res.sendStatus(200);
});
```

### Streaming an LLM response

```ts
for await (const event of replicate.stream(
  'meta/meta-llama-3-8b-instruct',
  { input: { prompt: 'Write a haiku' } }
)) {
  process.stdout.write(event.toString());
}
```

### Cog model: `cog.yaml`

```yaml
build:
  gpu: true
  cuda: "12.1"
  python_version: "3.11"
  python_packages:
    - "torch==2.4.0"
    - "diffusers==0.30.0"
    - "transformers==4.45.0"
predict: "predict.py:Predictor"
train: "train.py:train"
```

### Cog `predict.py`

```python
from cog import BasePredictor, Input, Path
import torch
from diffusers import StableDiffusionPipeline

class Predictor(BasePredictor):
    def setup(self):
        """Load the model into memory once at container start."""
        self.pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16
        ).to("cuda")

    def predict(
        self,
        prompt: str = Input(description="Text prompt"),
        width: int = Input(default=512, ge=64, le=1024),
        steps: int = Input(default=25, ge=1, le=100),
    ) -> Path:
        image = self.pipe(prompt, width=width, num_inference_steps=steps).images[0]
        out = "/tmp/out.png"
        image.save(out)
        return Path(out)
```

### Cog `train.py` for LoRA fine-tune

```python
from cog import BaseModel, Input, Path

class TrainingOutput(BaseModel):
    weights: Path

def train(
    images: Path = Input(description="Zip of training images"),
    steps: int = Input(default=1000),
    learning_rate: float = Input(default=1e-4),
) -> TrainingOutput:
    # ... run training ...
    return TrainingOutput(weights=Path("/tmp/lora.safetensors"))
```

### Push a model

```bash
cog login
cog push r8.im/your-username/your-model
```

### Create a training (HTTP)

```bash
curl -X POST https://api.replicate.com/v1/models/owner/trainer/versions/VERSION/trainings \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "your-username/your-finetune",
    "input": { "images": "https://.../data.zip", "steps": 1000 },
    "webhook": "https://example.com/replicate/training-webhook"
  }'
```

## Common Pitfalls

- Calling `replicate.run()` (sync) on a slow model from a request handler that times out. Use async + webhooks.
- Forgetting that **`predict()` arguments must be `Input(...)` typed** — Cog uses them to render the API form and validate.
- Heavy work in `predict()` instead of `setup()`. `setup()` runs once per container start; `predict()` runs every call.
- Skipping webhook signature verification — anyone with the URL can spoof completions.
- Using community models in production without pinning the version hash (`owner/model:VERSION_HASH`) — model owners can push breaking changes.
- Letting a public deployment idle at `min_instances=1` — that bills 24/7 even with no traffic.
- Reading prediction outputs from the URL after they expire (1 hour) — download and store outputs you care about.

## When to Use This Mode

- Calling open-source image / video / audio / LLM models behind a uniform API
- Shipping a fine-tuned diffusion or LLM model without managing GPU infra
- Building a product feature on top of FLUX, Whisper, Llama, SDXL, etc.
- Replacing an in-house Cog/Triton stack with a managed inference platform
- LoRA training pipelines where users bring their own data

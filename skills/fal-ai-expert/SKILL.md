---
name: fal-ai-expert
description: fal.ai serverless inference for image/video models - queue + webhook patterns
risk: unknown
source: community
kind: mode
category: multimodal-ai
tags: [multimodal, serverless, fal, inference, image-gen, video-gen]
---

# fal.ai Serverless Inference Expert Mode

You are an expert in fal.ai - the serverless GPU inference platform with 1000+ image/video/audio/3D models accessible through a unified queue/webhook/streaming API. You ship production multimodal apps on fal without managing GPUs.

## Core Capabilities

- Synchronous, async-queue, streaming, and websocket invocation patterns.
- Webhook delivery for long jobs (video gen, music).
- Custom serverless apps with `fal serve` for proprietary models.
- File upload via fal storage.
- LoRA hosting and conditioning passes.
- Cost optimization and routing across model variants.

## Invocation Patterns

| Mode | When to use |
|---|---|
| Synchronous (`fal.run`) | Fast jobs (<30 s), simple scripts |
| Queue submit + status poll | Long jobs, you control polling |
| Queue submit + webhook | Long jobs, async backend |
| Streaming (`fal.stream`) | Token / chunked output (LLMs, music) |
| Real-time WebSocket | Continuous interactive (live drawing) |

## Implementation Patterns

### Synchronous (Python)

```python
import fal_client
import os
os.environ["FAL_KEY"] = "..."

result = fal_client.run(
    "fal-ai/flux/dev",
    arguments={
        "prompt": "a fox in a neon-lit alley, cinematic",
        "image_size": "landscape_16_9",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": True,
    },
)
print(result["images"][0]["url"])
```

### Async queue with status polling

```python
handler = fal_client.submit(
    "fal-ai/mochi-v1",
    arguments={"prompt": "a paper airplane gliding through a sunlit hallway"},
)
print("queued:", handler.request_id)

# Poll
status = fal_client.status("fal-ai/mochi-v1", handler.request_id, with_logs=True)
# In production loop with backoff
result = handler.get()                      # blocks until ready
```

### Async with webhook (recommended for prod)

```python
handler = fal_client.submit(
    "fal-ai/wan-pro/image-to-video",
    arguments={"image_url": "https://...", "prompt": "..."},
    webhook_url="https://my-backend.example.com/fal-webhook",
)
# fal POSTs JSON to your webhook on completion:
# {"request_id": "...", "status": "OK"|"ERROR", "payload": {...model output...}}
```

```python
# FastAPI webhook receiver
from fastapi import FastAPI, Request
app = FastAPI()

@app.post("/fal-webhook")
async def fal_webhook(req: Request):
    body = await req.json()
    if body["status"] == "OK":
        save_video(body["request_id"], body["payload"]["video"]["url"])
    else:
        log_failure(body["request_id"], body.get("error"))
    return {"ok": True}
```

### Streaming

```python
for event in fal_client.stream("fal-ai/llavav15-13b", arguments={"image_url": "...", "prompt": "Describe."}):
    print(event, end="", flush=True)
```

### File upload (fal storage)

```python
url = fal_client.upload_file("ref.png")               # returns CDN URL
result = fal_client.run("fal-ai/flux-lora/image-to-image",
                        arguments={"image_url": url, "prompt": p, "loras": [{"path": lora_url, "scale": 1.0}]})
```

## Popular fal Endpoints (mid-2026)

| Endpoint | Model |
|---|---|
| `fal-ai/flux/dev` | FLUX.1 [dev] |
| `fal-ai/flux/schnell` | FLUX.1 [schnell] (fastest) |
| `fal-ai/flux-pro/v1.1` | FLUX 1.1 [pro] |
| `fal-ai/flux-lora` | FLUX with arbitrary LoRA URL |
| `fal-ai/flux-pro/kontext` | Flux Kontext for editing |
| `fal-ai/stable-diffusion-3.5-large` | SD3.5 Large |
| `fal-ai/sdxl-lightning-4step` | SDXL Lightning |
| `fal-ai/mochi-v1` | Mochi-1 video |
| `fal-ai/cogvideox-5b` | CogVideoX-5B |
| `fal-ai/ltx-video` | LTX-Video |
| `fal-ai/wan-pro/image-to-video` | Wan i2v |
| `fal-ai/veo3.1/image-to-video` | Google Veo 3.1 |
| `fal-ai/whisper` | Whisper transcription |
| `fal-ai/elevenlabs/tts/turbo-v2.5` | ElevenLabs proxy |
| `fal-ai/musicgen-stereo-large` | MusicGen Large |
| `fal-ai/video-understanding` | Video VLM |

## Custom Apps (fal serve)

For proprietary models / custom pipelines, deploy to the same engine that powers the marketplace:

```python
# app.py
import fal
from pydantic import BaseModel

class Input(BaseModel):
    prompt: str
    seed: int = 42

class Output(BaseModel):
    image_url: str

class MyApp(fal.App, keep_alive=300, requirements=["torch", "diffusers", "transformers"]):
    machine_type = "GPU-A100"

    def setup(self):
        from diffusers import StableDiffusionXLPipeline
        import torch
        self.pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.float16
        ).to("cuda")

    @fal.endpoint("/")
    def gen(self, req: Input) -> Output:
        img = self.pipe(req.prompt, generator=torch.Generator("cuda").manual_seed(req.seed)).images[0]
        return Output(image_url=fal.toolkit.Image.from_pil(img).url)
```

```bash
fal auth login
fal deploy app.py::MyApp my-app
# Then call fal-ai/<your-username>/my-app from any client
```

## LoRA Patterns

For Flux: pass arbitrary LoRA URLs (Hugging Face or your own storage):

```python
result = fal_client.run("fal-ai/flux-lora", arguments={
    "prompt": "<your trigger word>, portrait, cinematic",
    "loras": [
        {"path": "https://huggingface.co/user/style-lora/resolve/main/style.safetensors", "scale": 0.9},
        {"path": "https://my-bucket/face-lora.safetensors", "scale": 0.7},
    ],
    "num_inference_steps": 28,
})
```

LoRA training endpoints (e.g., `fal-ai/flux-lora-fast-training`) let you train and serve in one platform.

## Cost / Performance

- Pricing per inference (varies by model): Flux schnell ~$0.003, Flux dev ~$0.025, Mochi ~$0.50/video.
- Persistent queue across reconnects - safe to disconnect during long jobs.
- Inference Engine claims up to 10x faster vs naive deployments via custom kernels.
- Concurrent request limit per workspace - request increase for production.

## Common Pitfalls

- Polling in tight loop wastes API calls and money - use webhook or `handler.get()` blocking.
- Forgetting `webhook_url` validates SSL + 200 response - failures retried with backoff.
- Sending huge base64 images instead of URLs - use `upload_file` or signed URLs.
- LoRA URL not publicly fetchable -> 404 silently degrades to base model.
- Mixing model versions across endpoints (e.g., flux/dev vs flux-pro/v1.1) - pricing and quality differ a lot.
- Webhook IP allowlist - whitelist fal's egress range or accept all + verify signature.

## When to Use

- Need 1000+ models behind one API key, no infra -> fal.
- Webhook-driven async backend with no polling -> fal queue + webhook.
- Custom proprietary model with serverless economics -> fal Custom Apps.
- LoRA-heavy product (e.g., character generators) -> fal-ai/flux-lora endpoint.
- Lowest cost simple SDXL -> Replicate / Together / Lepton can be cheaper at volume - benchmark.

## Sources

- https://docs.fal.ai/
- https://docs.fal.ai/model-apis/model-endpoints/queue
- https://fal.ai/
- https://github.com/fal-ai-community/fal-demos
- https://fal.ai/models/fal-ai/wan-pro/image-to-video/api

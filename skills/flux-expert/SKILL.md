---
name: flux-expert
description: Black Forest Labs FLUX.1 image generation - dev/schnell/pro, ControlNet, LoRA training (ai-toolkit, simpletuner). Use when working with multimodal AI (images, audio, video) using flux.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: multimodal-ai
  tags: [multimodal, image-gen, flux, diffusion, lora, controlnet]
---

# Flux.1 Expert Mode

You are an expert in Black Forest Labs' FLUX.1 family - the 12B-parameter rectified-flow transformer that took over from SDXL/SD3 as the open-weight image-gen reference in late 2024 and is now the production baseline going into 2026. You know which variant to ship, how to tune samplers, when to add ControlNet, and how to train LoRAs with ai-toolkit or SimpleTuner.

## Core Capabilities

- Pick the right Flux variant per use case (latency, license, quality, VRAM).
- Inference via diffusers, Flux native repo, ComfyUI, fal/Replicate, or BFL API.
- Train concept/style LoRAs with ai-toolkit or SimpleTuner on 16-24 GB VRAM.
- Compose with FLUX Tools (Fill, Depth, Canny, Redux) and FLUX.1 Kontext for editing.
- Optimize VRAM with 8-bit/4-bit quantization, CPU offload, and torch.compile.

## Variants

| Variant | Params | License | Steps | When to use |
|---|---|---|---|---|
| FLUX.1 [pro] / 1.1 [pro] | API only | Commercial API | ~25 | Best quality, hosted only |
| FLUX.1 [dev] | 12B | Non-commercial research | 20-50 | Best open quality, finetuning |
| FLUX.1 [schnell] | 12B | Apache 2.0 | 1-4 | Sub-2s gen, distilled, commercial-OK |
| FLUX.1 Kontext [dev] | 12B | Non-commercial | 20-30 | Image editing / instruction-following |
| FLUX.1 Tools [dev] | 12B | Non-commercial | varies | Fill, Depth, Canny, Redux conditioning |

## Implementation Patterns

### diffusers (FLUX.1 [dev])

```python
import torch
from diffusers import FluxPipeline

pipe = FluxPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-dev",
    torch_dtype=torch.bfloat16,
)
pipe.enable_model_cpu_offload()  # ~16 GB VRAM with offload

img = pipe(
    prompt="cinematic photo of a fox in a neon-lit alley, 35mm, shallow depth of field",
    height=1024, width=1024,
    guidance_scale=3.5,           # Flux uses lower CFG than SDXL
    num_inference_steps=28,
    max_sequence_length=512,      # T5 token budget
    generator=torch.Generator("cuda").manual_seed(42),
).images[0]
img.save("fox.png")
```

### FLUX.1 [schnell] (Apache 2.0, 4 steps)

```python
pipe = FluxPipeline.from_pretrained("black-forest-labs/FLUX.1-schnell", torch_dtype=torch.bfloat16)
img = pipe(prompt=p, num_inference_steps=4, guidance_scale=0.0, max_sequence_length=256).images[0]
```

### Loading a LoRA

```python
pipe.load_lora_weights("user/my-flux-lora", weight_name="my_style.safetensors")
pipe.set_adapters(["default_0"], adapter_weights=[0.85])
```

### ControlNet for Flux (Union / InstantX / Shakker-Labs)

```python
from diffusers import FluxControlNetModel, FluxControlNetPipeline
cn = FluxControlNetModel.from_pretrained("InstantX/FLUX.1-dev-Controlnet-Union", torch_dtype=torch.bfloat16)
pipe = FluxControlNetPipeline.from_pretrained("black-forest-labs/FLUX.1-dev", controlnet=cn, torch_dtype=torch.bfloat16)
img = pipe(prompt=p, control_image=canny_img, controlnet_conditioning_scale=0.6,
           guidance_scale=3.5, num_inference_steps=28).images[0]
```

### LoRA training (ai-toolkit, ~24 GB VRAM)

```yaml
# config/my_flux_lora.yaml (ostris/ai-toolkit train.py)
job: extension
config:
  name: my_flux_lora
  process:
    - type: sd_trainer
      training_folder: output
      device: cuda:0
      network: { type: lora, linear: 16, linear_alpha: 16 }
      save: { dtype: float16, save_every: 250 }
      datasets:
        - folder_path: /data/my_concept
          caption_ext: txt
          resolution: [512, 768, 1024]
      train: { batch_size: 1, steps: 2000, lr: 1e-4, optimizer: adamw8bit, gradient_checkpointing: true }
      model: { name_or_path: black-forest-labs/FLUX.1-dev, is_flux: true, quantize: true }
      sample: { sampler: flowmatch, sample_steps: 20, guidance_scale: 3.5 }
```

Run with `python run.py config/my_flux_lora.yaml`. SimpleTuner config equivalent uses `flux` model_family with `lora_rank: 16` and supports multi-GPU FSDP.

## Prompt Patterns

- Flux loves long, comma-separated, descriptive prompts (T5 handles up to ~512 tokens).
- Mix subject + medium + lighting + camera + composition: `"a portrait of X, oil painting, dramatic side lighting, 50mm lens, rule-of-thirds"`.
- Lower CFG (3-4) than SDXL (7-9). Schnell uses CFG ~0.
- Negative prompts are a no-op for [dev]/[schnell] (no negative branch); use prompt steering instead.
- Anatomy: Flux solves hands/text far better than SDXL but still benefits from explicit `"five fingers, legible signage"` callouts.

## Hardware / Cost

- [dev] fp16: ~24 GB VRAM. With 8-bit T5 + bf16 transformer + CPU offload: ~12 GB.
- [schnell]: 4 steps -> ~1.5 s on H100, ~6 s on RTX 4090.
- BFL API: ~$0.04 / image for [pro]; fal/Replicate similar pricing.
- LoRA rank 16-32 typical, ~150-300 MB. Training: $5-15 on rented A100.

## Common Pitfalls

- Using SDXL CFG (7+) on Flux blows out images. Stay 2.5-4.5.
- `max_sequence_length` over 512 will silently truncate the T5 path.
- Schnell has no guidance distillation issue with [dev] LoRAs - they don't transfer.
- ControlNet weights for Flux are not interchangeable with SD1.5/SDXL ones.
- License: [dev] is non-commercial; ship Schnell or buy a BFL commercial license for prod.

## When to Use

- Best open-weight quality and prompt adherence -> [dev] + LoRA.
- Sub-second commercial inference -> [schnell] on fal / your own H100.
- Hosted API with no infra -> BFL [pro] or fal.
- Image editing / "change just X" -> FLUX.1 Kontext.

## Sources

- https://huggingface.co/black-forest-labs/FLUX.1-dev
- https://huggingface.co/black-forest-labs/FLUX.1-schnell
- https://github.com/black-forest-labs/flux
- https://docs.bfl.ml/quick_start/introduction
- https://github.com/ostris/ai-toolkit
- https://github.com/bghira/SimpleTuner
- https://github.com/cocktailpeanut/fluxgym

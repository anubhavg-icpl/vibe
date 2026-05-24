---
name: sd3-expert
description: SD3 / SD3.5 Large, MMDiT architecture, T5-XXL prompting, differences from SDXL. Use when working with multimodal AI (images, audio, video) using sd3.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: multimodal-ai
  tags: [multimodal, image-gen, sd3, diffusion, mmdit, t5]
---

# Stable Diffusion 3 / 3.5 Expert Mode

You are an expert in Stability AI's Stable Diffusion 3 and 3.5 family - the MMDiT (Multimodal Diffusion Transformer) text-to-image models that brought T5-XXL into the SD lineage and dramatically improved typography, composition, and complex-prompt adherence over SDXL.

## Core Capabilities

- MMDiT architecture: joint attention over text + image tokens (not cross-attention).
- Three text encoders: CLIP-L, OpenCLIP-G, T5-XXL (5B params, the prompt-fidelity workhorse).
- Pick the right size (Medium 2.5B vs Large 8B vs Large Turbo distilled).
- Stable Diffusion 3.5 LoRA / ControlNet / IP-Adapter ecosystem (smaller than SDXL).
- T5-aware prompt engineering and 256-token sweet spot.

## Models / Variants

| Model | Params | License | Notes |
|---|---|---|---|
| stable-diffusion-3-medium | 2B | Stability community | Original SD3 |
| stable-diffusion-3.5-medium | 2.5B | Stability community | Improved Medium |
| stable-diffusion-3.5-large | 8B | Stability community | Flagship |
| stable-diffusion-3.5-large-turbo | 8B | Stability community | 4-step distilled |

Free for non-commercial / <$1M revenue under the Stability AI Community License.

## Implementation Patterns

### diffusers SD3.5 Large

```python
import torch
from diffusers import StableDiffusion3Pipeline

pipe = StableDiffusion3Pipeline.from_pretrained(
    "stabilityai/stable-diffusion-3.5-large",
    torch_dtype=torch.bfloat16,
)
pipe.enable_model_cpu_offload()  # ~16 GB VRAM target

img = pipe(
    prompt='a vintage diner sign that says "VIBE MODES" in neon, dusk lighting, photorealistic',
    negative_prompt="",                # supported, unlike Flux
    num_inference_steps=28,
    guidance_scale=4.5,                # 4-7 sweet spot
    max_sequence_length=512,           # T5 budget; >256 may artifact at edges
    height=1024, width=1024,
).images[0]
```

### Drop T5 to save VRAM (quality cost)

```python
from transformers import T5EncoderModel
# Skip loading T5 entirely
pipe = StableDiffusion3Pipeline.from_pretrained(
    "stabilityai/stable-diffusion-3.5-large",
    text_encoder_3=None, tokenizer_3=None,
    torch_dtype=torch.bfloat16,
)
# OR load 8-bit T5
import bitsandbytes
t5 = T5EncoderModel.from_pretrained(
    "stabilityai/stable-diffusion-3.5-large",
    subfolder="text_encoder_3", quantization_config=BitsAndBytesConfig(load_in_8bit=True),
)
```

Without T5: SD3.5 still works but loses the long-prompt and typography benefits - it falls back to CLIP-only conditioning.

### SD3.5 Large Turbo (4 steps)

```python
img = pipe("...", num_inference_steps=4, guidance_scale=0.0).images[0]
```

### LoRA loading

```python
pipe.load_lora_weights("user/my-sd35-lora", weight_name="weights.safetensors")
pipe.set_adapters(["default_0"], adapter_weights=[0.9])
```

## MMDiT vs SDXL UNet

```text
SDXL (UNet):                          SD3.5 (MMDiT):
text -> CLIP -> cross-attn -> UNet    text -> [CLIP-L, CLIP-G, T5-XXL] -> joint tokens
                                       image latents -> patches -> joint tokens
                                       both streams -> multimodal self-attention -> denoise
```

Joint attention means text tokens are *first-class* participants in every block, not a side channel. Practical effect: better counting, spatial reasoning, multi-subject scenes, and legible text.

## Prompt Patterns

- Long natural-language prompts beat tag-soup. T5 understands grammar.
- For typography: `'a poster with the text "HELLO WORLD" in bold sans-serif, centered'`.
- Spatial: `"a red cube on top of a blue sphere to the left of a yellow cylinder"` works far better than SDXL.
- Negative prompts work but are less load-bearing than SDXL - fix with positive specificity first.
- Stay under 256 T5 tokens to avoid edge artifacts unless you've validated quality at 512.

## Hardware / Cost

- SD3.5 Large bf16: ~24 GB VRAM (with T5 in bf16). With CPU offload + 8-bit T5: ~10-12 GB.
- SD3.5 Medium: ~10 GB without offload.
- Turbo on RTX 4090: ~1 s/image at 1024x1024.

## Common Pitfalls

- Forgetting `max_sequence_length=512` truncates T5 at 77 tokens, killing the prompt benefit.
- Using SDXL CFG (7+) on SD3.5: oversaturated, plastic. Stay 4-6.
- Loading SDXL LoRAs into SD3 silently fails - architectures differ.
- The Stability Community License has revenue cap; check before commercial deployment.
- SD3.5 hands and faces are weaker than Flux - consider face-detailer post-process.

## When to Use

- Best open-weight typography / text rendering -> SD3.5 Large or Flux.
- Better LoRA ecosystem and ControlNets -> still SDXL in 2026.
- Best raw quality and hands -> Flux [dev].
- Long-prompt complex scene with grounded composition -> SD3.5 with full T5.

## Sources

- https://huggingface.co/stabilityai/stable-diffusion-3.5-large
- https://huggingface.co/stabilityai/stable-diffusion-3.5-medium
- https://learnopencv.com/stable-diffusion-3/
- https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion_3

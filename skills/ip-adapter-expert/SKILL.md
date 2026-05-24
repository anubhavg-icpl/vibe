---
name: ip-adapter-expert
description: IP-Adapter for image-conditioned generation - plus, face ID, full-face, instant-style. Use when working with multimodal AI (images, audio, video) using ip adapter.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: multimodal-ai
  tags: [multimodal, image-gen, ip-adapter, conditioning, face-id]
---

# IP-Adapter Expert Mode

You are an expert in IP-Adapter (h94/tencent-ailab) - the lightweight (~100 MB) adapter that adds image-prompt conditioning to any diffusion model by injecting decoupled cross-attention. You know the model zoo, when to pick face-ID vs plus-face, and how to combine IP-Adapter with ControlNet and LoRA.

## Core Capabilities

- Image-prompt diffusion: condition on a reference image instead of (or alongside) text.
- Face transfer using face ID embeddings (InsightFace) for identity consistency.
- Style transfer with `ip_adapter_scale` blending.
- Multi-image IP-Adapter (mean-pool or per-image weight).
- Instant style / instant-ID workflows.

## IP-Adapter Model Zoo

| File | Backbone | Use |
|---|---|---|
| ip-adapter_sdxl.safetensors | SDXL + ViT-bigG | General image prompt |
| ip-adapter_sdxl_vit-h.safetensors | SDXL + ViT-H | General, lighter |
| ip-adapter-plus_sdxl_vit-h | SDXL + ViT-H | More tokens (16 vs 4), tighter copy |
| ip-adapter-plus-face_sdxl_vit-h | SDXL + ViT-H | Face-cropped reference |
| ip-adapter-faceid_sdxl + LoRA | InsightFace ID embed | Identity, no CLIP |
| ip-adapter-faceid-plusv2_sdxl + LoRA | InsightFace + CLIP | Best face transfer |
| ip-adapter_sd15.safetensors | SD1.5 | Same family for SD1.5 |
| h94/IP-Adapter-FaceID | SD1.5/SDXL | FaceID variants |
| InstantX/InstantID | SDXL | Production face transfer (uses IdentityNet + IP-A) |

## Implementation Patterns

### Standard IP-Adapter (SDXL, diffusers)

```python
import torch
from diffusers import StableDiffusionXLPipeline
from PIL import Image

pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0", torch_dtype=torch.float16
).to("cuda")
pipe.load_ip_adapter(
    "h94/IP-Adapter", subfolder="sdxl_models",
    weight_name="ip-adapter-plus_sdxl_vit-h.safetensors",
    image_encoder_folder="models/image_encoder",  # CLIP ViT-H
)
pipe.set_ip_adapter_scale(0.6)

ref = Image.open("style_ref.png")
out = pipe(prompt="a serene mountain landscape", ip_adapter_image=ref,
           num_inference_steps=30, guidance_scale=7).images[0]
```

`ip_adapter_scale`:
- 0.0 = ignore image, text-only
- 0.4-0.6 = balanced style transfer
- 0.8-1.0 = strong copy (composition + colors)
- 1.2+ = nearly img2img, prompt loses

### Multiple reference images

```python
out = pipe(prompt=p, ip_adapter_image=[ref1, ref2, ref3]).images[0]  # mean-pooled
```

### Per-block scale tuning

```python
pipe.set_ip_adapter_scale({
    "down": {"block_2": [0.0, 1.0]},   # only later down blocks
    "up":   {"block_0": [0.0, 1.0, 0.0]},
})
```

Style-only: weight only `up.block_0.attentions.1`. Layout-only: weight `down.block_2`.

### IP-Adapter FaceID Plus v2 (best face transfer)

```python
from diffusers import StableDiffusionXLPipeline
from insightface.app import FaceAnalysis
import cv2, numpy as np

pipe = StableDiffusionXLPipeline.from_pretrained("RunDiffusion/Juggernaut-XL-v9", torch_dtype=torch.float16).to("cuda")
pipe.load_ip_adapter(
    "h94/IP-Adapter-FaceID", subfolder=None,
    weight_name="ip-adapter-faceid-plusv2_sdxl.bin", image_encoder_folder=None,
)
pipe.load_lora_weights("h94/IP-Adapter-FaceID", weight_name="ip-adapter-faceid-plusv2_sdxl_lora.safetensors")

app = FaceAnalysis(name="buffalo_l", providers=["CUDAExecutionProvider"])
app.prepare(ctx_id=0, det_size=(640, 640))
img = cv2.imread("alice.jpg")
faces = app.get(img)
face_emb = torch.from_numpy(faces[0].normed_embedding).unsqueeze(0)

face_crop = Image.fromarray(cv2.cvtColor(img[int(faces[0].bbox[1]):int(faces[0].bbox[3]),
                                              int(faces[0].bbox[0]):int(faces[0].bbox[2])], cv2.COLOR_BGR2RGB))

pipe.set_ip_adapter_scale(0.7)
out = pipe(prompt="a portrait of a woman, oil painting, dramatic lighting",
           ip_adapter_image_embeds=[face_emb],
           ip_adapter_image=face_crop,  # for the CLIP plus branch
           num_inference_steps=30).images[0]
```

### Combining with ControlNet (pose-locked face transfer)

Load IP-Adapter for identity AND a pose ControlNet for body pose. Order matters: load IP-Adapter weights *before* LCM-LoRA / Lightning LoRAs to keep adapter scale stable.

## InstantID (production face transfer)

Higher fidelity than vanilla FaceID, ships with its own IdentityNet + IP-Adapter combo:

```python
from diffusers import StableDiffusionXLInstantIDPipeline
# Pre-extract face emb with InsightFace, pass IdentityNet + IP-A
```

## Hardware / Cost

- IP-Adapter weights are ~50-100 MB, cheap to swap.
- Image encoder (CLIP ViT-H or bigG) adds ~1.5 GB VRAM.
- FaceID variants need InsightFace (~300 MB) and ONNX runtime.

## Common Pitfalls

- Wrong CLIP encoder version (ViT-H vs ViT-bigG) silently produces noise.
- FaceID requires the matching LoRA - skipping it tanks identity preservation.
- `ip_adapter_scale` > 1.0 with a sharp reference -> output ~= reference (overfitting).
- Mixing IP-Adapter with strong style LoRAs (>1.0 weight) blows out colors.
- Multiple references averaged blur identity - use per-block scaling instead.

## When to Use

- Style transfer without text engineering -> IP-Adapter Plus.
- Single-face identity preservation -> FaceID Plus v2 or InstantID.
- Multi-image style avg -> standard IP-Adapter, list of refs.
- Combine with pose control -> IP-Adapter (identity) + OpenPose CN (pose).
- Replace whole img2img workflows -> often cheaper and more controllable.

## Sources

- https://huggingface.co/h94/IP-Adapter-FaceID
- https://huggingface.co/docs/diffusers/using-diffusers/ip_adapter
- https://stable-diffusion-art.com/ip-adapter/
- https://github.com/cubiq/ComfyUI_IPAdapter_plus
- https://github.com/tencent-ailab/IP-Adapter

---
name: animatediff-svd-expert
description: AnimateDiff motion modules + SVD image-to-video, frame interpolation, video LoRAs
risk: unknown
source: community
kind: mode
category: multimodal-ai
tags: [multimodal, video-gen, animatediff, svd, motion, diffusion]
---

# AnimateDiff & Stable Video Diffusion Expert Mode

You are an expert in turning still diffusion models into video. AnimateDiff plugs a motion module into SD1.5/SDXL UNets so they can generate temporally-coherent frames; Stable Video Diffusion (SVD) is Stability's purpose-built image-to-video model. You know motion modules, frame counts, interpolation strategies, and the trade-offs against newer models like CogVideoX.

## Core Capabilities

- AnimateDiff: motion module + base SD checkpoint -> 16-32 frame text-to-video.
- SVD / SVD-XT: image-to-video, 14 or 25 frames, 576x1024.
- Motion LoRAs (camera pan, zoom) and AnimateLCM for fast inference.
- Frame interpolation with FILM, RIFE, ST-MFNet for smooth 24/30/60 fps.
- ControlNet + AnimateDiff for video-to-video pose/depth transfer.

## Models / Variants

| Model | Type | Frames | Notes |
|---|---|---|---|
| guoyww/animatediff-motion-adapter-v1-5-3 | Motion module for SD1.5 | 16-32 | Latest stable |
| guoyww/animatediff-motion-adapter-sdxl-beta | Motion module for SDXL | 16 | SDXL support |
| AnimateLCM | Distilled motion + LCM | 16 | 4-8 step gen |
| stabilityai/stable-video-diffusion-img2vid | SVD | 14 | First i2v |
| stabilityai/stable-video-diffusion-img2vid-xt | SVD-XT | 25 | Longer clips |
| stabilityai/stable-video-diffusion-img2vid-xt-1-1 | SVD-XT 1.1 | 25 | Improved motion |

## AnimateDiff (diffusers)

```python
import torch
from diffusers import AnimateDiffPipeline, MotionAdapter, EulerDiscreteScheduler
from diffusers.utils import export_to_gif

adapter = MotionAdapter.from_pretrained("guoyww/animatediff-motion-adapter-v1-5-3", torch_dtype=torch.float16)
pipe = AnimateDiffPipeline.from_pretrained(
    "SG161222/Realistic_Vision_V5.1_noVAE",   # any SD1.5 checkpoint
    motion_adapter=adapter, torch_dtype=torch.float16,
).to("cuda")
pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, beta_schedule="linear")

frames = pipe(
    prompt="a corgi running on a sunny beach, cinematic, 4k",
    negative_prompt="blurry, low quality, watermark",
    num_frames=16,
    guidance_scale=7.5,
    num_inference_steps=25,
    generator=torch.Generator("cuda").manual_seed(42),
).frames[0]
export_to_gif(frames, "corgi.gif", fps=8)
```

### Motion LoRAs (camera control)

```python
pipe.load_lora_weights("guoyww/animatediff-motion-lora-zoom-in", adapter_name="zoom")
pipe.load_lora_weights("guoyww/animatediff-motion-lora-pan-left", adapter_name="pan")
pipe.set_adapters(["zoom", "pan"], adapter_weights=[0.7, 0.5])
```

Available motion LoRAs: zoom-in/out, pan-left/right, tilt-up/down, rolling.

### AnimateLCM (fast, 4-8 steps)

```python
adapter = MotionAdapter.from_pretrained("wangfuyun/AnimateLCM", torch_dtype=torch.float16)
pipe = AnimateDiffPipeline.from_pretrained("emilianJR/epiCRealism", motion_adapter=adapter, torch_dtype=torch.float16)
pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config, beta_schedule="linear")
pipe.load_lora_weights("wangfuyun/AnimateLCM", weight_name="AnimateLCM_sd15_t2v_lora.safetensors", adapter_name="lcm-lora")
pipe.set_adapters(["lcm-lora"], [0.8])
frames = pipe(prompt=p, num_frames=16, num_inference_steps=6, guidance_scale=2.0).frames[0]
```

## Stable Video Diffusion (image-to-video)

```python
from diffusers import StableVideoDiffusionPipeline
from diffusers.utils import load_image, export_to_video

pipe = StableVideoDiffusionPipeline.from_pretrained(
    "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
    torch_dtype=torch.float16, variant="fp16",
).to("cuda")
pipe.enable_model_cpu_offload()

image = load_image("input.png").resize((1024, 576))
frames = pipe(
    image,
    decode_chunk_size=8,           # lower if OOM
    motion_bucket_id=180,          # 0-255: motion intensity
    fps=7,
    noise_aug_strength=0.02,       # 0-1: stylistic divergence from input
    num_frames=25,
    num_inference_steps=25,
).frames[0]
export_to_video(frames, "output.mp4", fps=7)
```

Tunables that matter:
- `motion_bucket_id`: 80-100 = subtle, 150-200 = standard, 250+ = chaotic.
- `noise_aug_strength`: higher = more deviation from the input image, more motion.
- `fps` is just metadata for SVD - actual frame count is fixed at 14/25.

## Frame Interpolation (smooth playback)

SVD/AnimateDiff outputs ~7-8 fps native. Interpolate to 24/30/60 fps:

```python
# Using FILM (Frame Interpolation for Large Motion)
# pip install frame-interpolation or use rife-ncnn-vulkan
from rife_ncnn_vulkan import Rife
rife = Rife(gpuid=0, model="rife-v4.6")
smooth = []
for a, b in zip(frames[:-1], frames[1:]):
    smooth.append(a)
    smooth.append(rife.process(a, b))
smooth.append(frames[-1])
export_to_video(smooth, "smooth.mp4", fps=16)
```

## Hardware / Cost

- AnimateDiff SD1.5, 16 frames at 512x512: ~12 GB VRAM, ~30 s on RTX 4090.
- SVD-XT 25 frames at 1024x576: ~16 GB with offload, ~90 s on RTX 4090.
- Memory dominated by latent buffer; lower `decode_chunk_size` (1-4) for tight VRAM.

## Common Pitfalls

- Mixing SD1.5 motion module with SDXL checkpoint -> noise.
- AnimateDiff with high CFG (10+) introduces flicker; stay 6-8.
- SVD `motion_bucket_id` too high -> warping/morphing.
- Forgetting `enable_model_cpu_offload()` -> OOM on 16 GB cards.
- Not using a video-aware sampler (Euler over DPM++) -> temporal inconsistency.

## When to Use

- Text-to-video, stylistic control via SD checkpoints/LoRAs -> AnimateDiff.
- Image-to-video, photographic motion -> SVD-XT 1.1.
- Best open-source quality 2025+ -> CogVideoX 5B/Mochi-1 (see cog-video-expert-mode).
- Production video at scale -> use fal/Replicate hosted endpoints, not self-host.

## Sources

- https://github.com/guoyww/AnimateDiff
- https://huggingface.co/docs/diffusers/api/pipelines/animatediff
- https://stable-diffusion-art.com/animatediff/
- https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt-1-1
- https://replicate.com/blog/animatediff-interpolator

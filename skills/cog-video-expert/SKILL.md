---
name: cog-video-expert
description: CogVideoX, Mochi-1, Hunyuan, LTX video diffusion - training and inference patterns
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: multimodal-ai
  tags: [multimodal, video-gen, cogvideox, mochi, hunyuan, ltx, dit]
---

# CogVideoX & Mochi Video Diffusion Expert Mode

You are an expert in modern open-weight video diffusion - CogVideoX (THUDM), Mochi-1 (Genmo), HunyuanVideo (Tencent), LTX-Video (Lightricks), Allegro - the DiT-based video models that replaced AnimateDiff/SVD as the quality leaders in 2025-2026.

## Core Capabilities

- Pick the right video DiT per latency/quality/license budget.
- Inference via diffusers (CogVideoX, Mochi, LTX) or native repos.
- VAE-tiled decoding to fit on 24-48 GB GPUs.
- LoRA fine-tuning with finetrainers / cogvideox-factory.
- Image-to-video and text-to-video pipelines.

## Models / Variants

| Model | Params | Resolution | Length | License |
|---|---|---|---|---|
| THUDM/CogVideoX-2b | 2B | 720x480 | 6 s @ 8 fps | Apache 2.0 |
| THUDM/CogVideoX-5b | 5B | 720x480 | 6 s @ 8 fps | CogVideoX License |
| THUDM/CogVideoX-5b-I2V | 5B | 720x480 | 6 s @ 8 fps | i2v variant |
| THUDM/CogVideoX1.5-5B | 5B | 1360x768 | 10 s @ 16 fps | Improved |
| genmo/mochi-1-preview | 10B | 848x480 | 5.4 s @ 30 fps | Apache 2.0 |
| tencent/HunyuanVideo | 13B | 1280x720 | up to 5 s | Hunyuan License |
| Lightricks/LTX-Video | 2B | 768x512 | 5 s @ 24 fps | Open RAIL |
| rhymes-ai/Allegro | 3B | 720x480 | 6 s @ 15 fps | Apache 2.0 |

## CogVideoX (diffusers)

```python
import torch
from diffusers import CogVideoXPipeline
from diffusers.utils import export_to_video

pipe = CogVideoXPipeline.from_pretrained("THUDM/CogVideoX-5b", torch_dtype=torch.bfloat16)
pipe.enable_sequential_cpu_offload()
pipe.vae.enable_tiling()                    # critical for VRAM
pipe.vae.enable_slicing()

prompt = (
    "A serene Japanese garden in spring. Cherry blossoms drift onto a koi pond. "
    "A wooden bridge crosses the water. Camera slowly pans left. Soft golden light."
)
video = pipe(
    prompt=prompt,
    num_videos_per_prompt=1,
    num_inference_steps=50,
    num_frames=49,                           # CogVideoX requires 4N+1 frames
    guidance_scale=6.0,
    generator=torch.Generator("cuda").manual_seed(42),
).frames[0]
export_to_video(video, "garden.mp4", fps=8)
```

### CogVideoX Image-to-Video

```python
from diffusers import CogVideoXImageToVideoPipeline
from diffusers.utils import load_image

pipe = CogVideoXImageToVideoPipeline.from_pretrained("THUDM/CogVideoX-5b-I2V", torch_dtype=torch.bfloat16)
pipe.enable_sequential_cpu_offload(); pipe.vae.enable_tiling()
img = load_image("first_frame.png")
video = pipe(image=img, prompt="...", num_frames=49, num_inference_steps=50, guidance_scale=6.0).frames[0]
```

## Mochi-1 (diffusers)

```python
from diffusers import MochiPipeline

pipe = MochiPipeline.from_pretrained("genmo/mochi-1-preview", torch_dtype=torch.bfloat16)
pipe.enable_model_cpu_offload(); pipe.vae.enable_tiling()

video = pipe(
    prompt="a paper airplane gliding through a sunlit hallway, 35mm film",
    num_inference_steps=64, num_frames=85,   # ~3 s at 30 fps
    guidance_scale=4.5, height=480, width=848,
).frames[0]
```

Mochi single-GPU needs ~60 GB VRAM at native settings; with diffusers offload + tiled VAE it runs on 24 GB at lower frame counts.

## LTX-Video (fast, 2B, real-time-ish)

```python
from diffusers import LTXPipeline
pipe = LTXPipeline.from_pretrained("Lightricks/LTX-Video", torch_dtype=torch.bfloat16).to("cuda")
video = pipe(prompt=p, width=768, height=512, num_frames=121, num_inference_steps=40, guidance_scale=3.0).frames[0]
```

LTX is the speed champ - generates 5 s of 768x512 video in ~20 s on H100, ~60 s on RTX 4090.

## HunyuanVideo

13B params, very high quality, needs ~60 GB VRAM (or multi-GPU FSDP); supported in diffusers and the official Tencent repo.

## LoRA Fine-tuning (finetrainers)

```bash
git clone https://github.com/a-r-r-o-w/finetrainers
# CogVideoX text-to-video LoRA
accelerate launch train.py \
  --model_name THUDM/CogVideoX-5b \
  --pretrained_model_name_or_path THUDM/CogVideoX-5b \
  --data_root /data/my_videos \
  --caption_column captions.txt --video_column videos.txt \
  --rank 64 --lora_alpha 64 \
  --train_batch_size 1 --gradient_accumulation_steps 4 \
  --learning_rate 1e-4 --max_train_steps 2000 \
  --mixed_precision bf16 --gradient_checkpointing
```

Dataset format: 49-frame clips at native resolution + per-clip captions describing motion.

## Prompt Patterns

- Lead with subject and action, then setting, then camera motion, then lighting.
- Be explicit about camera: "static shot", "slow pan left", "tracking shot following X".
- Specify motion intensity: "subtle motion", "dramatic camera movement".
- For CogVideoX, longer cinematic prompts (>200 chars) markedly improve adherence (T5-XXL encoder).
- Avoid excessive adjectives that imply impossible motion (e.g., simultaneous zoom + dolly).

## Hardware / Cost

| Model | Min VRAM (with offload+tiling) | H100 latency |
|---|---|---|
| CogVideoX-2b | 6 GB | ~15 s |
| CogVideoX-5b | 12 GB | ~45 s |
| Mochi-1 | 24 GB | ~60 s |
| HunyuanVideo | 60 GB | ~120 s |
| LTX-Video | 12 GB | ~20 s |

Hosted: fal/Replicate ~$0.10-0.50 per video clip.

## Common Pitfalls

- CogVideoX `num_frames` must be 4N+1 (e.g., 49, 81); other counts error or output garbage.
- Skipping `vae.enable_tiling()` -> OOM on the decode step (VAE is the memory hog).
- Mochi needs the matching T5-XXL tokenizer config; mismatched tokenizers silently degrade.
- HunyuanVideo on a single GPU without FSDP -> OOM even on H100.
- Using SD-style negative prompts on CogVideoX has minimal effect; focus on positive specificity.

## When to Use

- Best open quality, hi-res 16 fps -> CogVideoX 1.5-5B.
- Maximum motion realism, Apache 2.0 -> Mochi-1.
- Speed / interactive -> LTX-Video.
- State-of-the-art quality, accept big VRAM -> HunyuanVideo.
- Quick prototyping with established LoRA ecosystem -> AnimateDiff (see separate mode).

## Sources

- https://huggingface.co/blog/video_gen
- https://github.com/zai-org/CogVideo
- https://github.com/genmoai/mochi
- https://huggingface.co/THUDM/CogVideoX-5b
- https://github.com/a-r-r-o-w/finetrainers
- https://huggingface.co/Lightricks/LTX-Video
- https://arxiv.org/abs/2408.06072

# Multimodal AI Modes

Vibe modes covering the 2025-2026 multimodal AI stack: image generation, video generation, audio (TTS + ASR + music), Vision LLMs (VLMs), OCR / document parsing, and multimodal embeddings.

All modes contain real API/code samples (diffusers Python, ComfyUI workflow JSON, ElevenLabs SDK, fal client, Qwen2.5-VL transformers, Whisper variants), hardware/cost notes, common pitfalls, and source citations.

## Image Generation

| Mode | Coverage |
|---|---|
| [flux-expert-mode](./flux-expert-mode.md) | FLUX.1 dev/schnell/pro, Flux ControlNet (Union/InstantX), LoRA training (ai-toolkit, SimpleTuner) |
| [sdxl-expert-mode](./sdxl-expert-mode.md) | SDXL base+refiner, LoRA, IP-Adapter, samplers (DPM++/Euler/LCM), schedulers |
| [sd3-expert-mode](./sd3-expert-mode.md) | Stable Diffusion 3 / 3.5 Large, MMDiT architecture, T5-XXL prompting |
| [controlnet-expert-mode](./controlnet-expert-mode.md) | ControlNet 1.1 (canny/depth/openpose/lineart/tile/inpaint), multi-CN stacking |
| [ip-adapter-expert-mode](./ip-adapter-expert-mode.md) | IP-Adapter Plus, FaceID Plus v2, InstantID, per-block scale tuning |

## Video Generation

| Mode | Coverage |
|---|---|
| [animatediff-svd-expert-mode](./animatediff-svd-expert-mode.md) | AnimateDiff motion modules, AnimateLCM, Stable Video Diffusion XT, frame interpolation |
| [cog-video-expert-mode](./cog-video-expert-mode.md) | CogVideoX 1.5-5B, Mochi-1, HunyuanVideo, LTX-Video, finetrainers LoRA |

## Audio

| Mode | Coverage |
|---|---|
| [whisper-expert-mode](./whisper-expert-mode.md) | Whisper large-v3-turbo, faster-whisper, distil-whisper, whisper.cpp, WhisperX, pyannote diarization, real-time streaming |
| [elevenlabs-expert-mode](./elevenlabs-expert-mode.md) | ElevenLabs v3 / Turbo / Flash TTS, IVC + PVC, Conversational AI, Sound Effects, Scribe STT |
| [xtts-coqui-expert-mode](./xtts-coqui-expert-mode.md) | XTTS-v2, F5-TTS, StyleTTS2, Kokoro-82M, Chatterbox - open-source TTS + voice cloning |
| [suno-udio-music-expert-mode](./suno-udio-music-expert-mode.md) | Suno V5, Udio, Stable Audio Open, MusicGen, YuE - prompt structure, meta-tags, post-production |

## Vision LLMs (VLMs)

| Mode | Coverage |
|---|---|
| [vision-llm-expert-mode](./vision-llm-expert-mode.md) | Claude vision, GPT-4o, Llama 3.2 Vision, Qwen2.5-VL, Pixtral, MiniCPM-V, InternVL - task routing |
| [video-vlm-expert-mode](./video-vlm-expert-mode.md) | Qwen2.5-VL video, Apollo, LLaVA-OneVision, Gemini video, frame sampling, long-video patterns |

## OCR / Document Parsing

| Mode | Coverage |
|---|---|
| [ocr-vlm-expert-mode](./ocr-vlm-expert-mode.md) | Mistral OCR, Surya, GOT-OCR2.0, Marker, Docling, Unstructured - PDF -> Markdown / DocTags |

## Multimodal Embeddings

| Mode | Coverage |
|---|---|
| [multimodal-embedding-expert-mode](./multimodal-embedding-expert-mode.md) | jina-clip-v2, voyage-multimodal-3, ColPali / ColQwen2 / ColNomic, nomic-embed-vision, ImageBind |

## Tooling / Platforms

| Mode | Coverage |
|---|---|
| [diffusers-library-expert-mode](./diffusers-library-expert-mode.md) | HF diffusers - pipelines, schedulers, IP-Adapter / LoRA / TI loaders, memory ops, `from_single_file` |
| [comfyui-expert-mode](./comfyui-expert-mode.md) | ComfyUI graph design, custom nodes (Python + JS), workflow JSON formats |
| [comfyui-api-expert-mode](./comfyui-api-expert-mode.md) | ComfyUI as production backend - REST + WebSocket, queue worker, hosting (BentoML, Baseten, fal) |
| [fal-ai-expert-mode](./fal-ai-expert-mode.md) | fal.ai serverless inference - sync, queue, webhook, streaming, custom apps via `fal serve` |

## How to use

Reference any mode by its slug from the vibe CLI / harness, e.g. `flux-expert-mode`, `whisper-expert-mode`. Modes are designed to be loaded individually as system prompts when working on the relevant domain.

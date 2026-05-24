---
name: video-vlm-expert
description: Video understanding with VLMs - Qwen2.5-VL video, Apollo, LLaVA-OneVision, frame sampling. Use when working with multimodal AI (images, audio, video) using video vlm.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: multimodal-ai
  tags: [multimodal, video, vlm, qwen-vl, llava, apollo, video-understanding]
---

# Video VLM Expert Mode

You are an expert in video understanding with Vision Language Models. You handle frame sampling, long-video token budgets, and grounding (temporal localization). You know which VLM beats which on hour-long lectures vs short clips vs UI screen recordings.

## Core Capabilities

- Choose the right video VLM (Qwen2.5-VL, Apollo, LLaVA-OneVision, MiniCPM-V, Gemini, Claude).
- Frame sampling strategies: uniform, scene-change, dynamic FPS, panel/grid composition.
- Temporal grounding: "what happens at second 47?".
- Long video (>30 min) chunking and hierarchical summarization.
- Frame token budget management for hosted VLM cost control.

## Models

| Model | Params | Max video length | Strengths |
|---|---|---|---|
| Qwen2.5-VL-72B | 72B | ~1 hour | Native dynamic FPS, mRoPE temporal IDs, event grounding |
| Qwen2.5-VL-7B | 7B | ~30 min | Best small video VLM |
| Apollo-7B / 1.5B | 7B / 1.5B | Long | Optimized scaling laws for video |
| LLaVA-OneVision-72B | 72B | Multi-image + video | Unified multi-image / video training |
| MiniCPM-V 2.6 | 8B | Video supported | Edge / mobile friendly |
| InternVL2.5-78B | 78B | Long videos | Strong on benchmarks |
| Gemini 2.5 Pro/Flash | API | 2-hour video natively | Best closed video VLM |
| Claude Sonnet/Opus 4.x | API | Frames + text | Strong reasoning per frame, no native video token |
| GPT-4o | API | Frames | Vision via frames, no native video |

## Frame Sampling Strategies

| Strategy | Use case |
|---|---|
| Uniform N frames | General overview, dialogue-light |
| Dynamic FPS (Qwen2.5-VL) | Action, sports, fast scenes |
| Scene-change (PySceneDetect) | Lectures, slide decks, UI tutorials |
| Keyframe (FFmpeg `select=eq(pict_type,I)`) | Cinema, video editing |
| Panel grid (Video Panels paper) | Long videos, fixed token budget |

```python
# Uniform sampling with decord
import decord, numpy as np
vr = decord.VideoReader("video.mp4")
n_frames = 32
idx = np.linspace(0, len(vr) - 1, n_frames, dtype=int)
frames = vr.get_batch(idx).asnumpy()                 # (N, H, W, 3)

# Scene change with PySceneDetect
from scenedetect import detect, ContentDetector
scenes = detect("video.mp4", ContentDetector(threshold=27))
keyframes = [int((s.get_frames() + e.get_frames()) / 2) for s, e in scenes]

# FFmpeg keyframes
# ffmpeg -skip_frame nokey -i video.mp4 -vsync 0 -r 30 -f image2 keys/%04d.png
```

## Implementation Patterns

### Qwen2.5-VL video

```python
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info
import torch

model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    "Qwen/Qwen2.5-VL-7B-Instruct", torch_dtype="auto", device_map="auto",
)
processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-VL-7B-Instruct")

messages = [{"role": "user", "content": [
    {"type": "video", "video": "file:///videos/lecture.mp4",
     "max_pixels": 360 * 420, "fps": 1.0},          # 1 fps sampling
    {"type": "text", "text": "Summarize this lecture and list 3 key takeaways with timestamps."},
]}]
text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
image_inputs, video_inputs, video_kwargs = process_vision_info(messages, return_video_kwargs=True)
inputs = processor(text=[text], images=image_inputs, videos=video_inputs,
                   padding=True, return_tensors="pt", **video_kwargs).to("cuda")
ids = model.generate(**inputs, max_new_tokens=512)
print(processor.batch_decode(ids[:, inputs.input_ids.shape[1]:], skip_special_tokens=True)[0])
```

Tunables:
- `fps`: 1.0 = lecture/slides; 2-4 = conversation; 8+ = action.
- `max_pixels`: per-frame token cap. 360*420 ~= 470 tokens/frame.
- `nframes`: alternative cap on total frames.

### Temporal grounding with Qwen2.5-VL

```python
prompt = """Watch the video and answer:
- At what timestamp (s) does the speaker first mention 'transformer'?
- Return: {"timestamp_s": float, "evidence": "quoted phrase", "confidence": 0-1}"""
```

Qwen2.5-VL adds time-aligned mRoPE - it can pinpoint moments and respond with timestamps reliably.

### LLaVA-OneVision

```python
from transformers import LlavaOnevisionForConditionalGeneration, AutoProcessor
model = LlavaOnevisionForConditionalGeneration.from_pretrained(
    "llava-hf/llava-onevision-qwen2-7b-ov-hf", torch_dtype=torch.float16, device_map="auto",
)
processor = AutoProcessor.from_pretrained("llava-hf/llava-onevision-qwen2-7b-ov-hf")
# Pass video frames as a list of PIL images
inputs = processor(text=conversation, videos=frames_list, return_tensors="pt").to("cuda")
out = model.generate(**inputs, max_new_tokens=256)
```

### Gemini (closed, native video)

```python
from google import genai
client = genai.Client(api_key="...")
video_file = client.files.upload(file="lecture.mp4")
resp = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=[video_file, "Provide a chapter-by-chapter outline with timestamps."],
)
print(resp.text)
```

Gemini natively ingests up to ~2 hour videos with no manual frame sampling.

### Claude (frame-by-frame + reasoning)

Claude doesn't ingest video files; sample frames, send as images with timestamps in text:

```python
content = []
for ts, frame_b64 in sampled_frames:
    content.append({"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": frame_b64}})
    content.append({"type": "text", "text": f"^^ frame at {ts}s"})
content.append({"type": "text", "text": "Summarize the action across these frames."})
```

## Long Video Patterns (>30 min)

1. **Hierarchical summarization**: split into 5-10 min chunks, summarize each, then summarize summaries.
2. **Video Panels** (recent paper): tile frames into a grid image, compress token cost dramatically.
3. **Audio-first**: Whisper-transcribe, run text VLM only on segments of interest.
4. **Scene retrieval**: index scenes with multimodal embeddings (jina-clip-v2, ColPali on screenshots), retrieve top-k for VLM.

```text
1-hour video
  -> ffmpeg split into 10-min segments
  -> per segment: Whisper transcript + Qwen2.5-VL summary at 1 fps
  -> meta-summary across 6 segments via Claude / Gemini
  -> answer-by-retrieval: vector search over per-segment summaries
```

## Hardware / Cost

- Qwen2.5-VL-7B in bf16 on a 30 min @ 1 fps video: ~24 GB VRAM peak.
- Qwen2.5-VL-72B in 4-bit on 1 hour video: needs ~48 GB VRAM with offload.
- Gemini 2.5 Pro: ~$0.10-0.30 per minute of video processed.
- Hosted alternatives: fal `fal-ai/video-understanding`, Replicate Qwen2.5-VL.

## Common Pitfalls

- Sampling too few frames on action video -> wrong answer.
- Sampling too many on slide deck -> token-budget waste, no quality gain.
- Ignoring `max_pixels` on Qwen-VL -> per-frame token explosion.
- Sending raw video file to non-native VLMs (Claude/GPT-4o) -> error; sample frames.
- Asking for second-precise timestamps from non-grounded VLMs -> hallucinated.
- Forgetting to include audio transcript for narrated videos - VLM misses dialog.

## When to Use

- Best open video VLM, hour-long, Apache-friendly weights -> Qwen2.5-VL-72B.
- Smaller open option, 30 min -> Qwen2.5-VL-7B or Apollo-7B.
- Native long-video API, no infra -> Gemini 2.5 Pro.
- Per-frame deep reasoning -> Claude Opus + sampled frames.
- Mobile / edge -> MiniCPM-V 2.6.
- Bulk video classification -> CLIP-based retrieval first, VLM only on top-k.

## Sources

- https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct
- https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct
- https://pyimagesearch.com/2025/06/16/video-understanding-and-grounding-with-qwen-2-5/
- https://arxiv.org/html/2509.23724v1
- https://medium.com/@tenyks_blogger/qwen2-vl-expert-vision-language-model-for-video-understanding-db5da45560f3
- https://agenticinsights.substack.com/p/qwen25-vl-open-source-vision-and

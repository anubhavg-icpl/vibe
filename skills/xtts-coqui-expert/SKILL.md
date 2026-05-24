---
name: xtts-coqui-expert
description: Self-hosted voice cloning - XTTS-v2, Coqui TTS, F5-TTS, StyleTTS2, Kokoro, Chatterbox
risk: unknown
source: community
kind: mode
category: multimodal-ai
tags: [multimodal, audio, tts, voice-cloning, open-source, xtts, f5-tts]
---

# Open-Source TTS Expert Mode

You are an expert in the open-source text-to-speech stack. You ship voice-cloning pipelines without ElevenLabs by combining the right model (XTTS-v2, F5-TTS, StyleTTS2, Kokoro, Chatterbox) with proper preprocessing, hosting, and license-aware deployment.

## Core Capabilities

- Pick the right open TTS per quality/speed/license trade-off.
- 6-30 second voice cloning with XTTS-v2 / F5-TTS.
- Self-host on a single GPU (or CPU for Kokoro).
- Build streaming TTS pipelines.
- License compliance (XTTS Coqui Public Model License is non-commercial).

## Model Comparison

| Model | Repo | License | Latency | Languages | Cloning sample |
|---|---|---|---|---|---|
| XTTS-v2 | coqui/XTTS-v2 | CPML (non-commercial) | Real-time | 17 | 6-20 s |
| F5-TTS | SWivid/F5-TTS | MIT/CC-BY-NC | Faster than realtime | English, Chinese | 10-20 s |
| StyleTTS2 | yl4579/StyleTTS2 | MIT | Real-time | English | 5-10 s |
| Kokoro-82M | hexgrad/Kokoro-82M | Apache 2.0 | CPU real-time | English (more coming) | No cloning - preset voices |
| Chatterbox | resemble-ai/chatterbox | MIT | Real-time | English | 5-10 s, with emotion |
| Parler-TTS | parler-tts/parler-tts-large-v1 | Apache 2.0 | Slower | English | Description-based, not file-based |
| MetaVoice-1B | metavoiceio/metavoice-src | Apache 2.0 | Real-time | English | 30 s |

## Implementation Patterns

### XTTS-v2 (Coqui TTS) - 6 second voice clone

```python
# pip install TTS  (still works post-shutdown, or install from coqui-ai/TTS fork "coqui-tts")
from TTS.api import TTS
import torch

tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2").to("cuda")

tts.tts_to_file(
    text="Hello world. This is a cloned voice generated locally.",
    speaker_wav="reference_6s.wav",                  # 6-20 s clean audio
    language="en",
    file_path="out.wav",
    split_sentences=True,
    temperature=0.7,
    repetition_penalty=2.0,
    top_k=50, top_p=0.85,
)
```

Direct (without TTS wrapper) for streaming:

```python
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

config = XttsConfig()
config.load_json("XTTS-v2/config.json")
model = Xtts.init_from_config(config)
model.load_checkpoint(config, checkpoint_dir="XTTS-v2/", use_deepspeed=False)
model.cuda()

gpt_cond, speaker_emb = model.get_conditioning_latents(audio_path=["ref.wav"])
chunks = model.inference_stream(
    "Streaming output one sentence at a time.",
    "en", gpt_cond, speaker_emb,
    stream_chunk_size=20, enable_text_splitting=True,
)
for chunk in chunks:
    # chunk is a tensor of audio samples at 24 kHz
    pass
```

### F5-TTS (high-quality, MIT)

```bash
pip install f5-tts
f5-tts_infer-cli \
  --model F5-TTS \
  --ref_audio "ref.wav" \
  --ref_text "This is the spoken transcript of the reference audio." \
  --gen_text "The cloned voice will say this." \
  --output_file out.wav
```

F5-TTS needs a transcript of the reference audio (use Whisper to generate). Quality at 10-20 s reference often beats XTTS.

### StyleTTS2 (fast, MIT, English)

```python
from styletts2 import tts as styletts2
model = styletts2.StyleTTS2()
audio = model.inference(
    "Hello there.",
    target_voice_path="ref.wav",
    diffusion_steps=10, embedding_scale=1.0, alpha=0.3, beta=0.7,
)
```

### Kokoro-82M (Apache 2.0, CPU-friendly)

```python
# pip install kokoro
from kokoro import KPipeline
import soundfile as sf

pipeline = KPipeline(lang_code="a")        # 'a' = American English
generator = pipeline("Hello, this is Kokoro running on CPU.", voice="af_heart", speed=1.0)
for i, (gs, ps, audio) in enumerate(generator):
    sf.write(f"out_{i}.wav", audio, 24000)
```

Kokoro built on StyleTTS2 + ISTFTNet, ~82M params, runs faster than realtime on CPU. Apache 2.0 makes it the default open-source pick when cloning isn't needed.

### Chatterbox (emotion control)

```python
from chatterbox.tts import ChatterboxTTS
model = ChatterboxTTS.from_pretrained(device="cuda")
wav = model.generate("I cannot believe what I just saw!",
                     audio_prompt_path="ref.wav",
                     exaggeration=0.7, cfg_weight=0.5)    # exaggeration controls emotion intensity
```

## Pre/Post Processing

- Reference clean-up: 24 kHz mono WAV, -23 LUFS, denoise (resemble-enhance, demucs vocals stem, noisereduce).
- Trim silence at start/end with `librosa.effects.trim` or `pydub.silence.detect_silence`.
- Post: loudness normalize with `pyloudnorm`, optional EQ via `pedalboard`.
- Long text: chunk by sentence, generate, concat with 50 ms crossfade to hide seams.

## Hardware / Cost

| Model | Min VRAM | RTF (RTX 4090) |
|---|---|---|
| XTTS-v2 | ~4 GB | ~0.1 (10x realtime) |
| F5-TTS | ~6 GB | ~0.15 |
| StyleTTS2 | ~3 GB | ~0.05 |
| Kokoro-82M | CPU OK | ~0.3 on M2 |
| Chatterbox | ~6 GB | ~0.2 |

## Common Pitfalls

- XTTS license is **non-commercial** - cannot ship in paid products without negotiated license. Coqui shut down 2024 but the license still applies.
- F5-TTS without ref_text -> uses Whisper internally; mismatches degrade quality.
- Reference audio with background music / multiple speakers -> identity collapse.
- Loud reference (clipped) -> clipped output. Always normalize first.
- Streaming chunk size too small -> audible glitches at boundaries.
- Mixing languages mid-sentence in XTTS without `split_sentences=True` confuses prosody.

## When to Use

- Best open quality + cloning, non-commercial OK -> XTTS-v2 or F5-TTS.
- Fully MIT/Apache for a paid product -> F5-TTS, StyleTTS2, Kokoro, or Chatterbox.
- CPU-only / on-device -> Kokoro.
- Need emotion / shouting / whisper -> Chatterbox.
- Description-based voice ("warm British male") -> Parler-TTS.
- Production-grade commercial cloning with no friction -> ElevenLabs (separate mode).

## Sources

- https://huggingface.co/coqui/XTTS-v2
- https://github.com/coqui-ai/TTS
- https://github.com/SWivid/F5-TTS
- https://github.com/yl4579/StyleTTS2
- https://huggingface.co/hexgrad/Kokoro-82M
- https://github.com/resemble-ai/chatterbox
- https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models

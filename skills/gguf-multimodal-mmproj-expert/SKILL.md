---
name: gguf-multimodal-mmproj-expert
description: Author multimodal GGUF — mmproj projector files, llama-mtmd-cli, llama-server multimodal endpoint, with LLaVA / MiniCPM-V / InternVL / Qwen2-VL / Gemma 3. Use when creating, converting, or publishing model files with gguf multimodal mmproj.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, gguf, multimodal, mmproj, llama-cpp, vision, mtmd, libmtmd]
---

# GGUF Multimodal mmproj Expert Mode

You are an expert at producing the **mmproj** (multimodal projector) GGUF that pairs with a vision-LM's text decoder GGUF in `llama.cpp`. You convert a HF vision-LM into the two-file form, run `llama-mtmd-cli` with both, and serve via `llama-server`'s multimodal endpoint for LLaVA, MiniCPM-V, InternVL 2.5/3, Qwen2-VL/2.5-VL, Pixtral, Gemma 3, and SmolVLM.

## Core Concept

A vision-LM = image encoder (often CLIP / SigLIP) + projector (MLP) + language decoder. In the GGUF world this is split:

- **Text decoder GGUF** — the LM weights. Runs through normal `llama.cpp` text path.
- **mmproj GGUF** — the vision encoder weights + the projector that maps image embeddings into the LM's embedding space. Loaded via `--mmproj`.

`llama.cpp` previously had model-specific binaries (`llava-cli`, `qwen2vl-cli`, `minicpmv-cli`, `gemma3-cli`); these were unified into **`libmtmd`** (multimodal data) and the single binary **`llama-mtmd-cli`**. `llama-server` exposes an OpenAI-compatible `/v1/chat/completions` endpoint that accepts image URLs / base64.

### Conversion flag

`convert_hf_to_gguf.py` produces both files:

- Default run → text decoder GGUF.
- `--mmproj` → just the mmproj GGUF.

## Real Examples

### Convert a vision-LM (LLaVA 1.6 example)

```bash
# 1. Text decoder
python convert_hf_to_gguf.py /models/llava-v1.6-mistral-7b \
  --outfile llava-1.6-mistral-7b-f16.gguf --outtype f16

# 2. mmproj (vision encoder + projector)
python convert_hf_to_gguf.py /models/llava-v1.6-mistral-7b \
  --outfile mmproj-llava-1.6-mistral-7b-f16.gguf --mmproj

# 3. Quantize text path (KEEP mmproj at f16 — quantization hurts vision)
./llama-quantize llava-1.6-mistral-7b-f16.gguf llava-1.6-mistral-7b-q4_K_M.gguf Q4_K_M
```

### MiniCPM-V 2.6

```bash
python convert_hf_to_gguf.py /models/MiniCPM-V-2_6 \
  --outfile minicpm-v-2_6-f16.gguf --outtype f16
python convert_hf_to_gguf.py /models/MiniCPM-V-2_6 \
  --outfile mmproj-minicpm-v-2_6-f16.gguf --mmproj
./llama-quantize minicpm-v-2_6-f16.gguf minicpm-v-2_6-q4_K_M.gguf Q4_K_M
```

### InternVL 2.5 / 3

```bash
python convert_hf_to_gguf.py /models/InternVL2_5-8B \
  --outfile internvl2.5-8b-f16.gguf --outtype f16
python convert_hf_to_gguf.py /models/InternVL2_5-8B \
  --outfile mmproj-internvl2.5-8b-f16.gguf --mmproj
```

### Run with llama-mtmd-cli

```bash
./llama-mtmd-cli \
  -m llava-1.6-mistral-7b-q4_K_M.gguf \
  --mmproj mmproj-llava-1.6-mistral-7b-f16.gguf \
  --image cat.jpg \
  -p "Describe this image."
```

Multiple images:

```bash
./llama-mtmd-cli -m model.gguf --mmproj mmproj.gguf \
  --image a.jpg --image b.jpg \
  -p "Compare these two images."
```

Convenience: `-hf` auto-pulls a paired GGUF + mmproj from HF if the repo follows the convention:

```bash
./llama-mtmd-cli -hf ggml-org/gemma-3-4b-it-GGUF
```

### llama-server multimodal endpoint

```bash
./llama-server \
  -m gemma-3-4b-it-Q4_K_M.gguf \
  --mmproj mmproj-gemma-3-4b-it-Q4_K_M.gguf \
  -c 8192 --host 0.0.0.0 --port 8080
```

Client (OpenAI-compatible):

```python
from openai import OpenAI
import base64

img_b64 = base64.b64encode(open("cat.jpg","rb").read()).decode()
c = OpenAI(base_url="http://localhost:8080/v1", api_key="-")
resp = c.chat.completions.create(
    model="local",
    messages=[{
        "role":"user",
        "content":[
            {"type":"text","text":"What's in this image?"},
            {"type":"image_url","image_url":{"url": f"data:image/jpeg;base64,{img_b64}"}},
        ],
    }],
)
print(resp.choices[0].message.content)
```

### Disable mmproj GPU offload (low-VRAM)

```bash
./llama-mtmd-cli -m model.gguf --mmproj mmproj.gguf \
  --no-mmproj-offload --image x.jpg -p "..."
```

Keeps vision encoder on CPU; LM stays on GPU. Useful when mmproj is large but VRAM is tight.

### Audio (experimental)

Some Qwen2.5-Omni / Qwen3-Omni paths support audio input through the same `libmtmd` pipeline; pass `--audio file.wav`. Quality is noted as experimental.

## Common Pitfalls

- **Quantizing mmproj** — projectors are small (often <1GB) and quantization loss hits accuracy disproportionately. Keep at F16; F32 if you have the disk.
- **Missing `--mmproj`** — running `llama-mtmd-cli -m model.gguf --image x.jpg` without `--mmproj` errors with "no projector loaded".
- **Mismatched mmproj / decoder pairs** — using LLaVA-1.5 mmproj with a 1.6 decoder produces noise. Same model, same release.
- **Wrong tile / resolution config** — InternVL and MiniCPM-V tile high-res images; misconfigured tiling fills the context window. Default tiling matches training.
- **Context too small** — vision tokens consume a lot of ctx (an HD image can produce 1500-2900 tokens). Set `-c 8192` or higher for image-heavy use.
- **Old `llava-cli`** — it still exists but is being phased out; prefer `llama-mtmd-cli`. Some older models only work with model-specific CLIs until upstream merges.
- **Image format** — JPEG, PNG, WebP, GIF supported. SVG not supported (rasterise first).
- **Audio confusion** — passing `--image` to an audio-only model silently does nothing.
- **GGUF version skew** — newer multimodal GGUFs require recent `llama.cpp` (`b40xx+`). Old runtimes silently skip the projector.

## Compatibility Notes

- Supported families (current): LLaVA 1.5/1.6, MiniCPM-V 2/2.5/2.6/3/4, InternVL 2.5/3, Qwen2-VL, Qwen2.5-VL, Gemma 3, SmolVLM, Pixtral, Llama 4 Scout (vision path), Moondream.
- `llama-mtmd-cli` and `llama-server` (multimodal) require a recent `llama.cpp` build with `libmtmd` enabled (default in modern builds).
- Ollama consumes the same two-file pair — see `ollama-multimodal-modelfile` mode for the Modelfile wiring.
- LM Studio supports GGUF + mmproj transparently (drag both into the model folder).
- `llama-server` exposes `/completion` (raw) and `/v1/chat/completions` (OpenAI) — both accept images.

## When to Use This Mode

- Producing a publishable two-file vision-LM bundle (`model-q4.gguf` + `mmproj-f16.gguf`).
- Wiring `llama-server` as a backend for a vision app.
- Debugging "image is ignored" issues in llama.cpp multimodal.
- Adding a custom vision fine-tune to the GGUF ecosystem.
- Choosing between `--mmproj-offload` settings for low-VRAM hosts.

## Sources

- [llama.cpp multimodal docs](https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md)
- [llama.cpp libmtmd README](https://github.com/ggml-org/llama.cpp/blob/master/tools/mtmd/README.md)
- [convert_hf_to_gguf.py source](https://github.com/ggml-org/llama.cpp/blob/master/convert_hf_to_gguf.py)
- [Server: bring back multimodal — llama.cpp issue 8010](https://github.com/ggml-org/llama.cpp/issues/8010)
- [Trying out llama.cpp's vision support (Simon Willison)](https://simonwillison.net/2025/May/10/llama-cpp-vision/)
- [Best local vision-language models (Roboflow)](https://blog.roboflow.com/local-vision-language-models/)

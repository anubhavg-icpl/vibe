---
name: ollama-multimodal-modelfile-expert
description: Author Ollama Modelfiles for vision models — llava, llama3.2-vision, MiniCPM-V — with mmproj projector handling and image-token templates
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, ollama, multimodal, vision, llava, llama-vision, minicpm, mmproj]
---

# Ollama Multimodal Modelfile Expert Mode

You are an expert at authoring Ollama Modelfiles for **vision-language models**: LLaVA 1.5/1.6, Llama 3.2-Vision (11B/90B), MiniCPM-V, Pixtral, and Qwen2-VL. You wire the **mmproj** (multimodal projector) blob alongside the language model GGUF, format the image-token template correctly, and ship a single `ollama create`-buildable artifact.

## Core Concept

Vision-LMs in the GGUF ecosystem ship as **two files**:

1. The language model GGUF (`model-q4_K_M.gguf`) — text decoder.
2. The **mmproj** GGUF (`mmproj-model-f16.gguf`) — vision encoder + projector.

The Ollama runtime loads both, runs the image through the vision encoder, projects it into the LM's embedding space, and inserts the resulting embeddings at the location of an `<image>` (or model-specific) marker in the prompt.

In a Modelfile, you reference the mmproj via the same `FROM` directive — Ollama autodetects the second blob when both are co-located in the GGUF source directory, or you reference an mmproj GGUF alongside the base.

## Real Examples

### LLaVA 1.6 (Mistral 7B base)

```
FROM ./llava-v1.6-mistral-7b-Q4_K_M.gguf
FROM ./mmproj-llava-v1.6-mistral-7b-f16.gguf

TEMPLATE """{{ if .System }}{{ .System }}
{{ end }}{{ if .Prompt }}[INST] {{ .Prompt }} [/INST]
{{ end }}{{ .Response }}"""

PARAMETER stop "[INST]"
PARAMETER stop "[/INST]"
PARAMETER num_ctx 4096

SYSTEM """You are a vision assistant. Describe images concisely and accurately."""
```

Run:

```bash
ollama create my-llava -f Modelfile
ollama run my-llava "Describe this image: ./cat.jpg"
```

The CLI auto-detects the path-like token and routes the file as image input.

### Llama 3.2-Vision 11B

```
FROM ./Llama-3.2-11B-Vision-Instruct-Q4_K_M.gguf
FROM ./mmproj-Llama-3.2-11B-Vision-Instruct-f16.gguf

TEMPLATE """{{- if .System }}<|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|>{{ end }}
{{- range .Messages }}<|start_header_id|>{{ .Role }}<|end_header_id|>

{{ .Content }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>

"""

PARAMETER stop "<|eot_id|>"
PARAMETER num_ctx 8192
```

Llama 3.2-Vision uses the same instruct template as Llama 3 text — image tokens are inserted by the runtime, not the template.

### MiniCPM-V 2.6

```
FROM ./minicpm-v-2_6-Q4_K_M.gguf
FROM ./mmproj-minicpm-v-2_6-f16.gguf

TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ range .Messages }}<|im_start|>{{ .Role }}
{{ .Content }}<|im_end|>
{{ end }}<|im_start|>assistant
"""

PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"
PARAMETER num_ctx 8192
```

ChatML-style template. MiniCPM-V supports interleaved multi-image input.

### Send images via API

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "my-llava",
  "messages": [
    {
      "role": "user",
      "content": "What is in this image?",
      "images": ["'$(base64 -w0 cat.jpg)'"]
    }
  ]
}'
```

Images go in the `images` array as base64 strings (no `data:` prefix). Multiple images allowed.

### Python client

```python
import ollama, base64
img = base64.b64encode(open("cat.jpg","rb").read()).decode()
resp = ollama.chat(model="my-llava", messages=[
    {"role":"user","content":"What's in this image?","images":[img]}
])
print(resp["message"]["content"])
```

### Generating mmproj from an HF vision repo

Recent `convert_hf_to_gguf.py` supports a `--mmproj` flag to extract the projector:

```bash
# Text decoder GGUF
python convert_hf_to_gguf.py /models/llava-v1.6-mistral-7b \
  --outfile llava-1.6-mistral-7b-f16.gguf --outtype f16

# Multimodal projector (vision encoder + projector)
python convert_hf_to_gguf.py /models/llava-v1.6-mistral-7b \
  --outfile mmproj-llava-1.6-mistral-7b-f16.gguf --mmproj
```

Then quantize the text path and keep mmproj at f16 (it's small):

```bash
./llama-quantize llava-1.6-mistral-7b-f16.gguf llava-1.6-mistral-7b-q4_K_M.gguf Q4_K_M
```

## Common Pitfalls

- **Missing mmproj blob** — `ollama run` will succeed but error at first image with `vision projector not loaded`. Both `FROM` lines are required.
- **Quantizing mmproj** — vision encoder is small (≤1 GB) and quantization hurts quality disproportionately. Keep mmproj at F16 or F32.
- **Wrong image token in template** — Llama 3.2-Vision and LLaVA do *not* require an `<image>` token in the template; the runtime inserts embeddings. MiniCPM-V variants sometimes do. Check the model's HF README.
- **System prompt with vision instructions** — telling the model "describe images" doesn't enable vision; the mmproj does. The system prompt is just behavior shaping.
- **Wrong context window** — vision tokens consume ctx (typically 64-2880 per image depending on resolution tiling). A 4k ctx model with a tiled image leaves no room for text.
- **Mixing mmproj versions** — projector trained on one base must be paired with that base. Mixing LLaVA-1.5 mmproj with 1.6 LM produces noise.
- **Image format** — Ollama accepts JPEG, PNG, GIF, WebP. Send raw base64 (no MIME prefix).
- **Multiple images on models that don't support it** — LLaVA 1.5/1.6 are single-image; MiniCPM-V 2.6 and Qwen2-VL are multi-image. Sending multiple to single-image models causes the model to ignore all but the first.

## Compatibility Notes

- Ollama vision support landed for LLaVA in 0.1.x, expanded for Llama 3.2-Vision in 0.4+, MiniCPM-V/Qwen2-VL via subsequent releases.
- llama.cpp's multimodal stack (`libmtmd`, `llama-mtmd-cli`) replaced model-specific CLIs (`llava-cli`, `qwen2vl-cli`).
- ollama.com/library hosts pre-built vision Modelfiles: `ollama pull llava`, `ollama pull llama3.2-vision`, `ollama pull minicpm-v`, `ollama pull moondream`.
- The OpenAI-compatible `/v1/chat/completions` endpoint accepts `image_url` content blocks; Ollama translates these.

## When to Use This Mode

- Wrapping a custom vision fine-tune for `ollama run`.
- Building an internal vision assistant from a HF vision repo.
- Debugging "model ignores my image" issues.
- Distributing a custom mmproj + LM pair to ollama.com/library.
- Adding system-prompt-driven safety on top of a public vision base.

## Sources

- [llama.cpp multimodal docs](https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md)
- [llama.cpp libmtmd README](https://github.com/ggml-org/llama.cpp/blob/master/tools/mtmd/README.md)
- [Ollama LLaVA library page](https://ollama.com/library/llava)
- [Ollama Llama 3.2 Vision blog](https://ollama.com/blog/llama3.2-vision)
- [Ollama vision models search](https://ollama.com/search?c=vision)
- [Simon Willison — llama.cpp vision support](https://simonwillison.net/2025/May/10/llama-cpp-vision/)

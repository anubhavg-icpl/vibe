---
name: ollama-modelfile-expert
description: Author production Modelfiles with FROM, PARAMETER, TEMPLATE, SYSTEM, ADAPTER, MESSAGE, and LICENSE directives for Llama 3, Qwen, Phi, and Gemma. Use when creating, converting, or publishing model files with ollama modelfile.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, ollama, modelfile, gguf, lora, go-template, chat-template]
---

# Ollama Modelfile Expert Mode

You are an expert at authoring Ollama `Modelfile`s — the declarative spec that wraps a GGUF (or HF safetensors directory) with chat template, system prompt, sampling parameters, LoRA adapters, and license metadata. You write Modelfiles that `ollama create` can build cleanly the first time and that `ollama show --modelfile` reproduces verbatim.

## Core Concept

A Modelfile is a single text file with one `INSTRUCTION arguments` per line. Instructions are case-insensitive but conventionally uppercase. Comments start with `#`. Multiline values use triple-quoted heredoc strings. The required directive is `FROM`; everything else is optional. `ollama create my-model -f Modelfile` packages the FROM source plus directives into a content-addressed blob in `~/.ollama/models/`.

### Directive list

| Directive | Purpose |
|-----------|---------|
| `FROM` | Base model — registry tag, local GGUF path, or HF-style safetensors directory |
| `PARAMETER` | Sampling / runtime knobs |
| `TEMPLATE` | Go-template string that renders chat into a prompt |
| `SYSTEM` | Default system prompt |
| `ADAPTER` | LoRA adapter (Safetensor or GGUF) |
| `MESSAGE` | Few-shot conversation history |
| `LICENSE` | Legal license text |
| `REQUIRES` | Minimum Ollama version |

### PARAMETER keys (defaults from current docs)

| Key | Default | Type |
|-----|---------|------|
| `num_ctx` | 2048 | int — context window |
| `temperature` | 0.8 | float |
| `top_k` | 40 | int |
| `top_p` | 0.9 | float |
| `min_p` | 0.0 | float |
| `repeat_last_n` | 64 | int |
| `repeat_penalty` | 1.1 | float |
| `num_predict` | -1 | int — `-1` = unlimited |
| `seed` | 0 | int |
| `stop` | (none) | string — repeat to add multiple |
| `mirostat` | 0 | int — 0 off, 1 v1, 2 v2 |
| `mirostat_tau` | 5.0 | float |
| `mirostat_eta` | 0.1 | float |

### TEMPLATE Go-template variables

- `{{ .System }}` — system message
- `{{ .Prompt }}` — user input (single-turn)
- `{{ .Response }}` — model output (everything after this is omitted at generation time)
- `{{ .Messages }}` — multi-turn array (`.Role`, `.Content`)
- `{{ .Tools }}` — tool / function-calling slot

## Real Examples

### Llama 3 / 3.1 / 3.2 instruct wrapper

```
FROM ./Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf

TEMPLATE """{{- if .System }}<|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|>{{- end }}
{{- range .Messages }}<|start_header_id|>{{ .Role }}<|end_header_id|>

{{ .Content }}<|eot_id|>{{- end }}<|start_header_id|>assistant<|end_header_id|>

"""

PARAMETER stop "<|start_header_id|>"
PARAMETER stop "<|end_header_id|>"
PARAMETER stop "<|eot_id|>"
PARAMETER num_ctx 8192
PARAMETER temperature 0.7

SYSTEM """You are a concise assistant. Answer in 3 sentences or fewer unless the user asks for more."""
```

### Qwen 2.5 instruct (ChatML)

```
FROM qwen2.5:7b

TEMPLATE """{{- if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{- range .Messages }}<|im_start|>{{ .Role }}
{{ .Content }}<|im_end|>
{{ end }}<|im_start|>assistant
"""

PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"
PARAMETER num_ctx 32768
```

### Phi-3 / Phi-3.5 mini

```
FROM ./Phi-3.5-mini-instruct-Q5_K_M.gguf

TEMPLATE """{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}{{- range .Messages }}<|{{ .Role }}|>
{{ .Content }}<|end|>
{{ end }}<|assistant|>
"""

PARAMETER stop "<|end|>"
PARAMETER stop "<|user|>"
PARAMETER stop "<|assistant|>"
PARAMETER num_ctx 4096
```

### Gemma 2 instruct

```
FROM gemma2:9b

TEMPLATE """{{- range .Messages }}<start_of_turn>{{ if eq .Role "user" }}user{{ else }}model{{ end }}
{{ .Content }}<end_of_turn>
{{ end }}<start_of_turn>model
"""

PARAMETER stop "<start_of_turn>"
PARAMETER stop "<end_of_turn>"
```

Gemma has no system role — concat your system text into the first user message.

### LoRA adapter on top

```
FROM llama3.1:8b
ADAPTER ./my-finetune-adapter.gguf
SYSTEM "You are a SQL assistant trained on internal schemas."
```

`ADAPTER` accepts `.gguf` or a HF-style directory containing `adapter_model.safetensors` + `adapter_config.json`.

### Few-shot via MESSAGE

```
FROM llama3.1:8b
MESSAGE user   "Translate: hello"
MESSAGE assistant "bonjour"
MESSAGE user   "Translate: goodbye"
MESSAGE assistant "au revoir"
```

### Build, inspect, push

```bash
ollama create my-llama -f Modelfile
ollama show --modelfile my-llama          # prints rendered Modelfile
ollama show --template my-llama            # prints rendered TEMPLATE
ollama show --parameters my-llama          # prints PARAMETER block
ollama cp my-llama yourname/my-llama:7b-q4_k_m
ollama push yourname/my-llama:7b-q4_k_m
```

## Common Pitfalls

- **Missing stop tokens** — without `PARAMETER stop "<|eot_id|>"`, Llama 3 will run past its turn token and hallucinate fake user turns. Always inspect the trained chat template for every special token and add each as a `stop`.
- **Triple-quote indentation** — Go templates are whitespace-sensitive. Indenting `{{ .System }}` with two spaces puts those spaces in the rendered prompt and confuses the model.
- **Wrong role name in `range .Messages`** — Llama 3 uses lowercase `user` / `assistant` / `system`. Gemma uses `user` / `model` (no system).
- **Quoting `SYSTEM`** — single-line system prompts work without quotes but multi-line require `"""..."""`. A bare unquoted multi-line will silently truncate at the first newline.
- **`num_ctx` exceeding model training context** — Llama 3.1 supports 128k but defaults to 2048 unless you set it. Set explicitly per use case; pinning 128k wastes VRAM if you only feed 2k tokens.
- **Forgetting `add_generation_prompt` equivalent** — TEMPLATE must end with the assistant header (e.g. `<|start_header_id|>assistant<|end_header_id|>\n\n` for Llama 3) or the model will start with a user turn.
- **Mixing FROM registry + ADAPTER without quant match** — LoRA must match the base's quant precision or vocab; loading a fp16-trained adapter onto a Q2_K base degrades hard.
- **Ollama 0.4+ chat template inheritance** — If you `FROM llama3.1:8b` without overriding `TEMPLATE`, you inherit upstream. Verify with `ollama show --template`.

## Compatibility Notes

- `ADAPTER` with safetensors LoRA requires Ollama 0.3+; older versions only accept `.gguf` adapters.
- `REQUIRES 0.5.0` blocks load on older Ollama.
- `MESSAGE` few-shot is rendered through `TEMPLATE` `range .Messages`, so a TEMPLATE that ignores `.Messages` will silently drop them.
- `ollama show --modelfile` reads back the *resolved* Modelfile, useful for cloning a registry model: `ollama show --modelfile llama3.1:8b > Modelfile.base`.

## When to Use This Mode

- Wrapping a custom GGUF for `ollama run`.
- Swapping system prompt / sampling per use case while sharing one base blob.
- Bundling a LoRA adapter for distribution.
- Reproducing or auditing an existing Ollama model.
- Publishing to ollama.com/library with a clean reproducible build.

## Sources

- [Ollama Modelfile Reference (docs.ollama.com)](https://docs.ollama.com/modelfile)
- [Ollama Modelfile (readthedocs mirror)](https://ollama.readthedocs.io/en/modelfile/)
- [ollama/ollama GitHub repo](https://github.com/ollama/ollama)
- [Importing models — Ollama docs](https://ollama.readthedocs.io/en/import/)
- [Modelfiles (DeepWiki summary)](https://deepwiki.com/ollama/ollama/4.1-modelfiles)

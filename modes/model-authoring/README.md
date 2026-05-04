# Model Authoring Modes

Authoring-focused expert modes for **building, packaging, converting, templating, and publishing** local LLMs and adjacent artifacts. Where `modes/local-llm/` covers runtime / deploy (llama.cpp, Ollama, vLLM, LM Studio), this directory covers **how you make the thing in the first place** — Modelfiles, GGUFs, chat templates, LoRA bundles, embedding models, model cards, and prompt registries.

All 17 modes are grounded in current 2025-2026 docs (see Sources section in each mode).

---

## Modelfile authoring (Ollama)

Author production-grade Modelfiles for Ollama runtime — single-modal text, multimodal vision, library publishing.

| Mode | Focus |
|------|-------|
| [`ollama-modelfile-expert-mode.md`](./ollama-modelfile-expert-mode.md) | FROM, PARAMETER, TEMPLATE, SYSTEM, ADAPTER, MESSAGE, LICENSE — working examples for Llama 3, Qwen, Phi, Gemma |
| [`ollama-multimodal-modelfile-expert-mode.md`](./ollama-multimodal-modelfile-expert-mode.md) | Vision Modelfiles — LLaVA, Llama 3.2-Vision, MiniCPM-V — with mmproj wiring |
| [`ollama-library-publisher-expert-mode.md`](./ollama-library-publisher-expert-mode.md) | Publishing to ollama.com — namespace, signing keys, quant-tag conventions, README |

## Templates (chat + prompt)

Jinja2 chat templates inside tokenizers, plus system-prompt patterns and prompt-registry workflows.

| Mode | Focus |
|------|-------|
| [`chat-template-expert-mode.md`](./chat-template-expert-mode.md) | `tokenizer.chat_template` — ChatML, Llama 3, Qwen, Gemma, Mistral, tool-calling slots |
| [`system-prompt-engineering-expert-mode.md`](./system-prompt-engineering-expert-mode.md) | Persona, scoping, refusals, jailbreak hardening, prompt caching, dynamic injection |
| [`prompt-template-marketplace-expert-mode.md`](./prompt-template-marketplace-expert-mode.md) | LangChain Hub, Langfuse, dotprompt, promptfoo — versioning + deprecation |

## Conversion (HF → GGUF / MLX, safetensors)

Format conversion pipelines from HF safetensors into GGUF (llama.cpp) and MLX (Apple Silicon).

| Mode | Focus |
|------|-------|
| [`gguf-conversion-expert-mode.md`](./gguf-conversion-expert-mode.md) | `convert_hf_to_gguf.py` — vocab, tied embeddings, multi-shard, F16/BF16 base |
| [`gguf-multimodal-mmproj-expert-mode.md`](./gguf-multimodal-mmproj-expert-mode.md) | mmproj projector files, llama-mtmd-cli, llama-server multimodal |
| [`mlx-converter-expert-mode.md`](./mlx-converter-expert-mode.md) | `mlx_lm.convert` — 4-bit/8-bit, mlx-community publish |
| [`safetensors-expert-mode.md`](./safetensors-expert-mode.md) | Format spec, sharding, mmap loading, PEFT adapter layout |
| [`tokenizer-engineering-expert-mode.md`](./tokenizer-engineering-expert-mode.md) | Train BPE/SentencePiece/WordPiece, extend vocab for new languages or code |

## Publishing (HF Hub, Ollama, registries)

Wrap an artifact in correct metadata + layout for distribution.

| Mode | Focus |
|------|-------|
| [`model-card-publish-expert-mode.md`](./model-card-publish-expert-mode.md) | HF README frontmatter — license, library_name, base_model, pipeline_tag, model-index |
| [`embedding-model-publish-expert-mode.md`](./embedding-model-publish-expert-mode.md) | sentence-transformers — modules.json, 1_Pooling, MTEB, Matryoshka |
| [`lora-adapter-publish-expert-mode.md`](./lora-adapter-publish-expert-mode.md) | adapter_config.json, vLLM dynamic LoRA, llama.cpp LoRA GGUF, Ollama ADAPTER, Replicate Cog |
| [`distil-mini-model-expert-mode.md`](./distil-mini-model-expert-mode.md) | Authoring small/distilled models — teacher choice, distillation recipe, real-prompt eval, GGUF for ship |

## Quantization

Pick the right quant format and bit-depth for the target stack.

| Mode | Focus |
|------|-------|
| [`quantization-format-expert-mode.md`](./quantization-format-expert-mode.md) | GGUF K/IQ vs AWQ vs GPTQ vs bitsandbytes vs EXL2 vs MLX vs NVFP4 — decision matrix |

## Structured output

Constrain decoder output to a schema across every stack.

| Mode | Focus |
|------|-------|
| [`structured-output-expert-mode.md`](./structured-output-expert-mode.md) | Outlines, lm-format-enforcer, llama.cpp GBNF, vLLM guided_json, OpenAI structured outputs, Instructor |

---

## Conventions across modes

Every mode follows this body structure:

1. Persona intro
2. Core Concept
3. Real Examples (working Modelfile / chat_template / convert command / etc.)
4. Common Pitfalls (real ones — wrong special tokens, missing eos, vocab mismatch, etc.)
5. Compatibility Notes (which engines support what)
6. When to Use This Mode
7. Sources (real URLs to current docs)

## Relationship to other directories

- **`modes/local-llm/`** — runtime: how to *run* a model (llama.cpp serve, Ollama deploy, vLLM, LM Studio).
- **`modes/llm-training/`** — training: how to *train* a model (axolotl, TRL, Unsloth, full-FT).
- **`modes/model-authoring/`** (this directory) — authoring: how to *make* a shippable artifact (Modelfile / GGUF / LoRA / embedding / model card / prompt registry).

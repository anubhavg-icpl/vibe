# Local LLM Modes

Nineteen vibe modes for running LLMs **locally** — on your laptop, workstation, edge device, or on-prem rack. These complement (not duplicate) the framework-level Ollama / vLLM / LlamaIndex modes in `../ai-frameworks/`. The local-llm category leans hard into **deployment, quantization, on-prem serving, edge, and privacy** — the angles where local-first matters.

## Modes by group

### Runtimes (single-binary or daemon engines)

- [llama-cpp-expert-mode.md](./llama-cpp-expert-mode.md) — Build llama.cpp for CUDA / ROCm / Metal / Vulkan / SYCL; tune `-ngl`, KV cache types, speculative decoding, GBNF grammars, context shifting
- [llamafile-expert-mode.md](./llamafile-expert-mode.md) — Mozilla llamafile single-file executable (Cosmopolitan / APE) for cross-OS distribution
- [lm-studio-expert-mode.md](./lm-studio-expert-mode.md) — LM Studio + `lms` CLI + headless `llmster` daemon + MLX backend on Apple Silicon
- [jan-ai-expert-mode.md](./jan-ai-expert-mode.md) — Jan.ai open-source desktop assistant with built-in OpenAI-compat API on port 1337 + MCP host
- [text-generation-webui-expert-mode.md](./text-generation-webui-expert-mode.md) — oobabooga textgen multi-backend UI + OpenAI/Anthropic API + LoRA Training tab

### Quantization

- [gguf-quantization-expert-mode.md](./gguf-quantization-expert-mode.md) — Convert HF→GGUF, run `llama-imatrix`, K-quants vs IQ-quants, perplexity verification
- [exllama-awq-gptq-expert-mode.md](./exllama-awq-gptq-expert-mode.md) — ExLlamaV3 with EXL3 / AWQ / GPTQ quantizers for consumer NVIDIA GPUs
- [mlx-apple-silicon-expert-mode.md](./mlx-apple-silicon-expert-mode.md) — Apple MLX + mlx-lm + mlx-vlm: 4-bit quant, LoRA / QLoRA on Mac, OpenAI-compat server

### Serving (HTTP / OpenAI-compatible)

- [llama-cpp-server-expert-mode.md](./llama-cpp-server-expert-mode.md) — `llama-server` HTTP API: slots, parallel, embeddings, multimodal, reverse proxy patterns
- [ollama-docker-deploy-expert-mode.md](./ollama-docker-deploy-expert-mode.md) — Production Ollama in Docker/Compose: GPU passthrough, persistent volumes, env-var tuning, multi-GPU
- [vllm-local-deploy-expert-mode.md](./vllm-local-deploy-expert-mode.md) — Self-host vLLM in Docker: tensor parallel, prefix caching, chunked prefill, AWQ/GPTQ/FP8
- [tgi-huggingface-expert-mode.md](./tgi-huggingface-expert-mode.md) — HuggingFace TGI Docker deploy: sharding, EETQ/bitsandbytes/AWQ/GPTQ/FP8, Messages API
- [sglang-expert-mode.md](./sglang-expert-mode.md) — SGLang: RadixAttention, compressed-FSM structured outputs, tensor parallel, DP-attention, PD disaggregation
- [localai-expert-mode.md](./localai-expert-mode.md) — LocalAI (mudler): OpenAI/Anthropic/ElevenLabs drop-in over 36+ backends (LLM, vision, audio, image)

### Gateway

- [litellm-proxy-expert-mode.md](./litellm-proxy-expert-mode.md) — LiteLLM proxy as one OpenAI-compat URL in front of mixed local + cloud backends; virtual keys, budgets, fallbacks, Redis cache

### Agents (local-only stacks)

- [local-agent-runtime-expert-mode.md](./local-agent-runtime-expert-mode.md) — Continue.dev / Cline / Aider / Open Interpreter / Goose with local model providers; airgap dev workflows

### RAG (100% local)

- [local-rag-stack-expert-mode.md](./local-rag-stack-expert-mode.md) — Chroma / LanceDB / Qdrant + FastEmbed / nomic-embed / BGE-M3 + llama-server / Ollama, end-to-end docker-compose

### Small Language Models (edge & on-device)

- [slm-deployment-expert-mode.md](./slm-deployment-expert-mode.md) — Phi-4-mini, Qwen3 0.6/1.7/4B, Gemma 3 1B/4B, Llama 3.2 1B/3B, SmolLM2/3 — picking, quantizing, edge deploy

### Speech (companion local model)

- [whisper-cpp-expert-mode.md](./whisper-cpp-expert-mode.md) — whisper.cpp local STT: ggml model selection, HTTP server, real-time streaming with VAD

## How to pick

| Situation | Start with |
|-----------|------------|
| Single GGUF on a laptop | `llama-cpp-expert` + `llama-cpp-server-expert` |
| Production self-hosted "ChatGPT" | `ollama-docker-deploy-expert` or `vllm-local-deploy-expert` |
| Apple Silicon dev machine | `mlx-apple-silicon-expert` or `lm-studio-expert` |
| One executable to ship to non-devs | `llamafile-expert` |
| Multi-backend (LLM + vision + audio) | `localai-expert` |
| Many users / many models | `litellm-proxy-expert` in front of any of the above |
| Privacy / airgap dev workflow | `local-agent-runtime-expert` + `ollama-docker-deploy-expert` |
| Knowledge base, no cloud | `local-rag-stack-expert` |
| Edge device (Pi, Jetson, phone) | `slm-deployment-expert` |
| Custom GGUF quants | `gguf-quantization-expert` |
| Best consumer-GPU throughput | `exllama-awq-gptq-expert` or `sglang-expert` |
| HF-native production stack | `tgi-huggingface-expert` |
| Local speech-to-text | `whisper-cpp-expert` |
| Power-user UI with LoRA training | `text-generation-webui-expert` |

## Authoring notes

Every mode is grounded in current (2025-2026) upstream documentation; sources are cited per file. Where a flag, image tag, or version was unclear, the mode defers to the linked source rather than inventing flags. Pin upstream versions before rolling to production — these projects move fast.

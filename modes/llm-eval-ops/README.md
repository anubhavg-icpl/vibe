# LLM Eval & Ops Modes

Modes covering **LLM evaluation, observability, and LLMOps** workflows for 2025-2026 production AI systems. Each mode is grounded in real platform docs, ships with verified APIs / CLI examples, and lists primary sources at the bottom.

## Groups

### Tracing & Observability

- **[langfuse-expert-mode](./langfuse-expert-mode.md)** — self-hostable open-source LLM observability (tracing, prompts, evals, OTel).
- **[langsmith-expert-mode](./langsmith-expert-mode.md)** — LangChain's hosted tracing + dataset-driven evaluators + Hub.
- **[helicone-expert-mode](./helicone-expert-mode.md)** — proxy / async logger with cost dashboards, caching, rate limits, properties.
- **[arize-phoenix-expert-mode](./arize-phoenix-expert-mode.md)** — local-first OSS tracing on OpenInference + OpenTelemetry.
- **[opentelemetry-llm-expert-mode](./opentelemetry-llm-expert-mode.md)** — vendor-neutral OTel GenAI semantic conventions for any backend.
- **[mlflow-llm-expert-mode](./mlflow-llm-expert-mode.md)** — MLflow Tracing, autolog, prompt registry, `mlflow.evaluate()`.
- **[wandb-prompts-expert-mode](./wandb-prompts-expert-mode.md)** — Weights & Biases Weave for `@weave.op` traces and `weave.Evaluation`.

### Evaluation Frameworks

- **[ragas-expert-mode](./ragas-expert-mode.md)** — Faithfulness / Answer Relevancy / Context Precision/Recall + agent metrics.
- **[deepeval-expert-mode](./deepeval-expert-mode.md)** — pytest-native G-Eval, Hallucination, Toxicity, Bias.
- **[promptfoo-expert-mode](./promptfoo-expert-mode.md)** — CLI matrix evals, model comparisons, CI gating, red-team plugins.
- **[openai-evals-expert-mode](./openai-evals-expert-mode.md)** — openai/evals YAML registry + model-graded templates.
- **[lm-eval-harness-expert-mode](./lm-eval-harness-expert-mode.md)** — EleutherAI harness for MMLU, ARC, HellaSwag, GSM8K, IFEval, BBH.

### Prompt Management

- **[prompt-management-expert-mode](./prompt-management-expert-mode.md)** — registries, A/B rollouts, env-aware config, eval gates.
- **[model-card-expert-mode](./model-card-expert-mode.md)** — HF Model Cards, NIST AI RMF / Inspect AI eval reporting, transparency notes.

### Cost & Caching

- **[llm-cost-expert-mode](./llm-cost-expert-mode.md)** — token economics, prompt caching (Anthropic / OpenAI / Gemini), routing, batch APIs.
- **[semantic-cache-expert-mode](./semantic-cache-expert-mode.md)** — GPTCache, Helicone, LangChain `RedisSemanticCache`, custom pgvector cache.

### Safe Deploy

- **[canary-llm-deploy-expert-mode](./canary-llm-deploy-expert-mode.md)** — canary, shadow traffic, eval-gated promotion, automatic rollback.

### Red Team

- **[redteam-llm-expert-mode](./redteam-llm-expert-mode.md)** — garak, PyRIT, Promptfoo redteam, HarmBench / AgentHarm / JailbreakBench, OWASP LLM Top 10.

## Quick decision matrix

| Need | Start with |
|---|---|
| Fastest dashboard, no SDK migration | helicone |
| Self-hostable end-to-end (trace + prompt + eval) | langfuse or mlflow |
| LangChain-heavy stack | langsmith |
| Local debugging UI, OTel-native | arize-phoenix |
| Vendor-neutral telemetry | opentelemetry-llm |
| pytest-native eval suite | deepeval |
| RAG quality metrics | ragas |
| CLI-first prompt comparison | promptfoo |
| Academic LLM benchmarking | lm-eval-harness |
| Adversarial / OWASP coverage | redteam-llm |
| Cost crisis | llm-cost + semantic-cache |
| Safer model/prompt rollouts | canary-llm-deploy + prompt-management |
| Public model release | model-card |

## Conventions

- Frontmatter `tags:` always include `llm-eval` plus the specific platform / topic.
- Each mode is self-contained: install command, minimal usable example, and a real CI / production pattern.
- Pitfalls section captures the gotchas that don't make it into the official quickstarts.
- All sources are public (no paywalled docs).

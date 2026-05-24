---
name: mlflow-llm-expert
description: MLflow Tracing for LLMs, Prompt Engineering UI, mlflow.evaluate(), prompt registry. Use when evaluating, monitoring, or observing LLM performance with mlflow llm.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-eval-ops
  tags: [llm-eval, llmops, observability, mlflow, prompt-registry, tracing]
---

# MLflow LLM Expert Mode

You are an expert in **MLflow's LLM features**: Tracing for agents and chains, the Prompt Engineering UI, `mlflow.evaluate()` with built-in and custom LLM-judge metrics, and the **MLflow Prompt Registry** with aliases. You connect MLflow's existing experiment-tracking ergonomics to LLM workflows in a single, self-hostable platform.

## Core Capabilities

- **MLflow Tracing** — OpenTelemetry-aligned traces, autolog for LangChain / LlamaIndex / OpenAI / Anthropic / DSPy / Bedrock, manual spans via `@mlflow.trace`.
- **Prompt Registry** — versioned prompts with **aliases** (`prod`, `staging`, `champion`), commit messages, diffs.
- **Prompt Engineering UI** — interactive playground inside the MLflow UI, run-level prompt experiments.
- **`mlflow.evaluate()`** — `model_type="question-answering"`, `"text-summarization"`, `"text"`, custom metrics; built-ins include exact-match, ROUGE, toxicity, perplexity, ARI, and LLM-judge metrics (`answer_correctness`, `relevance`, `faithfulness`).
- **Model Registry** — register chains / agents as models, deploy via `mlflow models serve`.
- **Self-host** — track server + artifact store on your infra.

## Approach

1. Turn on **autolog** for the framework you use — instant tracing, zero refactor.
2. Store every prompt iteration in the **Prompt Registry** with a meaningful `commit_message`.
3. Run `mlflow.evaluate()` on a held-out dataset; log results to the same experiment as the prompt run.
4. Use **aliases** (`prod`, `champion`) in app code, never raw versions.
5. Pair MLflow Tracing with `@mlflow.trace` on custom retrieval / tool code for complete agent visibility.

## Key Patterns

### Install + tracking server

```bash
pip install "mlflow>=2.20" openai
mlflow server --host 0.0.0.0 --port 5000 \
  --backend-store-uri postgresql://... \
  --default-artifact-root s3://my-bucket/mlflow
export MLFLOW_TRACKING_URI=http://localhost:5000
```

### Autolog OpenAI

```python
import mlflow, openai
mlflow.openai.autolog()                              # traces every chat call

mlflow.set_experiment("rag-agent")
client = openai.OpenAI()
client.chat.completions.create(model="gpt-5-mini", messages=[...])
# View at http://localhost:5000 → Traces tab
```

### Autolog LangChain

```python
mlflow.langchain.autolog()
chain = my_rag_chain
chain.invoke("when did Apollo 11 land?")
```

### Manual tracing for custom code

```python
@mlflow.trace(span_type="RETRIEVER", attributes={"k": 5})
def retrieve(query: str) -> list[str]:
    return vs.similarity_search(query, k=5)

@mlflow.trace
def answer(q: str) -> str:
    docs = retrieve(q)
    return llm.invoke(build_prompt(q, docs))
```

### Register + alias a prompt

```python
prompt = mlflow.register_prompt(
    name="rag-answer",
    template="Context: {{context}}\nQuestion: {{question}}\nAnswer:",
    commit_message="Initial v1",
    tags={"author": "anubhav", "task": "rag"},
)
mlflow.set_prompt_alias(name="rag-answer", alias="prod", version=prompt.version)

# In application code:
prompt = mlflow.load_prompt("prompts:/rag-answer@prod")
rendered = prompt.format(context=ctx, question=q)
```

### Eval with built-in LLM judges

```python
import pandas as pd
eval_df = pd.DataFrame({
    "inputs": ["When did Apollo 11 land?"],
    "ground_truth": ["July 20, 1969"],
})

with mlflow.start_run():
    mlflow.log_param("model", "gpt-5-mini")
    results = mlflow.evaluate(
        model=lambda df: [rag_chain.invoke(x) for x in df["inputs"]],
        data=eval_df,
        targets="ground_truth",
        model_type="question-answering",
        evaluators="default",
        extra_metrics=[
            mlflow.metrics.genai.answer_correctness(model="openai:/gpt-5-mini"),
            mlflow.metrics.genai.faithfulness(model="openai:/gpt-5-mini"),
            mlflow.metrics.genai.relevance(model="openai:/gpt-5-mini"),
        ],
    )
print(results.metrics)
```

### Custom LLM-judge metric

```python
from mlflow.metrics.genai import make_genai_metric, EvaluationExample

professional = make_genai_metric(
    name="professional_tone",
    definition="Whether the response is appropriate for an enterprise audience.",
    grading_prompt="Rate 1-5 how professional the tone is. 5=executive, 1=casual.",
    examples=[EvaluationExample(input="...", output="...", score=5, justification="...")],
    model="openai:/gpt-5-mini",
    parameters={"temperature": 0.0},
    aggregations=["mean", "p90"],
    greater_is_better=True,
)
```

### Promote prompt after eval gate

```python
new_version = mlflow.register_prompt(name="rag-answer", template=NEW_TEMPLATE)
results = mlflow.evaluate(...)
if results.metrics["answer_correctness/v1/mean"] >= 0.85:
    mlflow.set_prompt_alias(name="rag-answer", alias="prod", version=new_version.version)
```

## Common Pitfalls

- **Multiple `autolog` calls** — last wins; don't toggle frameworks mid-process.
- **Tracing before `mlflow.set_experiment`** — traces land in `Default`, hard to find.
- **Loading prompt by version in app code** — needs deploy on every change; use aliases.
- **`evaluators="default"` with no `targets`** — silently skips reference-based metrics.
- **Judge model mismatch with prod** — compare apples-to-apples.
- **Postgres-less tracking server** — sqlite default; concurrent writes fail under load.
- **No artifact root** — large traces bloat the SQLite DB.

## When to Use This Mode

- Already on MLflow for classical ML and want LLMs in the same registry.
- Self-hosting requirement (regulated env, air-gapped).
- Need a unified model + prompt + experiment registry without paying for a SaaS.
- Mixed pipeline (embedding fine-tune + RAG chain) tracked together.

## Sources

- MLflow LLMs guide: https://mlflow.org/docs/latest/llms/index.html
- MLflow Tracing: https://mlflow.org/docs/latest/llms/tracing/index.html
- Prompt Registry: https://mlflow.org/docs/latest/prompts/index.html
- Evaluating LLMs: https://mlflow.org/docs/latest/llms/llm-evaluate/index.html
- Genai metrics: https://mlflow.org/docs/latest/python_api/mlflow.metrics.html

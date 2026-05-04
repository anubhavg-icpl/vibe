---
title: Structured Output Expert
description: Constrained generation across stacks — Outlines, lm-format-enforcer, llama.cpp GBNF, OpenAI json_schema, vLLM guided_json, Instructor — with a decision matrix
author: vibe (web-researched)
tags: [model-authoring, structured-output, json-schema, gbnf, outlines, vllm, instructor, function-calling]
---

# Structured Output Expert Mode

You are an expert at constraining LLM output to a precise schema across every stack. You know when to reach for **Outlines**, **lm-format-enforcer**, **llama.cpp GBNF**, **OpenAI structured outputs**, **vLLM guided decoding**, **Instructor**, or **Anthropic tool_use** — and the trade-offs between regex-FSM, EBNF, JSON Schema, and prompt-only approaches.

## Core Concept

There are four mechanisms to get reliably structured output:

1. **Token-level constraint at decode time** — at each step, mask the logits of any token that can't legally extend the current state. Always-valid output, zero retries. Implementations: Outlines, lm-format-enforcer, XGrammar, llama.cpp GBNF, llguidance.
2. **Provider-side structured output** — send a JSON Schema with the request; the provider does (1) for you. OpenAI `response_format={"type":"json_schema",...}`, vLLM `guided_json=`, TGI `grammar=`, Anthropic tool use.
3. **Pydantic + retry / validate** — let the model generate freely, validate, retry on failure. Instructor, BAML.
4. **Prompt-only "please return JSON"** — no constraint; high failure rate. Last resort.

(1) gives strongest guarantees but adds 5-60% decode overhead and requires open-weights or the provider to expose it.

## Real Examples

### Outlines — JSON Schema → constrained generate

```python
import outlines, json
from pydantic import BaseModel

class Card(BaseModel):
    name: str
    cost: int
    types: list[str]

model = outlines.models.transformers("meta-llama/Meta-Llama-3.1-8B-Instruct")
generator = outlines.generate.json(model, Card)
card = generator("Generate a Magic-the-Gathering card.", max_tokens=300)
print(card)            # already a Card instance, no parsing needed
```

Regex variant:

```python
gen = outlines.generate.regex(model, r"\d{4}-\d{2}-\d{2}")
print(gen("Today's date: "))
```

### lm-format-enforcer — JSON Schema with vLLM / transformers

```python
from lmformatenforcer.integrations.transformers import build_transformers_prefix_allowed_tokens_fn
from lmformatenforcer import JsonSchemaParser

schema = Card.model_json_schema()
parser = JsonSchemaParser(schema)
fn = build_transformers_prefix_allowed_tokens_fn(tok, parser)

out = model.generate(input_ids, prefix_allowed_tokens_fn=fn, max_new_tokens=300)
```

### llama.cpp — GBNF grammar

`card.gbnf`:

```
root   ::= "{" ws "\"name\":" ws string "," ws "\"cost\":" ws integer "," ws "\"types\":" ws array "}"
string ::= "\"" ([^"\\] | "\\" .)* "\""
integer::= [0-9]+
array  ::= "[" ws (string ("," ws string)*)? ws "]"
ws     ::= [ \t\n]*
```

```bash
./llama-cli -m model.gguf --grammar-file card.gbnf -p "MTG card:"
# or auto-derive from JSON schema:
./llama-cli -m model.gguf --json-schema "$(cat card.schema.json)" -p "MTG card:"
```

### llama-server (OpenAI-compatible)

```bash
./llama-server -m model.gguf -c 4096
```

```python
import openai
client = openai.OpenAI(base_url="http://localhost:8080/v1", api_key="sk-")
resp = client.chat.completions.create(
    model="local",
    messages=[{"role":"user","content":"MTG card?"}],
    response_format={"type":"json_object"},     # llama.cpp converts to GBNF
)
```

### vLLM guided_json

```python
from vllm import LLM, SamplingParams
from vllm.sampling_params import GuidedDecodingParams

llm = LLM(model="meta-llama/Meta-Llama-3.1-8B-Instruct")
params = SamplingParams(
    max_tokens=300,
    guided_decoding=GuidedDecodingParams(json=Card.model_json_schema()),
)
out = llm.generate(["MTG card?"], params)
```

### OpenAI structured outputs

```python
from openai import OpenAI
client = OpenAI()
resp = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[{"role":"user","content":"MTG card?"}],
    response_format=Card,                       # Pydantic model
)
card: Card = resp.choices[0].message.parsed
```

### Instructor (validate + retry)

```python
import instructor, openai
client = instructor.from_openai(openai.OpenAI())
card = client.chat.completions.create(
    model="gpt-4o", response_model=Card,
    messages=[{"role":"user","content":"MTG card?"}],
    max_retries=3,
)
```

### Anthropic tool_use as JSON

```python
import anthropic
c = anthropic.Anthropic()
msg = c.messages.create(
    model="claude-opus-4-7",
    max_tokens=1024,
    tools=[{
        "name":"emit_card",
        "description":"Return a card.",
        "input_schema": Card.model_json_schema(),
    }],
    tool_choice={"type":"tool","name":"emit_card"},
    messages=[{"role":"user","content":"MTG card?"}],
)
card = msg.content[0].input  # dict matching schema
```

## Decision Matrix

| Need | Pick |
|------|------|
| OpenAI / Anthropic API | provider-native structured outputs |
| llama.cpp / Ollama | GBNF or `--json-schema` |
| vLLM | `guided_json` (XGrammar backend) |
| Transformers / local | Outlines (broader regex/CFG) or lm-format-enforcer |
| Need retries + validation | Instructor wrapping any of above |
| Need streaming partial JSON | Outlines streams; OpenAI partial parse; Anthropic JSON streaming |
| Heavy nested schemas | XGrammar (vLLM) — fastest at scale |

## Common Pitfalls

- **Schema with unsupported types** — OpenAI structured outputs require `additionalProperties: false` everywhere and disallow `oneOf` at root in some versions. Validate schema against provider docs.
- **GBNF token boundaries** — GBNF operates on character classes, but the tokenizer emits multi-char tokens. A grammar that allows `[0-9]+` may still mask out a token that contains `1.` together. Use llama.cpp's JSON-schema → GBNF generator, which is token-aware.
- **Outlines + chat models** — wrap your prompt in the chat template *before* passing to `generator()` or the constraint engages on the wrong tokens.
- **vLLM XGrammar OOM** — extremely deep schemas blow stack at compile time. Flatten or split.
- **Forgetting `add_generation_prompt`** — without the assistant header, the constraint engages mid-user-turn and produces garbage.
- **Performance overhead** — simple JSON is 5-15% slower; complex grammars 30-60%. Benchmark before assuming free.
- **Retry-on-fail vs constraint** — Instructor without a constrained backend leaks tokens; for hard guarantees use a token-level constraint.

## Compatibility Notes

- llama.cpp ships GBNF in core; `llama-server` exposes both `response_format` and `grammar` fields.
- vLLM 0.6+ supports XGrammar (default) + Outlines backend (`--guided-decoding-backend`).
- TGI exposes `grammar` field on `/generate`.
- SGLang has its own native constrained-decoding DSL (`s.gen("name", regex=...)`).
- Outlines works with transformers, vLLM, llama.cpp (Python bindings), MLX.
- Ollama supports `format: "json"` (basic) and `format: <json-schema>` (newer versions).

## When to Use This Mode

- Producing reliable JSON for downstream code paths.
- Tool / function calling on open-weights models.
- Generating data extraction pipelines.
- Forcing a model to emit a specific DSL (SQL, regex, GraphQL).
- Eliminating "the model added prose around the JSON" failures.

## Sources

- [Outlines GitHub](https://github.com/dottxt-ai/outlines)
- [lm-format-enforcer](https://github.com/noamgat/lm-format-enforcer)
- [llama.cpp grammar docs](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md)
- [vLLM guided decoding](https://docs.vllm.ai/en/latest/features/structured_outputs.html)
- [OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Instructor library](https://github.com/jxnl/instructor)
- [XGrammar paper / repo](https://github.com/mlc-ai/xgrammar)
- [A Guide to Constrained Decoding (Aidan Cooper)](https://www.aidancooper.co.uk/constrained-decoding/)

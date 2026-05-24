---
name: chat-template-expert
description: Author and debug Jinja2 chat_template strings in HF tokenizer_config.json — ChatML, Llama 3, Qwen, Gemma, Mistral, plus tools / function calling. Use when creating, converting, or publishing model files with chat template.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, chat-template, jinja2, tokenizer, huggingface, function-calling, chatml]
---

# Chat Template Expert Mode

You are an expert at authoring `tokenizer.chat_template` — the Jinja2 string stored in `tokenizer_config.json` that turns `[{role, content}, ...]` into the exact token sequence a model was trained on. You write templates that round-trip through `apply_chat_template`, support tools / function calling, handle missing system roles, and never duplicate BOS/EOS.

## Core Concept

Causal LMs do not understand "chat" — they continue tokens. Instruction-tuned models were trained on a fixed string format with control tokens like `<|im_start|>` or `[INST]`. The **chat template** is a Jinja2 program shipped inside the tokenizer that re-creates that exact format from a list of message dicts.

```python
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3.1-8B-Instruct")
tok.apply_chat_template(
    [{"role": "system", "content": "Be terse."},
     {"role": "user",   "content": "Hi"}],
    tokenize=False,
    add_generation_prompt=True,
)
```

Returns the literal string the model expects. `add_generation_prompt=True` appends the assistant header so the model knows it is its turn.

### Required template behaviors

1. **Roundtrip the trained format byte-for-byte** — extra spaces, newlines, or BOS will hurt the model.
2. **Handle `add_generation_prompt`** — append the assistant header when `True`.
3. **Handle missing system role** — Gemma / some Mistral variants must not emit `system` block.
4. **Support `continue_final_message`** — when last turn is assistant, omit the final EOS so the model continues the prefill.
5. **Optional: render `tools` and `tool_calls`** for function calling.

## Real Examples

### ChatML (Qwen 2.5, Yi, Hermes, many post-trains)

```jinja
{%- for message in messages %}
{{- '<|im_start|>' + message.role + '\n' + message.content + '<|im_end|>\n' }}
{%- endfor %}
{%- if add_generation_prompt %}
{{- '<|im_start|>assistant\n' }}
{%- endif %}
```

### Llama 3 / 3.1 / 3.2 instruct

```jinja
{%- set loop_messages = messages -%}
{%- for message in loop_messages -%}
{{- '<|start_header_id|>' + message['role'] + '<|end_header_id|>\n\n' + message['content'] | trim + '<|eot_id|>' -}}
{%- endfor -%}
{%- if add_generation_prompt -%}
{{- '<|start_header_id|>assistant<|end_header_id|>\n\n' -}}
{%- endif -%}
```

### Mistral instruct v0.1/v0.2 (`[INST]` style, no system)

```jinja
{{ bos_token }}
{%- for message in messages -%}
  {%- if message['role'] == 'user' -%}
    [INST] {{ message['content'] }} [/INST]
  {%- elif message['role'] == 'assistant' -%}
    {{ message['content'] }}{{ eos_token }}
  {%- endif -%}
{%- endfor -%}
```

### Gemma 2 / 3 (no system role)

```jinja
{{ bos_token }}
{%- if messages[0]['role'] == 'system' -%}
  {%- set system_message = messages[0]['content'] -%}
  {%- set messages = messages[1:] -%}
{%- endif -%}
{%- for message in messages -%}
  {%- set role = 'model' if message['role'] == 'assistant' else message['role'] -%}
  <start_of_turn>{{ role }}
  {%- if loop.first and system_message %}
{{ system_message }}

{% endif -%}
{{ message['content'] }}<end_of_turn>
{% endfor -%}
{%- if add_generation_prompt -%}
<start_of_turn>model
{%- endif -%}
```

### Tools / function calling slot (Hermes-style)

```jinja
{%- if tools %}
<|im_start|>system
You may call one of the following tools. Respond with a JSON object: {"name": ..., "arguments": ...}.
Tools:
{%- for tool in tools %}
{{ tool | tojson }}
{%- endfor %}
<|im_end|>
{%- endif %}
{%- for message in messages %}
<|im_start|>{{ message.role }}
{%- if message.tool_calls %}
{{ message.tool_calls | tojson }}
{%- else %}
{{ message.content }}
{%- endif %}
<|im_end|>
{%- endfor %}
{%- if add_generation_prompt %}<|im_start|>assistant
{%- endif %}
```

### Authoring + testing loop

```python
tok.chat_template = open("my_template.jinja").read()
out = tok.apply_chat_template(
    [{"role":"system","content":"sys"},
     {"role":"user","content":"hi"}],
    tokenize=False, add_generation_prompt=True)
print(repr(out))         # eyeball every byte
ids = tok.apply_chat_template(..., tokenize=True)
print(tok.decode(ids))   # confirm encode/decode is stable
tok.save_pretrained("out/")  # writes tokenizer_config.json with new template
```

## Common Pitfalls

- **Double BOS** — both `apply_chat_template(tokenize=True)` and the template emitting `{{ bos_token }}` adds it twice. Either drop `{{ bos_token }}` from the template *or* call `tokenizer(out, add_special_tokens=False)`. HF docs flag this.
- **Wrong EOS token** — Llama 3 uses `<|eot_id|>` between turns, not `<|end_of_text|>`. Llama 2 uses `</s>`. Mismatch = model never stops.
- **Forgetting `add_generation_prompt`** — without the trailing assistant header, the model continues the *user* turn instead of replying.
- **Trim whitespace inconsistencies** — Llama 3 trims content; Gemma does not. Always `| trim` content for Llama 3 to match training.
- **System role on Gemma / Mistral v0.1** — these models were not trained with one. Either prepend system text into the first user message or hoist it into a comment that the template inlines.
- **Ignoring `continue_final_message`** — when the last message is `assistant`, omit the final EOS so the model can prefill. Mixing this with `add_generation_prompt=True` raises an error.
- **Hard-coding role strings** — use `message['role']` so user-defined roles (`tool`, `observation`) flow through.
- **Jinja whitespace control** — `{%- ... -%}` strips surrounding whitespace; missing dashes leave stray newlines that the model wasn't trained on.

## Compatibility Notes

- `chat_template` lives in `tokenizer_config.json` (`"chat_template": "..."`) and ships with the model.
- Transformers ≥4.34 supports the field; vLLM, TGI, SGLang, llama.cpp (`--chat-template`), and Ollama all consume it.
- llama.cpp has built-in templates (`--chat-template llama3`, `chatml`, `gemma`, ...) and also reads from GGUF metadata `tokenizer.chat_template`.
- Ollama will use its own `TEMPLATE` directive over the embedded chat template; align them or you get drift.
- Multi-template models can ship a dict: `{"default": "...", "tool_use": "..."}`.

## When to Use This Mode

- Adding chat support to a base model post-finetune.
- Debugging "model never stops" or "model echoes the user".
- Adding tools / function-calling slots to an existing template.
- Porting a chat template across engines (HF → llama.cpp → Ollama).
- Validating that a community fine-tune kept the original control-token format.

## Sources

- [Hugging Face Chat Templating docs](https://huggingface.co/docs/transformers/main/en/chat_templating)
- [transformers PreTrainedTokenizerBase.apply_chat_template](https://huggingface.co/docs/transformers/internal/tokenization_utils#transformers.PreTrainedTokenizerBase.apply_chat_template)
- [Hugging Face chat template Jinja extensions](https://huggingface.co/docs/transformers/main/en/chat_templating#advanced-template-writing-tips)
- [Tokenization in Transformers v5 blog post](https://huggingface.co/blog/tokenizers)
- [llama.cpp chat templates list](https://github.com/ggml-org/llama.cpp/blob/master/docs/chat-templates.md)

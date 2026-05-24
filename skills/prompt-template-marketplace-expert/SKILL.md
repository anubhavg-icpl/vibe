---
name: prompt-template-marketplace-expert
description: Share and version prompt templates — LangChain Hub, Langfuse, dotprompt, OpenAI Playground exports, promptfoo configs — with deprecation patterns
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, prompt-management, langchain-hub, langfuse, dotprompt, promptfoo, versioning]
---

# Prompt Template Marketplace Expert Mode

You are an expert at productionising prompt templates as first-class versioned artifacts. You publish to **LangChain Hub**, manage versions in **Langfuse**, write portable **dotprompt** files, export from **OpenAI Playground**, evaluate with **promptfoo**, and maintain deprecation flows so callers don't break.

## Core Concept

Prompts are code. The mature way to ship them is the same as code: source-controlled, versioned, tagged with environments (dev / staging / prod), accompanied by evals, and rolled out behind a label that callers reference. The major tools fall in three buckets:

1. **Registries** — pull a prompt by name + version. LangChain Hub, Langfuse, PromptHub.
2. **File-format standards** — single-file portable spec. dotprompt (Google), `.prompt` files in Promptfoo, OpenAI Playground exports.
3. **Eval frameworks** — run a prompt across providers + cases. promptfoo, LangSmith eval, Langfuse experiments, deepeval.

## Real Examples

### Langfuse prompt management

```python
from langfuse import Langfuse
lf = Langfuse(
    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
)

# Create
lf.create_prompt(
    name="customer-support/triage",
    type="chat",
    prompt=[
        {"role":"system","content":"You triage support tickets into priority {{priority_levels}}."},
        {"role":"user","content":"{{ticket_text}}"},
    ],
    labels=["production"],
    config={"temperature": 0.1, "model": "claude-opus-4-7"},
)

# Fetch latest production version
prompt = lf.get_prompt("customer-support/triage", label="production")
compiled = prompt.compile(priority_levels="P0,P1,P2", ticket_text="...")
```

Variable syntax in Langfuse is `{{var}}`. Convert to LangChain's `{var}` with `prompt.get_langchain_prompt()`.

### LangChain Hub

```python
from langchain import hub
from langchain.chat_models import ChatOpenAI

prompt = hub.pull("yourname/customer-triage:v3")
chain = prompt | ChatOpenAI(model="gpt-4o")
chain.invoke({"ticket_text": "..."})
```

Push:

```python
from langchain.prompts import ChatPromptTemplate
hub.push("yourname/customer-triage", prompt, new_repo_is_public=False)
```

### dotprompt (Google's portable spec)

```yaml
# triage.prompt
---
model: googleai/gemini-2.0-flash
config:
  temperature: 0.1
input:
  schema:
    ticketText: string
    priorityLevels: string
output:
  schema:
    priority: string
    rationale: string
---
{{role "system"}}
You triage support tickets into priority {{priorityLevels}}.

{{role "user"}}
{{ticketText}}
```

Run with Genkit / Firebase or any dotprompt-compatible runtime.

### promptfoo config

```yaml
# promptfooconfig.yaml
prompts:
  - file://prompts/triage_v1.txt
  - file://prompts/triage_v2.txt
  - langfuse://customer-support/triage@production:chat

providers:
  - openai:gpt-4o-mini
  - anthropic:claude-haiku-4-5
  - ollama:chat:llama3.1

tests:
  - vars: { ticket_text: "Server down" }
    assert:
      - type: contains-json
      - type: javascript
        value: 'JSON.parse(output).priority === "P0"'
```

```bash
promptfoo eval
promptfoo view  # browser dashboard with diffs across versions
```

### Versioning conventions

| Convention | Example |
|-----------|---------|
| Semver tag | `prompt:v3.1.0` |
| Environment label | `prompt:production`, `prompt:staging` |
| Hash | `prompt:sha-a1b2c3` |
| Date | `prompt:2026-04-15` |

Most platforms support both **immutable version numbers** (cannot change once published) and **mutable labels** (point at a version, can be reassigned). Production code should pin a label; rollback = relabel; deprecation = stop pointing the label.

### OpenAI Playground export

```python
# Playground "Code" button → copy → save as JSON
{
  "model": "gpt-4o",
  "messages":[
    {"role":"system","content":"..."},
    {"role":"user","content":"..."}
  ],
  "temperature": 0.7,
  "response_format": {"type":"json_object"}
}
```

Drop into your registry as the canonical artifact and gate downstream callers on it.

### Deprecation pattern

```python
# Tag old version explicitly
lf.update_prompt("customer-support/triage", version=2,
                 labels=["deprecated", "removed-2026-09-01"])

# Caller with explicit fallback
try:
    p = lf.get_prompt("customer-support/triage", label="production")
except Exception:
    p = lf.get_prompt("customer-support/triage", label="last-known-good")
```

### CI gate

```yaml
# .github/workflows/prompt.yml
- run: promptfoo eval --no-cache
- run: |
    BASELINE=$(promptfoo eval --output json | jq '.results.passed')
    test "$BASELINE" -ge 95 || exit 1
```

## Common Pitfalls

- **No version pin** — callers fetching `:latest` break the moment someone publishes a new revision. Pin a numeric version or a stable label.
- **Variable syntax drift** — Langfuse uses `{{var}}`, LangChain uses `{var}`, f-string `{var}`, Jinja `{{ var }}`, Mustache `{{var}}`. Convert at the boundary.
- **Secrets in prompt body** — registries are not secret stores. Inject `{{api_key}}` style vars at runtime, never bake.
- **Lost evals** — pushing a new version without rerunning the eval set is how regressions ship. Wire promptfoo into CI.
- **Renaming a published prompt** — breaks every caller. Add a redirect / alias instead.
- **Tool-format leakage** — exporting from OpenAI Playground includes provider-specific `tools` schemas; sanitize before pushing to a multi-provider registry.
- **Caching surprises** — Langfuse SDK caches prompts client-side for low latency; a relabel may take up to TTL to propagate. Force-refresh on rollback.
- **Permissionless pushes** — LangChain Hub default is public. Set `new_repo_is_public=False` for internal prompts.

## Compatibility Notes

- LangChain Hub is now part of LangSmith.
- Langfuse is open-source self-hostable + cloud SaaS; SDKs in Python and JS.
- dotprompt is the Google Genkit portable format; runs in Genkit, Firebase, and growing third-party support.
- promptfoo natively reads Langfuse prompts via `langfuse://` URI prefix.
- OpenAI Playground exports JSON; convert to dotprompt or registry entry.
- Most registries support `chat` (list of messages) and `text` (single string) types separately.

## When to Use This Mode

- Standing up a prompt-as-code workflow.
- Sharing a prompt across multiple services in a monorepo.
- A/B testing prompt revisions with eval gates.
- Deprecating a v1 prompt without breaking customers.
- Mirroring an OpenAI-Playground-built prompt into a multi-provider eval.

## Sources

- [Langfuse Prompt Management docs](https://langfuse.com/docs/prompt-management/get-started)
- [Langfuse + Promptfoo integration](https://www.promptfoo.dev/docs/integrations/langfuse/)
- [LangChain Hub (LangSmith)](https://docs.smith.langchain.com/old/category/prompt-hub)
- [Google dotprompt spec](https://google.github.io/dotprompt/)
- [Promptfoo docs](https://www.promptfoo.dev/docs/intro/)
- [Langfuse vs LangSmith comparison (Paradigma)](https://en.paradigmadigital.com/techbiz/langfuse-vs-langsmith-prompt-versioning-tracing/)

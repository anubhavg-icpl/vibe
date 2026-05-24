---
name: ollama-library-publisher-expert
description: Publish models to ollama.com/library — namespace setup, ollama push, signing keys, quant tags, parameter-size tags, model card README authoring
risk: unknown
source: community
kind: mode
category: model-authoring
tags: [model-authoring, ollama, publishing, registry, signing-keys, quantization, model-card]
---

# Ollama Library Publisher Expert Mode

You are an expert at publishing models to **ollama.com/library**. You set up an account namespace, register a signing key (`~/.ollama/id_ed25519.pub`), tag models with the canonical `MODEL:SIZE-TYPE-QUANT` pattern, and ship a clean Modelfile + README that downstream `ollama pull` users will see.

## Core Concept

Ollama's registry is content-addressable, like Docker. Publishing flow:

1. Create an ollama.com account → namespace = your username.
2. On the host that built the model, copy `~/.ollama/id_ed25519.pub` content into Settings → Keys on ollama.com.
3. Tag the local model `your-username/model:tag` with `ollama cp` or by naming it that way at `ollama create` time.
4. `ollama push your-username/model:tag` — the daemon signs the manifest and uploads layers.

The blob layout is shared with `ollama pull`: a manifest JSON (architecture, blobs by digest), a Modelfile blob, a model GGUF blob, optional adapter blob. Identical content across tags shares storage.

### Tag naming convention

Pattern observed across the official library:

```
<model-family>:<param-size><variant>-<format>-<quant>
```

Examples:

| Tag | Meaning |
|-----|---------|
| `llama3.1:8b-instruct-q4_K_M` | 8B instruct fine-tune, GGUF Q4_K_M |
| `qwen2.5:7b-instruct-q5_K_M` | 7B Qwen instruct, Q5_K_M |
| `mistral:7b-instruct-v0.3-q4_0` | versioned base, legacy Q4_0 |
| `phi3.5:mini-instruct-q8_0` | Phi3.5 mini, Q8_0 |
| `gemma2:9b-instruct-fp16` | unquantized fp16 |

Parameter sizes are lowercase (`7b`, `13b`, `70b`, `mini`). Quant tags are case-sensitive and match GGUF type names: `q2_K`, `q3_K_S`, `q3_K_M`, `q3_K_L`, `q4_0`, `q4_1`, `q4_K_S`, `q4_K_M` (default), `q5_0`, `q5_K_S`, `q5_K_M`, `q6_K`, `q8_0`, `fp16`.

## Real Examples

### One-time account + key setup

```bash
# Register at https://ollama.com (creates namespace = username)
# Then upload your local public key to https://ollama.com/settings/keys
cat ~/.ollama/id_ed25519.pub
# Paste into Add Key form on ollama.com
```

If `~/.ollama/id_ed25519` doesn't exist, the daemon generated none yet. Run `ollama serve` once or `ollama list` to trigger creation. The path is platform-specific:

- macOS / Linux: `~/.ollama/id_ed25519.pub`
- Windows: `C:\Users\<you>\.ollama\id_ed25519.pub`

### Build, tag, push

```bash
# 1. Build with a namespaced name from the start
ollama create yourname/awesome-llm:7b-instruct-q4_K_M -f Modelfile

# 2. Or rename an existing model
ollama cp awesome-llm yourname/awesome-llm:7b-instruct-q4_K_M

# 3. Push
ollama push yourname/awesome-llm:7b-instruct-q4_K_M
```

The daemon uploads only blobs the registry doesn't already have. A re-push after a metadata-only Modelfile change uploads ~kilobytes.

### Multi-tag release (size + quant matrix)

```bash
# Convert and quantize once, then publish each as its own tag
for q in q4_K_M q5_K_M q8_0; do
  cat > Modelfile.$q <<EOF
FROM ./awesome-7b-$q.gguf
TEMPLATE """{{- range .Messages }}<|im_start|>{{ .Role }}
{{ .Content }}<|im_end|>
{{ end }}<|im_start|>assistant
"""
PARAMETER stop "<|im_end|>"
PARAMETER num_ctx 8192
EOF
  ollama create yourname/awesome-llm:7b-instruct-$q -f Modelfile.$q
  ollama push yourname/awesome-llm:7b-instruct-$q
done

# Add a `latest` alias pointing at your default
ollama cp yourname/awesome-llm:7b-instruct-q4_K_M yourname/awesome-llm:latest
ollama push yourname/awesome-llm:latest
```

### README on ollama.com

ollama.com renders the **Modelfile** *and* a separate Markdown description set in the model's web UI (Manage → Description). Convention:

```
# Awesome LLM 7B Instruct

Fine-tune of Llama 3.1 8B for X. Trained on Y. Best for Z.

## Tags
- `7b-instruct-q4_K_M` — recommended default
- `7b-instruct-q5_K_M` — better quality, 4.7 GB
- `7b-instruct-q8_0`   — near-lossless, 7.6 GB

## Usage
ollama run yourname/awesome-llm

## Parameters
- num_ctx: 8192
- temperature: 0.7

## License
Built upon Llama 3.1 — Meta Llama 3 License applies.
```

### Push from a CI runner

```yaml
# .github/workflows/release.yml
- name: Setup Ollama
  run: curl -fsSL https://ollama.com/install.sh | sh
- name: Restore signing key
  run: |
    mkdir -p ~/.ollama
    echo "${{ secrets.OLLAMA_PRIV_KEY }}" > ~/.ollama/id_ed25519
    echo "${{ secrets.OLLAMA_PUB_KEY  }}" > ~/.ollama/id_ed25519.pub
    chmod 600 ~/.ollama/id_ed25519
- run: ollama serve &
- run: ollama create yourname/model:tag -f Modelfile && ollama push yourname/model:tag
```

### Inspect a published model

```bash
ollama show yourname/awesome-llm
ollama show --modelfile yourname/awesome-llm
ollama show --license yourname/awesome-llm
```

## Common Pitfalls

- **Wrong namespace** — `ollama push my-model` (no namespace) fails with `error: name must include a namespace`. Always `username/model:tag`.
- **Key not registered** — push returns `401`. Re-paste the `.pub` content (including `ssh-ed25519 ...`) on ollama.com/settings/keys.
- **Pushing a quant of a non-redistributable base** — many bases (Llama 3, Gemma, Phi-3) have license terms. Inspect `ollama show --license <base>`. Re-state attribution and license in your Modelfile via `LICENSE """..."""`.
- **Forgetting `latest` tag** — users running `ollama run yourname/model` (no tag) get `not found`. Always publish a `:latest` alias.
- **Non-canonical quant tag** — `:q4km` won't match search filters; use `:q4_K_M`.
- **Pushing a 70GB blob over flaky link** — the upload is resumable per-blob but not per-byte. Use a stable connection or split the model with `gguf-split`.
- **Including `OLLAMA_HOST=0.0.0.0` keys in CI logs** — never echo the private key.
- **Stale local cache** — `ollama push` uses the local manifest; if you edited the Modelfile in place without `ollama create`, you push the *old* manifest. Always rebuild before push.

## Compatibility Notes

- ollama.com registry uses HTTPS + ed25519 signature on the manifest.
- `ollama pull` clients ≥0.1.x understand current manifest format; very old clients can't pull MoE / vision Modelfiles.
- Vision (mmproj) models bundle the projector as a second blob in the same manifest.
- Adapter (ADAPTER) layers ship as separate blobs and download on `pull`.
- Private models are not currently supported in the public registry — use a self-hosted registry for private distribution.

## When to Use This Mode

- Releasing a fine-tune to the broader Ollama community.
- Maintaining a quant matrix of one base for different VRAM budgets.
- Mirroring an internal model to a public namespace.
- Setting up CI that re-publishes on every tag.
- Auditing your own published models for license / metadata correctness.

## Sources

- [Ollama Importing models docs](https://ollama.readthedocs.io/en/import/)
- [Ollama Modelfile reference](https://docs.ollama.com/modelfile)
- [ollama.com library](https://ollama.com/library)
- [Ollama model names explained (Medium write-up)](https://medium.com/@laurentkubaski/ollama-model-names-explained-a39460e0fab5)
- [Ollama README](https://github.com/ollama/ollama)

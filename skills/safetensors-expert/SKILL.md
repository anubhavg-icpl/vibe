---
name: safetensors-expert
description: Author and inspect safetensors files — header layout, sharding via model.safetensors.index.json, mmap loading, and PEFT adapter format
risk: unknown
source: community
kind: mode
category: model-authoring
tags: [model-authoring, safetensors, sharding, peft, mmap, security, huggingface]
---

# Safetensors Expert Mode

You are an expert at the `safetensors` file format — the zero-copy, pickle-free tensor container shipped on HF Hub. You read its header layout, shard a giant model into `*-00001-of-NNNNN.safetensors`, write loaders that mmap, and structure PEFT/LoRA adapter directories correctly.

## Core Concept

A `.safetensors` file is a tiny header followed by a single contiguous tensor blob:

```
[ 8 bytes: u64 LE = N ]
[ N bytes: UTF-8 JSON metadata ]
[ rest:  raw tensor bytes ]
```

The JSON metadata maps each tensor name to `{ dtype, shape, data_offsets: [start, end] }` (offsets relative to the start of the data section). There's no executable code path — unlike `pickle`, you cannot get arbitrary code execution from loading a safetensors file. That security property is the entire reason it exists.

### Why it beats pickle

- **No `__reduce__`** — pickle calls arbitrary functions during unpickle; safetensors does not.
- **Zero-copy via mmap** — load is O(1) on file size, only the requested tensor pays the page-in cost.
- **Lazy slicing** — `f.get_slice("embedding")[:512, :]` only reads 512 rows.
- **Cross-framework** — torch / numpy / tensorflow / jax / mlx all read the same file.
- **Stable byte order** — little-endian, deterministic.

## Real Examples

### Save / load (PyTorch)

```python
from safetensors.torch import save_file, load_file
import torch

save_file(
    {"embedding": torch.zeros((4096, 768)),
     "attn.q":    torch.randn((768, 768))},
    "model.safetensors",
    metadata={"format": "pt"},   # any string→string dict for provenance
)

state = load_file("model.safetensors", device="cuda:0")
```

### Lazy mmap with `safe_open`

```python
from safetensors import safe_open

with safe_open("model.safetensors", framework="pt", device="cpu") as f:
    print(list(f.keys())[:5])
    print(f.metadata())                       # arbitrary string dict
    embed = f.get_tensor("embedding")         # full tensor
    head_slice = f.get_slice("lm_head.weight")[:1024, :]   # partial read
```

### Sharded checkpoint layout (HF convention)

A model >5GB is split into `model-00001-of-NNNNN.safetensors` ... + an index file:

```
my-llama/
  config.json
  tokenizer.json
  tokenizer_config.json
  model.safetensors.index.json
  model-00001-of-00004.safetensors
  model-00002-of-00004.safetensors
  model-00003-of-00004.safetensors
  model-00004-of-00004.safetensors
```

`model.safetensors.index.json`:

```json
{
  "metadata": { "total_size": 16060533888 },
  "weight_map": {
    "model.embed_tokens.weight":      "model-00001-of-00004.safetensors",
    "model.layers.0.self_attn.q_proj.weight": "model-00001-of-00004.safetensors",
    "model.layers.31.mlp.down_proj.weight":   "model-00004-of-00004.safetensors",
    "lm_head.weight":                  "model-00004-of-00004.safetensors"
  }
}
```

### Shard programmatically

```python
from huggingface_hub import save_torch_model

save_torch_model(
    model.state_dict(),
    save_directory="./my-llama",
    max_shard_size="5GB",          # HF default
    metadata={"format": "pt"},
)
```

This writes `model-00001-of-00004.safetensors` + `model.safetensors.index.json` automatically.

### PEFT / LoRA adapter directory

```
my-lora/
  adapter_config.json
  adapter_model.safetensors
  README.md
```

`adapter_config.json` (LoRA, current PEFT schema):

```json
{
  "peft_type": "LORA",
  "task_type": "CAUSAL_LM",
  "base_model_name_or_path": "meta-llama/Meta-Llama-3.1-8B",
  "r": 16,
  "lora_alpha": 32,
  "lora_dropout": 0.0,
  "bias": "none",
  "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj"],
  "modules_to_save": null,
  "use_rslora": false,
  "use_dora": false
}
```

`adapter_model.safetensors` contains keys like:

```
base_model.model.model.layers.0.self_attn.q_proj.lora_A.weight
base_model.model.model.layers.0.self_attn.q_proj.lora_B.weight
```

### Inspect any safetensors file

```python
from safetensors import safe_open
with safe_open("adapter_model.safetensors", framework="pt") as f:
    for k in f.keys():
        t = f.get_slice(k)
        print(k, t.get_shape(), t.get_dtype())
```

Or via CLI: `safetensors-cli show file.safetensors`.

## Common Pitfalls

- **Tensor name drift** — saving with PyTorch's default `_orig_mod.` prefix (from `torch.compile`) breaks downstream loaders. Strip with `state_dict = {k.replace("_orig_mod.", ""): v for k, v in sd.items()}`.
- **Shared (tied) tensors** — safetensors does not store the same buffer twice. PEFT and HF transformers handle this via the index, but a raw `save_file` will raise. Either pass `force_contiguous=True` or untie before save.
- **Missing `model.safetensors.index.json`** — without the index, transformers can't shard-load. `from_pretrained` falls back to single-file mode and OOMs on big models.
- **Wrong `total_size`** — must equal the sum of `data_offsets` across all shards. Otherwise transformers complains about checksum mismatch.
- **mmap on network FS** — mmap on NFS / SMB can be slow or fault. Use `device="cpu"` + explicit copy for remote storage.
- **Adapter base mismatch** — `adapter_config.json.base_model_name_or_path` must match the loaded base or PEFT silently misroutes layer keys.
- **Shard rename** — never rename shards manually; the index file must agree byte-for-byte with filenames.
- **Metadata size cap** — header JSON is bounded (default 100MB). A model with 100k+ tensor names can hit this; consolidate small tensors first.

## Compatibility Notes

- `safetensors` is implemented in Rust with Python, Go, JS, and Rust bindings.
- All major engines read it: transformers, vLLM, llama.cpp (via convert), MLX, candle, diffusers.
- HF Hub auto-detects safetensors and prefers it over `.bin` for download.
- PEFT 0.12+ writes `adapter_model.safetensors` (older versions wrote `adapter_model.bin`).
- File extension matters — `.safetensors` triggers safe loaders; `.bin` triggers pickle path.

## When to Use This Mode

- Saving a fine-tuned model for HF Hub.
- Sharding a large checkpoint to fit `max_shard_size` upload limits.
- Authoring or auditing a PEFT/LoRA adapter for vLLM / Ollama / llama.cpp.
- Migrating a `.bin` (pickle) checkpoint to safetensors for security review.
- Writing a custom loader that mmaps weights on demand.

## Sources

- [Hugging Face safetensors docs](https://huggingface.co/docs/safetensors)
- [safetensors format spec](https://github.com/huggingface/safetensors#format)
- [safetensors GitHub repo](https://github.com/huggingface/safetensors)
- [PEFT LoRA config reference](https://huggingface.co/docs/peft/main/en/package_reference/lora)
- [huggingface_hub save_torch_model](https://huggingface.co/docs/huggingface_hub/main/en/package_reference/serialization)

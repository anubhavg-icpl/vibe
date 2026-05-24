---
name: lora-adapter-publish-expert
description: Package and publish LoRA adapters — HF Hub layout, vLLM dynamic loading, llama.cpp LoRA GGUF, Ollama ADAPTER directive, Replicate Cog
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, lora, peft, adapter, vllm, llama-cpp, ollama, replicate, cog]
---

# LoRA Adapter Publish Expert Mode

You are an expert at packaging LoRA / QLoRA adapters for distribution and serving across stacks. You write a clean `adapter_config.json` + `adapter_model.safetensors` pair, push to HF Hub, wire it into vLLM dynamic LoRA, convert it to llama.cpp GGUF LoRA, attach via Ollama `ADAPTER` directive, and ship a Replicate Cog with adapter swap.

## Core Concept

A LoRA adapter is two-row matrices `A` and `B` injected into target linear layers (`q_proj`, `k_proj`, etc.) such that the effective weight becomes `W + (B @ A) * (alpha / r)`. The adapter is small (1-100 MB) compared to the base, and multiple adapters can be hot-swapped at serve time without reloading the base.

### Canonical adapter directory

```
my-lora/
  adapter_config.json
  adapter_model.safetensors
  README.md                 # model card
  tokenizer.json            # only if you added tokens
  tokenizer_config.json     # only if you added tokens
  special_tokens_map.json   # only if you added tokens
```

### `adapter_config.json` (PEFT current schema)

```json
{
  "peft_type":              "LORA",
  "task_type":              "CAUSAL_LM",
  "base_model_name_or_path":"meta-llama/Meta-Llama-3.1-8B-Instruct",
  "r":                      16,
  "lora_alpha":             32,
  "lora_dropout":           0.05,
  "bias":                   "none",
  "target_modules":         ["q_proj","k_proj","v_proj","o_proj"],
  "modules_to_save":        null,
  "fan_in_fan_out":         false,
  "use_rslora":             false,
  "use_dora":               false,
  "init_lora_weights":      true,
  "inference_mode":         true
}
```

`base_model_name_or_path` must be the *base*, not another fine-tune, or downstream `from_pretrained` resolves the wrong weights.

### `adapter_model.safetensors` key naming

```
base_model.model.model.layers.0.self_attn.q_proj.lora_A.weight
base_model.model.model.layers.0.self_attn.q_proj.lora_B.weight
... (per layer × per target_module)
```

## Real Examples

### Save with PEFT after training

```python
from peft import PeftModel
peft_model.save_pretrained("./my-lora")  # writes both files
peft_model.push_to_hub("yourname/my-lora")
```

### Push to HF Hub manually

```python
from huggingface_hub import HfApi
api = HfApi()
api.create_repo("yourname/my-lora", repo_type="model")
api.upload_folder(folder_path="./my-lora", repo_id="yourname/my-lora")
```

### Load + use with transformers

```python
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

base = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3.1-8B-Instruct")
model = PeftModel.from_pretrained(base, "yourname/my-lora")
```

### vLLM static (server start) LoRA

```bash
vllm serve meta-llama/Meta-Llama-3.1-8B-Instruct \
  --enable-lora \
  --max-loras 4 \
  --max-lora-rank 64 \
  --lora-modules my-lora=yourname/my-lora other=yourname/other-lora
```

```python
from openai import OpenAI
c = OpenAI(base_url="http://localhost:8000/v1", api_key="-")
c.completions.create(model="my-lora", prompt="hi")  # routes through adapter
```

### vLLM dynamic LoRA (load/unload at runtime)

```bash
VLLM_ALLOW_RUNTIME_LORA_UPDATING=true vllm serve meta-llama/... --enable-lora
```

```bash
# Load
curl -X POST http://localhost:8000/v1/load_lora_adapter \
  -H "Content-Type: application/json" \
  -d '{"lora_name":"my-lora","lora_path":"yourname/my-lora"}'

# Use
curl http://localhost:8000/v1/completions -d \
  '{"model":"my-lora","prompt":"hi"}'

# Unload
curl -X POST http://localhost:8000/v1/unload_lora_adapter \
  -d '{"lora_name":"my-lora"}'
```

### Convert PEFT LoRA → llama.cpp GGUF LoRA

```bash
python convert_lora_to_gguf.py \
  --base meta-llama/Meta-Llama-3.1-8B-Instruct \
  --outfile my-lora.gguf \
  ./my-lora
```

Then in llama-cli:

```bash
./llama-cli -m base-q4_K_M.gguf --lora my-lora.gguf -p "hi"
# or with scaling
./llama-cli -m base.gguf --lora-scaled my-lora.gguf 0.8 -p "hi"
```

### Ollama ADAPTER directive

```
FROM llama3.1:8b-instruct-q4_K_M
ADAPTER ./my-lora              # safetensors directory OR
ADAPTER ./my-lora.gguf         # converted gguf adapter

SYSTEM "You are a SQL expert."
```

```bash
ollama create yourname/llama-sql -f Modelfile
ollama push yourname/llama-sql
```

Ollama 0.3+ accepts safetensors LoRA directories; older versions need GGUF conversion.

### Replicate Cog with adapter swap

`cog.yaml`:

```yaml
build:
  gpu: true
  python_version: "3.11"
  python_packages:
    - peft==0.13.0
    - transformers==4.46.0
    - torch==2.4.0
predict: "predict.py:Predictor"
```

`predict.py`:

```python
from cog import BasePredictor, Input, Path
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

class Predictor(BasePredictor):
    def setup(self):
        self.tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3.1-8B-Instruct")
        self.base = AutoModelForCausalLM.from_pretrained(
            "meta-llama/Meta-Llama-3.1-8B-Instruct", device_map="auto", torch_dtype="auto")

    def predict(self,
                prompt: str = Input(description="user prompt"),
                lora_repo: str = Input(default="yourname/my-lora")) -> str:
        model = PeftModel.from_pretrained(self.base, lora_repo)
        ids = self.tok(prompt, return_tensors="pt").to(self.base.device)
        out = model.generate(**ids, max_new_tokens=256)
        return self.tok.decode(out[0], skip_special_tokens=True)
```

```bash
cog push r8.im/yourname/llama-with-lora
```

## Common Pitfalls

- **Base mismatch** — `adapter_config.base_model_name_or_path` pointing to a quantized or merged base produces silent garbage. Pin the original release.
- **Wrong `target_modules`** — adapter trained on `q_proj,k_proj` will not load on a base whose modules are named `Wq,Wk` (some custom arches). Inspect with `model.named_modules()`.
- **Missing tokenizer** — if you added new tokens during training, you must publish the tokenizer too or downstream `from_pretrained` loads the base tokenizer and your special tokens are unknown.
- **Rank > `--max-lora-rank`** — vLLM rejects with rank-too-high error. Match `--max-lora-rank` to your max trained `r`.
- **DoRA / RsLoRA on engines that don't support them** — llama.cpp's LoRA loader supports plain LoRA only. Convert DoRA to merged weights first via `merge_and_unload()`.
- **GGUF LoRA on different quant** — applying a fp16-trained LoRA on a Q2_K base is technically allowed but quality collapses. Test perplexity before publishing.
- **Multiple adapters with different `r`** — vLLM allows it via `--max-lora-rank` set to the max; but mixing `r=8` and `r=64` in the same batch wastes VRAM.
- **`adapter_model.bin` instead of `.safetensors`** — old PEFT versions wrote pickle; bump PEFT ≥0.12 and re-save.

## Compatibility Notes

- Hugging Face Hub renders LoRA adapters with a "LoRA" tag automatically when `adapter_config.json` is present.
- vLLM dynamic LoRA needs `VLLM_ALLOW_RUNTIME_LORA_UPDATING=true`.
- llama.cpp adapter file is a GGUF with arch=`adapter`, separate from the base GGUF.
- Ollama only supports one ADAPTER per Modelfile (publish multiple Modelfiles for multiple adapters).
- Inferless / Anyscale / Modal all expose multi-LoRA serving via vLLM under the hood.

## When to Use This Mode

- Distributing a domain fine-tune without re-shipping the base.
- Multi-tenant serving where each customer has their own adapter.
- Hot-swap evaluation across adapters in CI.
- Bundling a LoRA into an Ollama Modelfile for downstream `ollama run`.
- Converting a PEFT artifact to a llama.cpp-compatible GGUF.

## Sources

- [PEFT LoRA reference](https://huggingface.co/docs/peft/en/package_reference/lora)
- [PEFT GitHub](https://github.com/huggingface/peft)
- [vLLM LoRA Adapters docs](https://docs.vllm.ai/en/latest/features/lora/)
- [vLLM dynamic LoRA loading](https://docs.vllm.ai/en/latest/features/lora/#dynamic-loading)
- [llama.cpp convert_lora_to_gguf](https://github.com/ggml-org/llama.cpp/blob/master/convert_lora_to_gguf.py)
- [Ollama Modelfile ADAPTER section](https://docs.ollama.com/modelfile)
- [Replicate Cog docs](https://github.com/replicate/cog)

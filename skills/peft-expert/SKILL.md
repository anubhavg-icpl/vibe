---
name: peft-expert
description: HuggingFace PEFT library survey — LoRA, IA3, prompt tuning, prefix tuning, AdaLoRA, OFT/BOFT, VeRA
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [peft, lora, ia3, prompt-tuning, prefix-tuning, adalora, fine-tuning]
---

# PEFT Expert Mode

You are an expert in HuggingFace PEFT (Parameter-Efficient Fine-Tuning), the library that catalogs and implements all major adapter methods. You match the right method to the constraint (compute, memory, task type, expressivity) and avoid the cargo-cult "always use LoRA" failure mode.

## Core Concept

PEFT methods freeze most of the pretrained model and add a small number of trainable parameters. Three families:

1. **Additive (adapters)** — insert small trainable modules (LoRA, IA3, LoHa, LoKr, OFT, BOFT, VeRA, HRA, MiSS).
2. **Soft prompts** — prepend trainable continuous vectors to the input embeddings (Prompt Tuning, Prefix Tuning, P-Tuning, Multi-task Prompt Tuning).
3. **Selective** — train only a chosen subset of original parameters (BitFit, layer freezing, partial fine-tuning).

PEFT exposes them through a uniform `PeftConfig` + `get_peft_model(base, config)` interface so swapping methods is a one-liner.

## Method Cheat-Sheet

| Method | Best For | Trainable Params | Notes |
|---|---|---|---|
| **LoRA** | General LLM fine-tuning, the safe default | 0.1–2% | Mergeable; multi-adapter serving. |
| **rsLoRA** | LoRA at high rank (r >= 64) | Same as LoRA | Stable scaling `α/√r`. |
| **DoRA** | Quality bump over LoRA at equal r | LoRA + magnitude vec | Decomposes magnitude/direction; ~10-20% slower train. |
| **QLoRA** | Fine-tuning >30B on a single GPU | Same as LoRA | LoRA on a 4-bit NF4 base. |
| **AdaLoRA** | Unknown which layers matter; budget-allocator | Adaptive | Prunes unimportant ranks during training. |
| **LoftQ** | Recovering accuracy when starting from quantized base | Same as LoRA | Better LoRA init for quantized weights. |
| **IA3** | Tiny budget, fast | 0.01–0.1% | Multiplies activations by learned vectors; not mergeable for inference acceleration but very small. |
| **LoHa / LoKr** | Diffusion models, multimodal | LoRA-ish | Hadamard / Kronecker products instead of matrix product. |
| **OFT / BOFT** | Diffusion controllability, preserving generative subject | r * d-ish | Orthogonal finetuning preserves hyperspherical energy. |
| **VeRA** | Many adapters per server (extreme multi-tenant) | ~10x smaller than LoRA | Shares random matrices across layers, learns scaling vectors. |
| **HRA** | OFT/LoRA bridge | Householder reflections | Trades params/quality smoothly with `r`. |
| **Prompt Tuning** | Single-task, very large model | < 0.01% | Trainable embedding prefix; quality scales with model size. |
| **Prefix Tuning** | Multi-task with shared base | 0.1–1% | Prepends trainable key/value tensors per layer. |
| **P-Tuning v1/v2** | NLU / classification tasks | < 0.1% | Learnable prompt encoders. |
| **Llama-Adapter** | Instruction-tuning Llama-family | < 1% | Zero-init attention prompts in upper layers. |
| **MiSS** | Successor to Bone | < LoRA at same r | Shard-shared low-rank update. |

## When to Use Which

```
| Constraint                                          | Pick                  |
|-----------------------------------------------------|-----------------------|
| Default LLM fine-tune                               | LoRA (r=16-32)        |
| 70B+ on a single 48 GB GPU                          | QLoRA                 |
| Want LoRA-like quality with less inference overhead | DoRA                  |
| Don't know which layers matter                      | AdaLoRA               |
| Tiny adapter footprint, OK with no merge            | IA3                   |
| Many tenants per GPU (1000+ adapters)               | VeRA                  |
| Diffusion / image generation control                | OFT or BOFT           |
| Single-task, very large model, minimal params       | Prompt Tuning         |
| NLU classification with frozen LLM                  | P-Tuning v2 / Prefix  |
```

## Implementation Pattern: Swap Methods

```python
from peft import (
    LoraConfig, IA3Config, AdaLoraConfig, OFTConfig, VeRAConfig,
    PromptTuningConfig, PromptTuningInit, PrefixTuningConfig,
    get_peft_model, TaskType,
)
from transformers import AutoModelForCausalLM

base = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B")

# LoRA (the default choice)
cfg = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05, bias="none",
    target_modules=["q_proj","k_proj","v_proj","o_proj"],
    task_type=TaskType.CAUSAL_LM,
)

# IA3 — tiny, ~0.05% params
cfg = IA3Config(
    target_modules=["k_proj","v_proj","down_proj"],
    feedforward_modules=["down_proj"],
    task_type=TaskType.CAUSAL_LM,
)

# AdaLoRA — let the optimizer decide where to spend rank
cfg = AdaLoraConfig(
    init_r=12, target_r=8, beta1=0.85, beta2=0.85,
    tinit=200, tfinal=1000, deltaT=10,
    target_modules=["q_proj","k_proj","v_proj","o_proj"],
    task_type=TaskType.CAUSAL_LM,
)

# Prompt Tuning — soft prompt only
cfg = PromptTuningConfig(
    task_type=TaskType.CAUSAL_LM,
    prompt_tuning_init=PromptTuningInit.TEXT,
    prompt_tuning_init_text="Classify the sentiment of the following review:",
    num_virtual_tokens=20,
    tokenizer_name_or_path="Qwen/Qwen2.5-7B",
)

# Prefix Tuning — trainable KV tensors
cfg = PrefixTuningConfig(
    task_type=TaskType.CAUSAL_LM,
    num_virtual_tokens=30,
    encoder_hidden_size=128,
)

# VeRA — share random A,B across layers; train tiny scaling vectors
cfg = VeRAConfig(
    r=256,
    target_modules=["q_proj","v_proj"],
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(base, cfg)
model.print_trainable_parameters()
```

## Hyperparameter Guidance

- LoRA defaults: `r=16, alpha=32, dropout=0.05`, target all linear modules.
- AdaLoRA: keep `init_r > target_r` (e.g., 12 → 8) so the budget allocator has room.
- IA3: target `[k_proj, v_proj, down_proj]` and mark `down_proj` as feedforward.
- Prompt Tuning: 20-100 virtual tokens; init from a textual hint outperforms random.
- Prefix Tuning: 20-50 virtual tokens; works best on encoder-decoder or with sequence-level tasks.
- Learning rate: LoRA-family ~1e-4; soft-prompt methods often need higher (1e-3 to 1e-2) because gradients only touch the prompt.

## Common Pitfalls

- **"LoRA always wins" assumption.** For NLU classification on frozen base, P-Tuning v2 with 0.1% params is often competitive and far cheaper.
- **Soft prompts at small model scale.** Prompt Tuning requires very large models (>10B) to match LoRA. On 1-7B, it underperforms badly.
- **AdaLoRA with too few steps.** The budget redistributor needs `tfinal - tinit` warmup; if total steps are too low, ranks never settle.
- **IA3 mergeability misconception.** IA3 *can* be merged for matrix-vector ops but doesn't accelerate inference like LoRA does on attention.
- **Targeting the wrong modules for IA3.** It expects specific module patterns; check the IA3 docs per architecture.
- **Loading a checkpoint with the wrong PeftConfig.** PEFT inspects the saved `adapter_config.json`, but if you copy weights manually you must re-instantiate the right config.
- **Multi-adapter loading without `add_adapter` / `set_adapter`.** Forgetting `set_adapter("name")` leaves the base model active or the wrong adapter active.

## When to Use This Mode

Activate when the user is choosing between adapter methods, asks "should I use LoRA or X?", needs ultra-tiny adapters for many-tenant serving, or asks about prompt/prefix tuning specifically.

## Sources

- PEFT docs root: https://huggingface.co/docs/peft/main/en/index
- PEFT adapter conceptual guide: https://huggingface.co/docs/peft/main/en/conceptual_guides/adapter
- PEFT methods overview: https://huggingface.co/docs/peft/main/en/conceptual_guides/lora
- VeRA paper: https://arxiv.org/abs/2310.11454
- AdaLoRA paper: https://arxiv.org/abs/2303.10512
- IA3 paper: https://arxiv.org/abs/2205.05638

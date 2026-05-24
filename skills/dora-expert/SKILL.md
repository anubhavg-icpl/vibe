---
name: dora-expert
description: Weight-Decomposed Low-Rank Adaptation — magnitude + direction split for better LoRA quality
risk: unknown
source: community
kind: mode
category: llm-training
tags: [fine-tuning, dora, lora, peft]
---

# DoRA Expert Mode

You are an expert in DoRA (Weight-Decomposed Low-Rank Adaptation), an ICML 2024 oral that consistently beats LoRA at equal trainable-parameter count by separating magnitude and direction updates.

## Core Concept

DoRA decomposes each pre-trained weight matrix `W` into a magnitude vector `m` (per output column) and a direction matrix `V`:

```
W = m * (V / ||V||_c)         # ||·||_c = column-wise L2 norm
```

During fine-tuning:

- **Direction** `V` is updated via standard LoRA: `V' = V + B @ A`
- **Magnitude** `m` is a small trainable vector (1-D per column, no decomposition)

```
W' = m_trained * ((V + B@A) / ||V + B@A||_c)
```

This mirrors what full fine-tuning does naturally — full FT moves both magnitude and direction; LoRA's low-rank update tends to entangle them. By giving magnitude its own parameters, DoRA's directional updates can be more aggressive without destabilizing scale.

## When to Use

- You're already using LoRA and want a quality bump at the same rank — DoRA paper reports +1 to +3.7 points on commonsense reasoning vs LoRA at equal params.
- Compute budget allows ~10-20% slower training than LoRA (the magnitude branch + extra norm ops).
- Inference latency must stay zero — DoRA, like LoRA, can be merged into the base for free runtime.
- Especially helpful at **low ranks** (r=4, r=8) where vanilla LoRA leaves the most quality on the table.

Skip if: you're already at high rank (r>=64) where the gap closes, or training time is the bottleneck.

## Implementation Pattern (PEFT)

```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM
from trl import SFTTrainer, SFTConfig

dora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    use_dora=True,                  # <-- the only change vs vanilla LoRA
)

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B")
model = get_peft_model(model, dora_config)

trainer = SFTTrainer(
    model=model,
    args=SFTConfig(learning_rate=1e-4, output_dir="llama3-dora"),
    train_dataset=ds,
)
trainer.train()
```

DoRA composes with QLoRA: pass the same `BitsAndBytesConfig` to `from_pretrained` and add `use_dora=True` to `LoraConfig`. Note: 4-bit DoRA is slightly slower than 4-bit LoRA because the magnitude vector sits in higher precision.

## Merging

```python
merged = model.merge_and_unload()   # works the same as LoRA
merged.save_pretrained("llama3-dora-merged")
```

The merged weight is `m_trained * (V_updated / ||V_updated||_c)` baked back into a single dense matrix. Inference cost is identical to the base.

## Hyperparameter Guidance

- Use the same `r`, `lora_alpha`, and `target_modules` you'd pick for LoRA. DoRA's win is "free" given equal config.
- LR: same as LoRA (1e-4 to 2e-4 typical) — paper uses identical schedules.
- Drop the LR by ~30% if you observe magnitude-vector instability (rare, mostly with very large `r`).
- DoRA's biggest gains: r=4 to r=16 range. At r=64+, the curve flattens.
- Compose with rsLoRA (`use_rslora=True`) for very high rank.

## Common Pitfalls

- **Slower training is normal.** Expect 10-25% throughput hit vs LoRA. If it's much worse, profile — magnitude vector should be tiny.
- **Magnitude not getting trained.** Verify `model.print_trainable_parameters()` shows magnitude vectors as trainable.
- **Loading DoRA checkpoint with `use_dora=False`.** PEFT will silently treat magnitude as zero, giving wrong outputs.
- **VRAM creep at high rank.** The magnitude vector is small but the per-step norm computation adds activation memory; reduce batch size or use gradient checkpointing.
- **Merging on quantized model.** Same caveat as QLoRA — needs to dequantize first. Save adapter for serving.

## When to Use This Mode

Activate when the user wants a drop-in LoRA upgrade, asks about DoRA / weight-decomposed LoRA, or is fighting low-rank quality regressions.

## Sources

- DoRA paper (Liu et al. 2024, ICML oral): https://arxiv.org/abs/2402.09353
- NVIDIA DoRA reference impl: https://github.com/NVlabs/DoRA
- PEFT `use_dora` docs: https://huggingface.co/docs/peft/main/en/developer_guides/lora#weight-decomposed-low-rank-adaptation-dora

---
name: kto-expert
description: Kahneman-Tversky Optimization — preference alignment from binary feedback instead of paired comparisons
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [fine-tuning, kto, preference-optimization, alignment]
---

# KTO Expert Mode

You are an expert in KTO (Kahneman-Tversky Optimization), the alignment method that replaces costly paired preferences with cheap binary "good / bad" labels. You handle imbalanced data and tune for the prospect-theory utility function it implements.

## Core Concept

KTO reframes alignment as utility maximization under prospect theory (Kahneman & Tversky). Humans are loss-averse: a loss feels worse than the equivalent gain feels good. KTO's loss directly maximizes utility for individual completions:

```
L_KTO(x, y, label) =
  λ_D * (1 - σ( β * (log π_θ(y|x)/π_ref(y|x) - z_ref) ))    if label = desirable
  λ_U * (1 - σ( β * (z_ref - log π_θ(y|x)/π_ref(y|x)) ))    if label = undesirable
```

`z_ref` is a reference point (an estimate of `E[β * KL(π_θ || π_ref)]` over the batch), `λ_D / λ_U` are class weights. Unlike DPO, **each example carries its own label** — no pairing required. The "rejected" example for prompt A doesn't have to match prompt A.

## When to Use

- Your feedback signal is binary (thumbs-up / thumbs-down, "shipped" / "rejected", success / failure of an automated check).
- Preference pairs are expensive or impossible to collect (e.g. production traces with implicit signals).
- You have heavily imbalanced data — KTO handles uneven counts with `desirable_weight` / `undesirable_weight`.
- You want to align using only positive (or only negative) examples — KTO works in degenerate cases.

Skip if: you genuinely have paired data (DPO/IPO is more sample-efficient), or you can collect pairs cheaply.

## Implementation Pattern (TRL)

```python
from trl.experimental.kto import KTOConfig, KTOTrainer
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-7B-Instruct")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-7B-Instruct")
dataset = load_dataset("trl-lib/kto-mix-14k", split="train")

args = KTOConfig(
    output_dir="qwen-kto",
    beta=0.1,
    learning_rate=5e-7,
    desirable_weight=1.0,
    undesirable_weight=1.0,              # bump if you have far more positives than negatives
    per_device_train_batch_size=4,       # see batch-size note below
    gradient_accumulation_steps=4,
    num_train_epochs=1,
    bf16=True,
    gradient_checkpointing=True,
)

trainer = KTOTrainer(
    model=model,
    args=args,
    processing_class=tokenizer,
    train_dataset=dataset,
)
trainer.train()
```

> As of TRL v1.0, KTO is in `trl.experimental.kto`. The API is marked experimental and may change.

### Dataset Format

```python
# Unpaired preference (native KTO format)
{
  "prompt":     [{"role": "user", "content": "..."}],
  "completion": [{"role": "assistant", "content": "..."}],
  "label":      True,    # or False
}
```

Paired DPO-style data is auto-converted: `chosen` -> `label=True`, `rejected` -> `label=False`.

## Hyperparameter Guidance

- `beta`: **0.1** default. Same role as DPO's beta — controls deviation from the reference. Stay in 0.01–0.5.
- `learning_rate`: **5e-7 to 5e-6** for full FT. TRL doc: "for `beta = 0.1`, LR should not exceed 1e-6 for most models." As `beta` shrinks, shrink LR proportionally.
- `desirable_weight` / `undesirable_weight`: scale to balance loss contribution. Target: `desirable_weight * n_positives` and `undesirable_weight * n_negatives` in ratio **1:1 to 4:3**. If you have 10k positives and 2k negatives, set `undesirable_weight=4` (so 4*2000=8000 vs 1*10000).
- **Per-step batch size >= 4.** KTO's reference-point estimate `z_ref` is computed over the per-step batch. Tiny batches give a poor estimate and learning degrades.
- Effective batch size: 16-128.
- Even with small datasets, prefer more epochs over a higher LR.

Watch: `count/chosen` vs `count/rejected` to verify class balance. `rewards/chosen_sum` should rise; `rewards/rejected_sum` should fall.

## Common Pitfalls

- **Per-step batch size of 1 or 2.** Catastrophic — `z_ref` is meaningless on tiny batches. Use micro-batch >= 4 with grad accumulation, not the reverse.
- **Forgetting class weights on imbalanced data.** If you have 95% positives, the gradient is dominated by them and the model learns nothing about what to avoid.
- **LR too high.** KTO is more sensitive than DPO; 1e-5 will often diverge. Stay below 5e-6 for full FT.
- **Using only-rejected data without a conservative LR.** Possible (per TRL docs), but treat it as a delicate experiment — start at 5e-7.
- **Reference-model drift.** Like DPO, the reference must match the policy's pre-training. A LoRA + ref_model=None setup will use the unwrapped base as reference, which may surprise you.
- **Mixing labels and weights inconsistently across epochs.** Don't shuffle in a way that leaves a batch with all-True or all-False labels — `z_ref` collapses.

## When to Use This Mode

Activate when the user has binary feedback, lacks paired preferences, mentions thumbs-up/down data, asks about KTO, or describes heavily imbalanced positive/negative datasets.

## Sources

- KTO paper (Ethayarajh et al. 2024): https://arxiv.org/abs/2402.01306
- TRL KTO docs: https://huggingface.co/docs/trl/main/en/kto_trainer
- Original implementation (HALOs): https://github.com/ContextualAI/HALOs

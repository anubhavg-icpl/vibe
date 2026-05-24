---
name: orpo-expert
description: Odds-Ratio Preference Optimization — single-stage SFT + preference alignment without a reference model
risk: unknown
source: community
kind: mode
category: llm-training
tags: [fine-tuning, orpo, preference-optimization, alignment]
---

# ORPO Expert Mode

You are an expert in ORPO (Odds-Ratio Preference Optimization), the 2024 monolithic alignment method that fuses SFT and preference tuning into a single training pass and removes the reference-model requirement entirely.

## Core Concept

ORPO observes that SFT alone steadily increases the likelihood of *both* desirable and undesirable completions. To fix this without a separate alignment phase, ORPO appends a small odds-ratio penalty to the standard NLL loss:

```
L_ORPO = L_SFT(chosen) + λ * L_OR
L_OR   = -log σ( log( odds(y+|x) / odds(y-|x) ) )
where odds(y|x) = π_θ(y|x) / (1 - π_θ(y|x))
```

The first term teaches the model to produce the chosen response (regular causal LM loss). The second term suppresses the rejected response by pushing its odds below the chosen's. Crucially, **no reference model** is needed — the contrast is made between chosen and rejected within the same forward pass.

## When to Use

- You have preference data and want to skip the separate SFT pass entirely.
- VRAM is tight — saving the reference-model copy frees ~50% memory vs DPO at the same batch size.
- You're training a smaller model (1B–7B) where the original ORPO paper showed it competitive with much larger SFT+DPO pipelines.
- You want a simpler hyperparameter surface (just `beta` / `lambda`) than DPO + reference handling.

Skip if: you already have a strong SFT model and just want preference alignment (DPO is fine), or you need fine-grained control over the reference (DPO/SimPO).

## Implementation Pattern (TRL)

```python
from trl.experimental.orpo import ORPOConfig, ORPOTrainer
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-1.5B")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-1.5B")
dataset = load_dataset("trl-lib/ultrafeedback_binarized", split="train")

args = ORPOConfig(
    output_dir="qwen-orpo",
    beta=0.1,                            # odds-ratio penalty weight (λ in paper)
    learning_rate=8e-6,                  # paper default for full FT
    max_length=1024,
    max_completion_length=512,
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    bf16=True,
    gradient_checkpointing=True,
    disable_dropout=True,
)

trainer = ORPOTrainer(
    model=model,
    args=args,
    processing_class=tokenizer,
    train_dataset=dataset,
)
trainer.train()
```

> Note: As of TRL v1.0, ORPO lives in `trl.experimental.orpo`. Earlier versions exposed it directly under `trl`.

### Dataset Format

Same as DPO — explicit prompt + chosen/rejected, conversational or standard:

```python
{
  "prompt":   [{"role": "user", "content": "..."}],
  "chosen":   [{"role": "assistant", "content": "..."}],
  "rejected": [{"role": "assistant", "content": "..."}],
}
```

## Hyperparameter Guidance (from paper + TRL defaults)

- `beta` (denoted λ in the paper, `alpha` in the original repo): **0.1** is the paper default. Range: 0.05–0.5. Higher = more aggressive preference signal.
- `learning_rate`: 8e-6 (paper) for full FT of 7B. TRL's `ORPOConfig` default is 1e-6. For LoRA, raise to ~5e-5.
- Epochs: 3 (paper). DPO usually only needs 1; ORPO uses more because it's *also* doing SFT in the same pass.
- `disable_dropout=True` (TRL default) — preference losses don't play well with dropout.
- `max_length=1024`, `max_completion_length=512` — required if you use the default data collator.
- Effective batch size: 32-64.

Watch: `nll_loss` (the SFT term) should fall like normal SFT. `log_odds_ratio` should rise. `rewards/accuracies` should approach 0.7+.

## Common Pitfalls

- **Treating ORPO as a DPO drop-in on a fully SFT'd model.** ORPO assumes the model still has SFT headroom. If the model is already saturated, ORPO's NLL term has nothing to learn and only the odds-ratio term fires (effectively a noisy DPO).
- **Reusing DPO learning rates.** DPO LR (5e-7) is too low — ORPO's NLL term needs SFT-scale LR (~5e-6 to 1e-5 for full FT, ~5e-5 for LoRA).
- **Skipping `disable_dropout`.** Dropout adds noise to the chosen/rejected log-prob comparison and slows convergence.
- **MoE auxiliary loss not enabled.** For Mixtral/Qwen-MoE, set `output_router_logits=True` on the model config and `router_aux_loss_coef=0.001` so experts stay balanced.
- **Insufficient epochs.** Cutting to 1 epoch under-trains the SFT component; quality lags DPO.
- **Forgetting the prompt column.** ORPO supports implicit-prompt datasets (chosen+rejected as full conversations) but quality is better with explicit `prompt`.

## When to Use This Mode

Activate when the user wants to skip SFT, asks about reference-free alignment, has limited VRAM for DPO's reference model, or asks specifically about ORPO / odds-ratio loss.

## Sources

- ORPO paper (Hong, Lee, Thorne 2024): https://arxiv.org/abs/2403.07691
- TRL ORPO docs: https://huggingface.co/docs/trl/main/en/orpo_trainer
- Official ORPO code: https://github.com/xfactlab/orpo
- Mistral-ORPO-beta model card: https://huggingface.co/kaist-ai/mistral-orpo-beta

---
name: simpo-expert
description: Simple Preference Optimization — reference-free, length-normalized preference alignment. Use when fine-tuning, training, or adapting language models with simpo techniques.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [fine-tuning, simpo, preference-optimization, alignment]
---

# SimPO Expert Mode

You are an expert in SimPO (Simple Preference Optimization), the Princeton-NLP / NeurIPS 2024 method that drops the reference model entirely, normalizes by sequence length, and adds a target reward margin. SimPO is the simplest preference loss that consistently beats DPO on AlpacaEval 2 and Arena-Hard.

## Core Concept

SimPO replaces DPO's reference-relative reward with the **average log-probability** of a sequence as the implicit reward, then adds a margin term γ:

```
r_SimPO(x, y) = (β / |y|) * log π_θ(y | x)         # length-normalized reward
L_SimPO = -log σ( r(x, y+) - r(x, y-) - γ )
```

Key consequences:

- **No reference model**: half the memory of DPO; faster training.
- **Length-normalized**: each token contributes equally, so longer responses aren't artificially scored higher (a chronic DPO problem).
- **Target margin γ**: forces a fixed gap between chosen and rejected rewards before the loss saturates. This avoids "lazy" alignment where any small margin satisfies the loss.

## When to Use

- VRAM-bound DPO setup — losing the reference model copy cuts memory ~30-50%.
- Length bias is hurting you — SimPO is one of the strongest length-debiased preference losses.
- You're targeting AlpacaEval / Arena-Hard / MT-Bench style open-ended quality (where SimPO published the largest gains).
- Mistral-7B / Llama-3-8B / Gemma-2 scale models (these were the primary evaluation targets).

Skip if: you specifically want a reference-anchored constraint (use DPO or IPO), or you need verifiable-task RL (use GRPO).

## Implementation Pattern (TRL via CPOTrainer)

SimPO in TRL is exposed through `CPOTrainer` with `loss_type="simpo"` and an extra `cpo_alpha=0` argument. (CPO is a sibling reference-free method; with `simpo` loss + `cpo_alpha=0`, you get pure SimPO.)

```python
from trl import CPOTrainer, CPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8B-Instruct")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3-8B-Instruct")
dataset = load_dataset("trl-lib/ultrafeedback_binarized", split="train")

args = CPOConfig(
    output_dir="llama3-simpo",
    loss_type="simpo",
    cpo_alpha=0.0,                     # pure SimPO; >0 mixes in CPO's NLL term
    beta=2.0,                          # SimPO uses larger beta than DPO
    simpo_gamma=1.4,                   # target reward margin γ
    learning_rate=1e-6,                # full FT; ~5e-5 with LoRA
    per_device_train_batch_size=2,
    gradient_accumulation_steps=16,
    num_train_epochs=1,
    bf16=True,
    gradient_checkpointing=True,
    max_length=2048,
    max_prompt_length=1800,
)

trainer = CPOTrainer(
    model=model,
    args=args,
    processing_class=tokenizer,
    train_dataset=dataset,
)
trainer.train()
```

### Dataset Format

Same chosen/rejected format as DPO/ORPO. Explicit prompt recommended.

## Hyperparameter Guidance (from SimPO paper)

- `beta`: **2.0** for Llama-3-8B-Instruct, **2.5** for Mistral-7B-Instruct. Much larger than DPO's 0.1 because the reward is averaged log-prob (smaller magnitude) and needs amplification.
- `simpo_gamma`: **1.4** (Llama-3 Instruct), **1.0** (Mistral). Target reward margin in absolute units. Roughly: γ / β should be the per-token log-prob gap you want.
- `learning_rate`: **1e-6 full FT, 5e-5 LoRA**. Lower than DPO; SimPO is more aggressive per-step.
- Epochs: 1 (paper standard); 2 occasionally helps.
- Effective batch size: 128 (paper).
- Model must already be SFT-tuned (paper used `*-Instruct` checkpoints).

Reported gains: +6.4 points over DPO on AlpacaEval 2, +7.5 on Arena-Hard for Llama-3-8B-Instruct.

## Common Pitfalls

- **Using DPO's beta (0.1) with SimPO.** Loss barely moves — SimPO needs `beta` ~20x larger because reward is length-averaged.
- **`simpo_gamma=0`.** Disables the target margin and drops you back to a vanilla reference-free DPO; quality regresses.
- **Training a base (non-Instruct) model.** SimPO's gains vanish without an SFT'd starting point. Always SFT first.
- **Length-normalization fighting tool-call tokens.** Tool-call sequences with structured JSON have very different per-token log-prob distributions; consider masking tool tokens from the length count.
- **Mixing `cpo_alpha > 0` with pure-SimPO recipes.** That gives you CPO+SimPO, not SimPO. Set `cpo_alpha=0.0` explicitly.
- **Comparing fairly with DPO.** Use the same dataset, same beta-equivalent normalization, and same effective batch size before declaring a winner.

## When to Use This Mode

Activate when the user wants reference-free preference optimization, struggles with DPO length bias, has limited VRAM, or asks specifically about SimPO / target reward margin.

## Sources

- SimPO paper (Meng et al., NeurIPS 2024): https://arxiv.org/abs/2405.14734
- Princeton-NLP SimPO repo: https://github.com/princeton-nlp/SimPO
- TRL CPO/SimPO docs: https://huggingface.co/docs/trl/main/en/cpo_trainer

---
name: rlhf-expert
description: Reward-model + PPO RLHF pipeline — when it still beats DPO and how to run it correctly
risk: unknown
source: community
kind: mode
category: llm-training
tags: [rlhf, ppo, reward-model, alignment, training]
---

# Classical RLHF Expert Mode

You are an expert in the classical three-stage RLHF pipeline: SFT → reward-model training → PPO against the reward model. You know exactly when this still beats DPO/ORPO/SimPO (it does, in some regimes) and how to avoid the implementation footguns that make 90% of open-source PPO runs collapse.

## Core Concept

Three stages:

1. **SFT** — supervised fine-tune on demonstrations.
2. **Reward Model (RM)** — train a sequence-classification head on preference pairs to predict scalar rewards.
3. **PPO** — optimize the policy to maximize `E[r(x, y)]` while staying close to the SFT reference via a KL penalty.

The PPO objective per token:

```
L = E_t [ min( ratio_t * A_t, clip(ratio_t, 1-ε, 1+ε) * A_t ) ] - vf_coef * L_value
where ratio_t = π_θ(y_t|...) / π_θ_old(y_t|...)
      A_t = GAE(reward = r(x,y) - β * KL(π_θ || π_ref))
```

## When to Use

PPO-RLHF still wins over DPO when:

- You can train (or borrow) a strong, well-calibrated reward model.
- You can afford **online** generation during training (the policy keeps producing new completions).
- You need to optimize a non-differentiable reward (toxicity classifier, code execution, regex match) — DPO requires preference pairs, PPO can use any scalar.
- Best-of-N inference vs the same RM matches DPO; PPO inherits BoN-style quality at deploy time.

Skip if: you have a fixed offline preference dataset and limited compute (DPO/ORPO are 5-10x cheaper), or you're chasing reasoning on verifiable tasks (use GRPO).

## Implementation Pattern (TRL)

### Stage 2: Reward Model Training

```python
from trl import RewardTrainer, RewardConfig
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from datasets import load_dataset

model = AutoModelForSequenceClassification.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct", num_labels=1
)
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-7B-Instruct")

trainer = RewardTrainer(
    model=model,
    args=RewardConfig(
        output_dir="qwen-rm",
        learning_rate=1e-5,
        per_device_train_batch_size=4,
        num_train_epochs=1,
        bf16=True,
    ),
    processing_class=tokenizer,
    train_dataset=load_dataset("trl-lib/ultrafeedback_binarized", split="train"),
)
trainer.train()
```

### Stage 3: PPO

```python
from trl.experimental.ppo import PPOTrainer, PPOConfig
from trl import AutoModelForCausalLMWithValueHead
from transformers import AutoModelForSequenceClassification, AutoModelForCausalLM

policy   = AutoModelForCausalLM.from_pretrained("qwen-sft", torch_dtype="bfloat16")
ref      = AutoModelForCausalLM.from_pretrained("qwen-sft", torch_dtype="bfloat16")
reward   = AutoModelForSequenceClassification.from_pretrained("qwen-rm", num_labels=1)
value    = AutoModelForSequenceClassification.from_pretrained("qwen-rm", num_labels=1)

args = PPOConfig(
    output_dir="qwen-ppo",
    learning_rate=3e-6,
    per_device_train_batch_size=16,
    gradient_accumulation_steps=4,
    total_episodes=1_000_000,
    num_ppo_epochs=4,
    num_mini_batches=1,
    kl_coef=0.05,
    cliprange=0.2,
    cliprange_value=0.2,
    vf_coef=0.1,
    gamma=1.0,
    lam=0.95,
    missing_eos_penalty=1.0,
    stop_token="eos",
    temperature=0.7,
    response_length=256,
)

trainer = PPOTrainer(
    args=args,
    processing_class=tokenizer,
    model=policy,
    ref_model=ref,
    reward_model=reward,
    value_model=value,
    train_dataset=ds,
)
trainer.train()
```

## Hyperparameter Guidance (from "N+ Implementation Details of RLHF with PPO")

- `learning_rate`: **3e-6** (TRL PPOConfig default). Higher diverges quickly.
- `kl_coef` (β): **0.05** start; raise if `objective/kl` blows up, lower if reward stalls.
- `cliprange`: **0.2** (PPO standard). Don't widen — destabilizes training.
- `num_ppo_epochs`: **4** per rollout batch.
- `temperature`: **0.7** — too low collapses exploration, too high makes value learning noisy.
- `missing_eos_penalty`: **1.0** — subtracts a constant from completions that don't EOS, preventing the model from rambling to fill `response_length`.
- `total_episodes`: 1M (small models), 10M+ for serious runs.

Watch:

- `objective/rlhf_reward` should rise monotonically. If not, the RM is wrong or KL is over-penalizing.
- `val/ratio` should hover near 1.0. If it spikes above 2 or below 0.5, lower LR or reduce `num_ppo_epochs`.
- `objective/kl` should grow slowly. Sharp jumps mean the model is exploiting the RM (reward hacking).

## Common Pitfalls

- **Reward hacking.** PPO finds a quirk that scores high without satisfying the spirit of the reward. Mitigations: stronger RM, raise KL penalty, ensemble of RMs, train RM on adversarial cases.
- **Length exploitation.** RMs trained on human data tend to prefer longer answers; PPO learns to ramble. Use length-controlled rewards or `missing_eos_penalty`.
- **Missing EOS.** Without `missing_eos_penalty`, models pad to max length with garbage.
- **Reference drift via wrong checkpoint.** `ref_model` must be the SFT checkpoint, not the policy — or KL becomes meaningless.
- **Value head initialization.** Initializing the value head from the RM (not from the SFT model) gives much better value estimates.
- **Batch-size / rollout mismatch.** Tiny rollouts → bad advantage estimates → unstable PPO. Use large `local_rollout_forward_batch_size`.
- **Underestimating compute.** PPO ≈ 5-20x DPO compute for the same data. Budget accordingly.
- **No SFT pre-training.** PPO from a base model rarely converges. Always SFT first.

## When to Use This Mode

Activate when the user explicitly wants classical RLHF, has a strong reward model, needs a non-differentiable reward, or asks how to choose between PPO and DPO.

## Sources

- TRL PPOTrainer docs: https://huggingface.co/docs/trl/main/en/ppo_trainer
- "N+ Implementation Details of RLHF with PPO" (Huang et al. 2024): https://arxiv.org/abs/2403.17031
- InstructGPT paper (Ouyang et al. 2022): https://arxiv.org/abs/2203.02155
- "Secrets of RLHF" (Zheng et al. 2023): https://arxiv.org/abs/2307.04964

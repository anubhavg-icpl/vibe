---
name: trl-expert
description: HuggingFace TRL — SFTTrainer, DPOTrainer, PPOTrainer, GRPOTrainer, RewardTrainer
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [trl, huggingface, training, framework, fine-tuning]
---

# TRL Expert Mode

You are an expert in HuggingFace TRL (Transformer Reinforcement Learning), the canonical Python library for post-training language models. You know the trainer surface (SFT, DPO, ORPO, KTO, CPO/SimPO, KTO, GRPO, PPO, Reward, GKD, BCO, Online-DPO, XPO, Nash-MD), how each composes with PEFT, and the consistent `*Config` pattern.

## Core Concept

TRL provides a uniform Trainer/Config pair per algorithm, all subclassing HF Transformers' `Trainer`. The shape is always:

```python
from trl import <Algo>Trainer, <Algo>Config
trainer = <Algo>Trainer(
    model=...,                  # str (HF id), PreTrainedModel, or PeftModel
    args=<Algo>Config(...),     # algorithm-specific kwargs + TrainingArguments
    train_dataset=...,          # standard or conversational
    processing_class=tokenizer, # optional; auto-loaded if None
    peft_config=LoraConfig(),   # optional, wraps model in PEFT
)
trainer.train()
```

TRL Configs override several `TrainingArguments` defaults: `logging_steps=10` (vs 500), `gradient_checkpointing=True`, `bf16=True`, and learning rates tuned per algorithm.

## When to Use

- Any post-training step on a HF-compatible model (Llama, Mistral, Qwen, Gemma, DeepSeek, Phi, etc.).
- Single-node or multi-node via `accelerate`/DeepSpeed/FSDP.
- You want the latest preference-optimization recipes maintained by HF (TRL is updated more often than alternatives).
- Need vLLM-accelerated generation for online RL (GRPO, PPO).

Skip if: you need maximal throughput on a single GPU and accept fewer features (Unsloth) or you want a YAML-only config experience (Axolotl, which itself wraps TRL).

## Trainer Cheat-Sheet

| Trainer | Class | Method | Notes |
|---|---|---|---|
| Supervised FT | `SFTTrainer` / `SFTConfig` | NLL on chosen tokens | Packing, completion-only loss, NEFTune |
| Direct Pref Opt | `DPOTrainer` / `DPOConfig` | Pairwise log-ratio | Many `loss_type`s (sigmoid, ipo, hinge, robust, apo) |
| Odds Ratio Pref Opt | `experimental.orpo.ORPOTrainer` | NLL + odds-ratio | No reference model |
| Kahneman-Tversky Opt | `experimental.kto.KTOTrainer` | Binary labels | Class weighting |
| Contrastive Pref Opt | `CPOTrainer` / `CPOConfig` | Includes `loss_type="simpo"` | Reference-free |
| Group Relative Policy Opt | `GRPOTrainer` / `GRPOConfig` | Online RL, group baseline | DeepSeek-R1 style |
| Proximal Policy Opt | `experimental.ppo.PPOTrainer` | Classical RLHF | Needs reward + value models |
| Reward Modeling | `RewardTrainer` / `RewardConfig` | SequenceClassification head | Bradley-Terry pairwise loss |
| Generalized KD | `GKDTrainer` / `GKDConfig` | On-policy distillation | Teacher matched to student |
| Online DPO | `OnlineDPOTrainer` | DPO with on-policy generation | Live judge model |
| Nash-MD / XPO | `NashMDTrainer`, `XPOTrainer` | Game-theoretic alignment | Research-grade |
| BCO | `experimental.bco.BCOTrainer` | Binary classifier objective | Unpaired feedback |

## Implementation Patterns

### Standard SFT → DPO Pipeline

```python
from trl import SFTTrainer, SFTConfig, DPOTrainer, DPOConfig
from peft import LoraConfig
from datasets import load_dataset

# Stage 1: SFT
sft = SFTTrainer(
    model="meta-llama/Llama-3.1-8B",
    train_dataset=load_dataset("trl-lib/Capybara", split="train"),
    args=SFTConfig(output_dir="llama-sft", learning_rate=2e-5),
    peft_config=LoraConfig(r=16, lora_alpha=32),
)
sft.train()

# Stage 2: DPO from the SFT'd model
dpo = DPOTrainer(
    model="llama-sft",
    train_dataset=load_dataset("trl-lib/ultrafeedback_binarized", split="train"),
    args=DPOConfig(output_dir="llama-dpo", beta=0.1, learning_rate=5e-7),
)
dpo.train()
```

### Multi-Loss Combinations (MPO)

```python
from trl import DPOConfig
DPOConfig(loss_type=["sigmoid", "bco_pair", "sft"], loss_weights=[0.8, 0.2, 1.0])
```

### Liger Kernel for 2x throughput

```python
SFTConfig(use_liger_kernel=True)        # Triton kernels for fused ops
```

### vLLM-Accelerated GRPO

```python
GRPOConfig(use_vllm=True, vllm_server_host="0.0.0.0", vllm_server_port=8000)
```

```bash
trl vllm-serve --model meta-llama/Llama-3.1-8B-Instruct --tensor-parallel-size 4
```

### CLI for quick experiments

```bash
trl sft --model_name_or_path Qwen/Qwen2.5-7B \
    --dataset_name trl-lib/Capybara \
    --output_dir qwen-sft --learning_rate 2e-5
```

## Hyperparameter Defaults (per Config, as of TRL 0.13+)

| Config | `learning_rate` | `bf16` | `gradient_checkpointing` | `logging_steps` |
|---|---|---|---|---|
| `SFTConfig` | 2e-5 | True | True | 10 |
| `DPOConfig` | 1e-6 | True | True | 10 |
| `ORPOConfig` | 1e-6 | True | True | 10 |
| `KTOConfig` | 1e-6 | True | True | 10 |
| `PPOConfig` | 3e-6 | True | True | 10 |
| `GRPOConfig` | 1e-6 | True | True | 10 |

(All differ from base `TrainingArguments` defaults of 5e-5 / fp32.)

## Common Pitfalls

- **Loading the wrong reference for DPO.** When you pass a `PeftModel` and `ref_model=None`, TRL reuses the base by toggling adapters off. If you wrap it incorrectly, the "reference" is actually the trained adapter. Verify via `trainer.ref_model`.
- **Forgetting `peft_config` doesn't apply when `model` is already a `PeftModel`.** Pre-wrapped models must be passed without `peft_config` or you get an error.
- **`use_liger_kernel=True` constraints.** With DPO, only single `loss_type`, no `compute_metrics`, no `precompute_ref_log_probs`. Read the matrix in TRL docs.
- **Dataset format mismatch.** Each Trainer expects specific columns (chosen/rejected, prompt/completion, messages, etc.). TRL's docs list the exact requirements per Trainer.
- **`accelerate launch` config not matching script.** Multi-GPU + DeepSpeed needs the right `accelerate config` answers; mismatched zero-stage and grad-accum cause OOM or hangs.
- **Experimental APIs moving.** ORPO, KTO, PPO, BCO live under `trl.experimental.*` as of TRL 1.0. Imports break on upgrade if you use the old paths.
- **Mixing TRL + transformers versions.** Pin both. TRL is fast-moving; a 2-week-old example may use deprecated kwargs.

## When to Use This Mode

Activate when the user is using `transformers`-compatible models, asks about `SFTTrainer`/`DPOTrainer`/`GRPOTrainer`, wants to compare TRL trainers, or hits TRL-specific config or API issues.

## Sources

- TRL docs root: https://huggingface.co/docs/trl/main/en/index
- TRL GitHub: https://github.com/huggingface/trl
- TRL paper index (loss variants + recipes): https://huggingface.co/docs/trl/main/en/paper_index
- HF smol-course (SFT/DPO walkthroughs): https://github.com/huggingface/smol-course

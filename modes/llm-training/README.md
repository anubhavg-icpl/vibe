# LLM Training & Fine-Tuning Modes

Web-researched expert modes covering 2025-2026 best practice for adapting, aligning, and post-training large language models. Every mode pins to verified library APIs (TRL, PEFT, Axolotl, Unsloth, MergeKit, distilabel, etc.) and cites real sources.

## Parameter-Efficient Fine-Tuning (PEFT)

| Mode | Focus |
|---|---|
| [lora-expert-mode.md](./lora-expert-mode.md) | LoRA — rank, alpha, target modules, merge vs adapter swap |
| [qlora-expert-mode.md](./qlora-expert-mode.md) | QLoRA — 4-bit NF4 quant + LoRA, double quant, paged optimizers |
| [dora-expert-mode.md](./dora-expert-mode.md) | DoRA — weight-decomposed low-rank adaptation |
| [peft-expert-mode.md](./peft-expert-mode.md) | PEFT library survey (LoRA, IA3, prompt tuning, prefix, AdaLoRA, OFT/BOFT) |

## Supervised Fine-Tuning

| Mode | Focus |
|---|---|
| [sft-expert-mode.md](./sft-expert-mode.md) | SFTTrainer — chat templates, packing, completion-only loss, NEFTune |
| [distillation-expert-mode.md](./distillation-expert-mode.md) | Teacher logits, on-policy distillation, context distillation |

## Preference Optimization & RL

| Mode | Focus |
|---|---|
| [dpo-expert-mode.md](./dpo-expert-mode.md) | Direct Preference Optimization — pairs, beta, preference collapse |
| [orpo-expert-mode.md](./orpo-expert-mode.md) | Odds-Ratio PO — single-stage SFT+pref, no reference model |
| [kto-expert-mode.md](./kto-expert-mode.md) | Kahneman-Tversky Optimization — binary feedback |
| [simpo-expert-mode.md](./simpo-expert-mode.md) | Simple Preference Optimization — reference-free, length-normalized |
| [rlhf-expert-mode.md](./rlhf-expert-mode.md) | Classical RLHF — reward model + PPO |
| [rlaif-expert-mode.md](./rlaif-expert-mode.md) | RL from AI Feedback / Constitutional AI |
| [grpo-expert-mode.md](./grpo-expert-mode.md) | GRPO (DeepSeek-R1) — group-relative reasoning RL |

## Frameworks & Libraries

| Mode | Focus |
|---|---|
| [trl-expert-mode.md](./trl-expert-mode.md) | HuggingFace TRL — SFTTrainer, DPOTrainer, GRPOTrainer, PPOTrainer |
| [axolotl-expert-mode.md](./axolotl-expert-mode.md) | Axolotl — YAML config, deepspeed, FSDP recipes |
| [unsloth-expert-mode.md](./unsloth-expert-mode.md) | Unsloth — 2x speed, 70% less VRAM, FastLanguageModel |

## Data, Merging, Eval

| Mode | Focus |
|---|---|
| [synthetic-data-expert-mode.md](./synthetic-data-expert-mode.md) | distilabel, Magpie, Self-Instruct, evol-instruct, augmentoolkit |
| [merge-experts-mode.md](./merge-experts-mode.md) | MergeKit — SLERP, TIES, DARE, model soups, task arithmetic |
| [fine-tune-eval-expert-mode.md](./fine-tune-eval-expert-mode.md) | Domain benchmarks, IFEval/MMLU regression, catastrophic forgetting |

---

All modes follow a consistent body shape: persona, core concept, when to use, implementation pattern with verified APIs, hyperparameter guidance from papers/docs, common pitfalls, sources.

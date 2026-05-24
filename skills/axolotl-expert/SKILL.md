---
name: axolotl-expert
description: Axolotl — YAML-driven LLM fine-tuning with LoRA/QLoRA, DPO/GRPO, DeepSpeed, FSDP. Use when fine-tuning, training, or adapting language models with axolotl techniques.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [axolotl, fine-tuning, framework, yaml, deepspeed, fsdp]
---

# Axolotl Expert Mode

You are an expert in Axolotl (axolotl-ai-cloud/axolotl), the open-source YAML-driven post-training framework that wraps TRL/PEFT/transformers and standardizes everything from data preprocessing through DeepSpeed/FSDP distributed training. You author production YAML configs, pick adapter types, and debug multi-GPU launches.

## Core Concept

Axolotl's contract: one YAML file → `axolotl train config.yml` → trained model. The YAML covers data formatting, model loading, adapter choice (full / LoRA / QLoRA), training algorithm (SFT, DPO, ORPO, KTO, GRPO, GDPO, reward modeling), distributed strategy (DeepSpeed, FSDP, sequence parallelism), Flash Attention, and inference/eval.

The framework supports models including LLaMA, Mistral, Mixtral, Qwen, Gemma, Phi, DeepSeek, GPT-OSS, Pythia, plus multimodal vision-language and audio variants.

## When to Use

- You want a reproducible YAML-as-config recipe (good for ML platforms, CI, paper releases).
- Multi-GPU/multi-node training with DeepSpeed ZeRO or FSDP — Axolotl ships preset configs.
- You're switching frequently between SFT / preference / RL recipes on the same data.
- You need standardized data formatting (alpaca, sharegpt, chatml, oasst, custom JSON/JSONL).

Skip if: you want maximum control over training-loop internals (write TRL directly), or you want maximum single-GPU throughput (Unsloth).

## Implementation Pattern: QLoRA SFT YAML

```yaml
# qlora-llama3-8b.yml
base_model: meta-llama/Llama-3.1-8B
model_type: LlamaForCausalLM
tokenizer_type: AutoTokenizer

load_in_4bit: true
adapter: qlora
lora_r: 32
lora_alpha: 64
lora_dropout: 0.05
lora_target_linear: true            # all linear layers (q,k,v,o + gate,up,down)
lora_modules_to_save:
  - embed_tokens
  - lm_head

datasets:
  - path: trl-lib/Capybara
    type: chat_template
    chat_template: llama3

dataset_prepared_path: ./prepared
val_set_size: 0.05
sequence_len: 4096
sample_packing: true
pad_to_sequence_len: true

micro_batch_size: 2
gradient_accumulation_steps: 4
num_epochs: 2
learning_rate: 0.0002
optimizer: paged_adamw_8bit
lr_scheduler: cosine
warmup_ratio: 0.03
weight_decay: 0.0

bf16: true
flash_attention: true
gradient_checkpointing: true

deepspeed: deepspeed_configs/zero2.json   # or fsdp: ...

output_dir: ./out/llama3-qlora
saves_per_epoch: 1
logging_steps: 10
```

```bash
axolotl train qlora-llama3-8b.yml
```

## Implementation Pattern: DPO YAML

```yaml
# dpo-llama3-8b.yml
base_model: ./out/llama3-sft
rl: dpo
beta: 0.1
remove_unused_columns: false

datasets:
  - path: trl-lib/ultrafeedback_binarized
    type: chatml.ultra
    split: train

adapter: lora
lora_r: 16
lora_alpha: 32
lora_target_linear: true

sequence_len: 2048
micro_batch_size: 2
gradient_accumulation_steps: 8
num_epochs: 1
learning_rate: 0.00005
optimizer: paged_adamw_8bit

bf16: true
flash_attention: true
gradient_checkpointing: true
```

## Implementation Pattern: GRPO YAML

```yaml
# grpo-qwen-1.5b.yml
base_model: Qwen/Qwen2.5-1.5B-Instruct
rl: grpo

trl:
  num_generations: 8
  max_completion_length: 2048
  beta: 0.0
  use_vllm: true

datasets:
  - path: trl-lib/DeepMath-103K
    type: prompt
    split: train

reward_funcs:
  - module_path: rewards.math_correctness
    function_name: correctness_reward
  - module_path: rewards.math_correctness
    function_name: format_reward
reward_weights: [1.0, 0.2]

sequence_len: 4096
micro_batch_size: 4
gradient_accumulation_steps: 4
num_epochs: 1
learning_rate: 0.000001

bf16: true
flash_attention: true
gradient_checkpointing: true
```

## CLI Surface

```bash
axolotl fetch examples            # download example configs
axolotl train config.yml          # train
axolotl preprocess config.yml     # tokenize + cache (run before multi-node train)
axolotl inference config.yml --base_model ./out/...   # quick inference
axolotl merge-lora config.yml     # merge LoRA adapter into base
axolotl config-schema             # print full YAML schema
```

For multi-GPU:

```bash
accelerate launch --num_processes 4 -m axolotl.cli.train config.yml
# or with deepspeed:
deepspeed --num_gpus=8 -m axolotl.cli.train config.yml
```

## Key YAML Fields (most-used)

| Field | Meaning |
|---|---|
| `base_model` | HF repo or local path |
| `adapter` | `lora`, `qlora`, `llama-adapter`, or omit for full FT |
| `lora_r`, `lora_alpha`, `lora_dropout` | LoRA config |
| `lora_target_linear: true` | Target all linear layers (recommended) |
| `lora_modules_to_save` | Trainable non-LoRA modules (embeddings, head) |
| `datasets[].type` | `alpaca`, `sharegpt`, `chat_template`, `chatml.ultra`, etc. |
| `sequence_len` | Max tokens per packed sequence |
| `sample_packing: true` | Block-diagonal attention packing |
| `rl` | `dpo`, `kto`, `orpo`, `simpo`, `grpo`, omit for SFT |
| `beta` | Preference-optimization beta (DPO/ORPO/KTO/SimPO) |
| `deepspeed` | Path to DeepSpeed config JSON |
| `fsdp`, `fsdp_config` | FSDP options instead of DeepSpeed |
| `flash_attention: true` | Enable Flash Attention 2 |
| `gradient_checkpointing` | Memory ↓, time ↑ |
| `optimizer` | `adamw_torch`, `paged_adamw_8bit`, `adamw_bnb_8bit`, `adafactor`, etc. |

## Common Pitfalls

- **`lora_target_linear: true` AND `lora_target_modules: [...]`.** Conflicting; only one wins. Use `lora_target_linear` for the modern recommendation.
- **Forgetting `pad_to_sequence_len`.** With packing, mixed-length packs slow Flash Attention if not padded; set true.
- **Wrong DeepSpeed stage.** ZeRO-2 for ≤30B on multi-GPU, ZeRO-3 for ≥70B or single-GPU-tight cases. Mismatched stage and `gradient_accumulation_steps` cause OOM.
- **`val_set_size` with packing.** Eval doesn't pack; if val is huge, eval becomes the bottleneck. Keep val small (1-5%) or disable.
- **Chat-template confusion.** `type: chat_template` requires the model's tokenizer to have one; or specify `chat_template:` explicitly. Otherwise raw concatenation happens.
- **Custom reward function paths in GRPO.** Module path is relative to the run directory. Use absolute import path or pre-install your reward package.
- **`merge-lora` running OOM.** Merging a 70B QLoRA needs to dequantize to bf16 first — needs the full bf16 model in RAM/VRAM. Run on a beefier instance.
- **Stale `prepared/` cache.** Changing dataset config but not `dataset_prepared_path` reuses old tokenization. Bust the cache.

## When to Use This Mode

Activate when the user has an Axolotl YAML, asks about SFT/DPO/GRPO recipes, mentions DeepSpeed or FSDP integration, or wants reproducible config-driven fine-tuning.

## Sources

- Axolotl GitHub: https://github.com/axolotl-ai-cloud/axolotl
- Axolotl docs: https://docs.axolotl.ai/
- Config reference: https://docs.axolotl.ai/docs/config-reference.html
- Example configs: https://github.com/axolotl-ai-cloud/axolotl/tree/main/examples

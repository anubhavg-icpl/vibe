---
name: sft-expert
description: Supervised fine-tuning fundamentals — chat templates, packing, completion-only loss, NEFTune. Use when fine-tuning, training, or adapting language models with sft techniques.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [fine-tuning, sft, training, instruction-tuning]
---

# SFT Expert Mode

You are an expert in Supervised Fine-Tuning (SFT) of language models — the workhorse method for instruction tuning, domain adaptation, and as the prerequisite step for any preference optimization. You handle chat templates, sequence packing, completion-only loss masking, and NEFTune noise injection.

## Core Concept

SFT minimizes token-level cross-entropy of the target sequence given the input:

```
L_SFT = - Σ_t log p_θ(y_t | y_<t, x)
```

Padding tokens are masked (default ignore index `-100`). The trick is *what* you compute loss on:

- **Full sequence**: loss on prompt + completion. Cheap to set up, but the model wastes capacity learning to produce the prompt back.
- **Completion-only**: loss only on the assistant response. Standard for instruction tuning.
- **Assistant-only (multi-turn)**: in a multi-turn conversation, loss only on each `assistant` message; user/system/tool messages are masked. Required for proper chat fine-tunes.

## When to Use

- Adapt a base model into an instruction follower.
- Add domain knowledge or a specific output format (JSON, tool calls).
- Create the SFT model that DPO/ORPO/KTO/SimPO will later align.
- Fast iteration cycles — SFT is the cheapest, most predictable training mode.

Skip if: you only have preference pairs (use ORPO), or you're trying to teach reasoning chains from scratch (consider distillation from a larger model).

## Implementation Pattern (TRL SFTTrainer)

```python
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

trainer = SFTTrainer(
    model="Qwen/Qwen2.5-7B",
    train_dataset=load_dataset("trl-lib/Capybara", split="train"),
    args=SFTConfig(
        output_dir="qwen-sft",
        max_length=4096,
        packing=True,                       # pack multiple short examples per sequence
        completion_only_loss=True,          # default for prompt-completion datasets
        assistant_only_loss=True,           # multi-turn: train only on assistant tokens
        learning_rate=2e-5,                 # full FT; 1e-4 for LoRA
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        num_train_epochs=2,
        bf16=True,
        gradient_checkpointing=True,
        neftune_noise_alpha=5,              # NEFTune embedding noise (optional, often helps)
    ),
)
trainer.train()
```

### Conversational Dataset Format (preferred)

```python
{"messages": [
  {"role": "system", "content": "You are concise."},
  {"role": "user",   "content": "What is 2+2?"},
  {"role": "assistant", "content": "4"},
]}
```

TRL auto-applies the model's chat template. For base models without one, set `chat_template_path="HuggingFaceTB/SmolLM3-3B"` (or any model with a good template) in `SFTConfig`.

### Prompt-Completion Format

```python
{"prompt": "Translate to French: hello",
 "completion": "bonjour"}
```

With `completion_only_loss=True` (default for this format), loss is computed only on `" bonjour"`.

## Sequence Packing

Packing concatenates multiple short examples into one fixed-length sequence with attention masking, dramatically improving GPU utilization for short-text datasets:

```python
SFTConfig(packing=True, max_length=4096)
```

Throughput gains: 2-5x on datasets with mean length << max_length. Requires Flash Attention 2 for proper block-diagonal attention.

## Hyperparameter Guidance

| Setting | Full FT | LoRA / QLoRA |
|---|---|---|
| `learning_rate` | 1e-5 to 5e-5 (TRL default 2e-5) | 1e-4 to 2e-4 |
| `num_train_epochs` | 1-3 | 2-5 |
| `lr_scheduler_type` | "cosine" | "cosine" |
| `warmup_ratio` | 0.03-0.1 | 0.03-0.1 |
| `weight_decay` | 0.01 | 0.01 |
| `max_length` | 4096-8192 | 2048-4096 |
| `packing` | True if mean << max | True |
| `neftune_noise_alpha` | 5 (optional) | 5 (optional) |

NEFTune adds uniform noise to input embeddings during training only. Reported +5 points on AlpacaEval for Llama-2-7B; harmless to try, but noise is *not* applied at eval/inference.

## Common Pitfalls

- **Wrong chat template.** Training with one template, inference with another. Always serialize the *exact* template used at training time and reuse at inference.
- **EOS token not aligned.** For Qwen, set `eos_token="<|im_end|>"` so the model stops where the template expects.
- **Loss on the system prompt.** Wastes capacity on a fixed string. Use `assistant_only_loss=True` for multi-turn.
- **Packing without Flash Attention 2.** Without proper block-diagonal masking, examples bleed into each other's attention. Always pair `packing=True` with `attn_implementation="flash_attention_2"`.
- **Truncating mid-completion.** If `max_length` cuts off the assistant response, you train on a partial completion that ends mid-token. Either filter long examples or raise `max_length`.
- **NEFTune at inference.** Don't set the noise alpha during eval — it should only fire during training.
- **Overfitting on small data.** With <10k examples, 1 epoch is often enough; 3 epochs memorize.
- **Catastrophic forgetting of general ability.** Mix in 5-10% of a general dataset (e.g. a slice of UltraChat or Tulu) when you're tuning narrowly.

## When to Use This Mode

Activate when the user is doing instruction tuning, domain adaptation, building an SFT model before DPO, or asking about packing / chat templates / completion-only loss / NEFTune.

## Sources

- TRL SFTTrainer docs: https://huggingface.co/docs/trl/main/en/sft_trainer
- NEFTune paper (Jain et al. 2023): https://arxiv.org/abs/2310.05914
- HF chat templates guide: https://huggingface.co/docs/transformers/chat_templating
- "How to fine-tune Llama 3 with TRL": https://huggingface.co/blog/llama3-fine-tuning

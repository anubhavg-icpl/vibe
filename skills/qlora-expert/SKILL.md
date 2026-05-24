---
name: qlora-expert
description: 4-bit quantized LoRA fine-tuning with NF4, double quantization, and paged optimizers
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [fine-tuning, qlora, quantization, peft, bitsandbytes]
---

# QLoRA Expert Mode

You are an expert in QLoRA (Quantized LoRA), the technique that lets you fine-tune a 65B-parameter model on a single 48 GB GPU. You combine 4-bit NormalFloat (NF4) quantization, double quantization, and paged optimizers with LoRA adapters trained in higher precision.

## Core Concept

QLoRA introduces three innovations on top of LoRA:

1. **4-bit NormalFloat (NF4)** — an information-theoretically optimal datatype for normally distributed weights. Pre-trained transformer weights are roughly N(0, σ²); NF4's 16 quantization levels are placed at the quantiles of N(0,1), minimizing quantization error.
2. **Double Quantization (DQ)** — quantize the per-block FP32 quantization constants themselves to 8-bit, saving ~0.37 bits/param.
3. **Paged Optimizers** — use NVIDIA unified memory to page optimizer states (Adam moments) between GPU and CPU RAM, avoiding OOM during long-sequence backward passes.

The frozen base is stored in NF4. Forward/backward dequantize on the fly to bf16, gradients flow through the dequantized activations into the LoRA adapters (in bf16). The base never receives a gradient update.

## When to Use

- Fine-tuning a 7B-70B model on consumer GPUs (24-48 GB).
- Memory-bound, not compute-bound — QLoRA trades ~30% throughput for ~4x memory savings.
- You're OK with adapter-only output (you can later dequantize-and-merge if you want a dense model).
- Single node; for multi-node, FSDP-QLoRA via `bitsandbytes` + `accelerate` is needed.

Skip if: you have plenty of VRAM (use plain LoRA — faster), or you need maximum quality on a tiny dataset (full bf16 LoRA wins narrowly).

## Implementation Pattern

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, prepare_model_for_kbit_training, get_peft_model
from trl import SFTTrainer, SFTConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",                   # NormalFloat-4
    bnb_4bit_use_double_quant=True,              # double quantization
    bnb_4bit_compute_dtype=torch.bfloat16,       # forward/backward in bf16
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-70B",
    quantization_config=bnb_config,
    device_map="auto",
    attn_implementation="flash_attention_2",
)
model = prepare_model_for_kbit_training(model)   # gradient checkpointing + cast layernorms

lora_config = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    bias="none", task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)

args = SFTConfig(
    output_dir="llama3-70b-qlora",
    per_device_train_batch_size=1,
    gradient_accumulation_steps=16,
    learning_rate=2e-4,
    optim="paged_adamw_8bit",                    # paged optimizer
    bf16=True,
    gradient_checkpointing=True,
)

trainer = SFTTrainer(model=model, args=args, train_dataset=ds)
trainer.train()
```

### Memory Math (70B model, NF4 + DQ)

- Weights: 70B * (4 bits + 0.5 bits DQ overhead) ≈ 39 GB
- LoRA adapters (r=16, all linear): ~200 MB
- Optimizer (paged 8-bit Adam): ~200 MB resident on GPU, rest paged
- Activations + KV: depends on seq_len; 4-8 GB at 2k tokens
- Total: fits in 48 GB; very tight on 40 GB.

## Hyperparameter Guidance (from QLoRA paper + community)

- `bnb_4bit_quant_type="nf4"` always; `"fp4"` exists but loses ~1% on benchmarks.
- `bnb_4bit_use_double_quant=True` always — small overhead, free 0.37 bits.
- `bnb_4bit_compute_dtype=torch.bfloat16` on Ampere+ (A100/H100/RTX 30/40); `float16` only on V100/T4.
- Optimizer: `paged_adamw_8bit` — 8-bit Adam to halve optimizer memory; "paged" prevents OOM spikes.
- LR: 2e-4 for 7B-13B, 1e-4 for 33B-70B (paper used 2e-4 across the board with cosine).
- Train all linear layers, not just attention. The QLoRA paper explicitly demonstrates this matters.
- Gradient checkpointing must be on; QLoRA without it exhausts memory.

## Common Pitfalls

- **Dequantize-and-merge on a small GPU.** `merge_and_unload()` materializes the full bf16 base. Either merge on CPU/larger GPU or ship the adapter only.
- **Wrong compute_dtype on V100.** V100 lacks bf16 in tensor cores; use fp16 + grad scaling.
- **Skipping `prepare_model_for_kbit_training`.** Without it, layernorms stay in fp16, gradients NaN.
- **Using `paged_adamw_32bit` with a 70B model.** You'll OOM. Use `paged_adamw_8bit`.
- **Loading then quantizing.** Always pass `quantization_config` to `from_pretrained` — quantizing post-hoc loads bf16 first and OOMs.
- **Mixed-quant FSDP without bnb >= 0.43.** Earlier versions break; check version compatibility.
- **Saving the merged 4-bit model.** You can't — merging requires dequantization. Save the adapter, or dequantize then merge.

## When to Use This Mode

Activate when the user mentions QLoRA, 4-bit fine-tuning, NF4, bitsandbytes, paged optimizers, or wants to fine-tune a >30B model on consumer hardware.

## Sources

- QLoRA paper (Dettmers et al. 2023): https://arxiv.org/abs/2305.14314
- bitsandbytes docs: https://huggingface.co/docs/bitsandbytes/main
- HF QLoRA tutorial: https://huggingface.co/blog/4bit-transformers-bitsandbytes
- FSDP+QLoRA blog: https://www.answer.ai/posts/2024-03-06-fsdp-qlora.html

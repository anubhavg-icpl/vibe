---
name: unsloth-expert
description: Unsloth — 2x faster LLM fine-tuning with 70% less VRAM via fused Triton kernels. Use when fine-tuning, training, or adapting language models with unsloth techniques.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [unsloth, fine-tuning, performance, lora, qlora]
---

# Unsloth Expert Mode

You are an expert in Unsloth (unslothai/unsloth), the open-source kernel-level LLM training accelerator. You know which Unsloth kernels apply to which model, how `FastLanguageModel.from_pretrained` differs from `AutoModelForCausalLM`, and why Unsloth caps at single-GPU for free tier.

## Core Concept

Unsloth rewrites attention, RMS norm, MLP, and cross-entropy loss as fused Triton kernels and applies algorithmic tricks (chunked CE for memory, on-the-fly RoPE, optimized backward for LoRA) to deliver:

- **2x faster training** vs vanilla HF transformers + PEFT.
- **70% less VRAM** at the same setup (driven by chunked CE + smarter activation handling).
- Up to **80% less VRAM** for GRPO with their long-context kernel optimizations.

It exposes a thin compatibility shim (`FastLanguageModel`) that mimics `AutoModelForCausalLM` while applying its kernel patches under the hood. After loading, you can use any HF/TRL trainer (SFT, DPO, GRPO, etc.) — Unsloth speeds them up transparently.

## When to Use

- Single-GPU fine-tuning of Llama, Mistral, Gemma, Qwen, Phi, DeepSeek (and 500+ supported models).
- Memory-bound on consumer hardware (RTX 4090 24 GB, A100 40 GB).
- You want the fastest "load model + LoRA + SFT" path that exists.
- LoRA, QLoRA, full FT all supported.

Skip if: you need multi-GPU/multi-node FSDP+QLoRA at scale (Unsloth Pro covers this; OSS is single-GPU focused), or you need a model not in their supported list.

## Implementation Pattern: SFT with LoRA

```python
from unsloth import FastLanguageModel
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Meta-Llama-3.1-8B",
    max_seq_length=4096,
    dtype=None,                          # auto: bf16 on Ampere+, fp16 on T4/V100
    load_in_4bit=True,                   # QLoRA-style 4-bit
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha=32,
    lora_dropout=0,                       # Unsloth optimized for dropout=0
    bias="none",
    use_gradient_checkpointing="unsloth", # Unsloth's faster GC variant
    random_state=3407,
    use_rslora=False,
    loftq_config=None,
)

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=load_dataset("trl-lib/Capybara", split="train"),
    args=SFTConfig(
        output_dir="llama3-unsloth",
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        num_train_epochs=2,
        bf16=True,
        optim="adamw_8bit",
        max_length=4096,
        packing=False,                    # Unsloth has its own packing path
    ),
)
trainer.train()

# Export
model.save_pretrained_merged("llama3-merged", tokenizer, save_method="merged_16bit")
model.save_pretrained_gguf("llama3-gguf", tokenizer, quantization_method="q4_k_m")
```

## Implementation Pattern: GRPO with Unsloth

```python
from unsloth import FastLanguageModel, PatchFastRL
PatchFastRL("GRPO", FastLanguageModel)    # patches GRPO kernels into TRL

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-1.5B-Instruct",
    max_seq_length=4096,
    load_in_4bit=True,
    fast_inference=True,                  # vLLM integration
    gpu_memory_utilization=0.5,
)

model = FastLanguageModel.get_peft_model(
    model, r=32, lora_alpha=64,
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
    use_gradient_checkpointing="unsloth",
)

from trl import GRPOConfig, GRPOTrainer
trainer = GRPOTrainer(
    model=model,
    processing_class=tokenizer,
    reward_funcs=[my_correctness_reward, my_format_reward],
    args=GRPOConfig(
        learning_rate=5e-6,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        num_generations=8,
        max_completion_length=2048,
        use_vllm=True,
        bf16=True,
    ),
    train_dataset=ds,
)
trainer.train()
```

## Export Targets

| Method | Output |
|---|---|
| `save_pretrained_merged(..., save_method="merged_16bit")` | Single bf16 safetensors model (LoRA folded in) |
| `save_pretrained_merged(..., save_method="merged_4bit")` | 4-bit merged for inference servers that support it |
| `save_pretrained_gguf(..., quantization_method="q4_k_m")` | llama.cpp / Ollama format |
| `save_pretrained(...)` | LoRA adapter only (HF standard) |
| `push_to_hub_merged(...)` / `push_to_hub_gguf(...)` | Direct upload variants |

GGUF quantization options: `q4_k_m`, `q5_k_m`, `q8_0`, `f16`, etc. — `q4_k_m` is the typical balance.

## Hyperparameter Guidance

- `dtype=None` lets Unsloth pick (bf16 on A100/H100/RTX 30+; fp16 elsewhere).
- `load_in_4bit=True` for QLoRA-style memory savings; `load_in_8bit=True` is also supported.
- `lora_dropout=0` is Unsloth's optimized path; non-zero dropout disables some kernels.
- `use_gradient_checkpointing="unsloth"` (string!) uses Unsloth's lower-overhead variant. Plain `True` reverts to HF GC.
- `optim="adamw_8bit"` (bitsandbytes) for memory; full `adamw_torch` if you have headroom.
- `max_seq_length` set at load time and respected throughout — sets RoPE scaling and kernel allocations.
- `random_state` for full reproducibility (seeds LoRA init).

Pre-quantized model variants on HF: `unsloth/<model>-bnb-4bit` skip the quantization step at load (faster startup, identical math).

## Common Pitfalls

- **Mixing `FastLanguageModel.get_peft_model` with `peft.get_peft_model`.** Use Unsloth's wrapper consistently — its kernels expect specific module structure.
- **`use_gradient_checkpointing=True` instead of `"unsloth"`.** Loses ~30% of the memory savings.
- **`lora_dropout > 0` silently disables fused backward.** Rule: keep dropout at 0 with Unsloth unless you specifically need it.
- **Unsupported model ID.** If your model isn't in Unsloth's list, you'll get a runtime error or fall back to slow path. Check the supported-models doc.
- **Multi-GPU on free tier.** OSS Unsloth is optimized for single-GPU; multi-GPU works but you lose most of the speedup. Use Unsloth Pro/Studio for multi-GPU kernels.
- **Overriding `dtype` to `torch.float16` on Ampere+.** You'll lose bf16 stability and gain nothing.
- **Saving merged with QLoRA-loaded base on a small GPU.** Merging requires dequantization → full bf16 in memory. Either use a bigger GPU or use `merged_4bit`.
- **`fast_inference=True` without enough GPU memory.** vLLM and the policy share VRAM; lower `gpu_memory_utilization` if OOM.

## When to Use This Mode

Activate when the user is on a single GPU with limited VRAM, mentions Unsloth or `FastLanguageModel`, wants 2x training speed, or wants GGUF/Ollama export from a fine-tune.

## Sources

- Unsloth GitHub: https://github.com/unslothai/unsloth
- Unsloth docs: https://docs.unsloth.ai/
- Supported models list: https://docs.unsloth.ai/get-started/all-our-models
- TRL Unsloth integration: https://huggingface.co/docs/trl/main/en/unsloth_integration

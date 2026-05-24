---
name: quantization-format-expert
description: Pick between GGUF K/IQ quants, AWQ, GPTQ, bitsandbytes NF4, EXL2, MLX 4-bit, NVFP4 — decision matrix by hardware and serving stack
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, quantization, awq, gptq, gguf, bitsandbytes, exl2, mlx, nvfp4, nf4]
---

# Quantization Format Expert Mode

You are an expert in the quantization format zoo. You choose between **GGUF K-quants vs IQ-quants**, **AWQ**, **GPTQ**, **bitsandbytes NF4/FP4**, **EXL2**, **MLX 4-bit**, and the newer **NVFP4 / MXFP4** based on target hardware, serving stack, latency budget, and quality tolerance.

## Core Concept

Quantization compresses a fp16/bf16 model by storing weights at 2-8 bits. There are four families:

| Family | Calibration | Storage | Best on |
|--------|------------|---------|---------|
| **GGUF K-quants** (`Q4_K_M`, `Q5_K_M`, `Q6_K`, `Q8_0`) | none required | block-wise scales | CPU + ARM + any GPU via llama.cpp |
| **GGUF IQ-quants** (`IQ1_S`...`IQ4_XS`) | requires imatrix | smaller per bit | RAM-bound; slower on AVX2 |
| **AWQ** (Activation-aware) | calibration set | 4-bit groupwise | NVIDIA GPU via vLLM/TGI/AutoAWQ |
| **GPTQ** | calibration set | 4-bit + zero-point | NVIDIA GPU via vLLM/TGI/transformers |
| **bitsandbytes NF4/FP4** | none, on-the-fly | 4-bit | training (QLoRA) + transformers serving |
| **EXL2** | calibration | variable bpw per layer | ExLlamaV2 only |
| **MLX 4-bit/8-bit** | none | groupwise | Apple Silicon |
| **NVFP4 / MXFP4** | hardware-supported | 4-bit float | H100/H200/B100; Marlin kernels |

## Real Examples

### GGUF K-quant decision (llama.cpp)

```bash
# Default high-quality compromise (~5 GB for 7B)
./llama-quantize model-f16.gguf model-q4_K_M.gguf Q4_K_M

# Better quality (~5.5 GB)
./llama-quantize model-f16.gguf model-q5_K_M.gguf Q5_K_M

# Near-lossless (~7.6 GB)
./llama-quantize model-f16.gguf model-q8_0.gguf Q8_0
```

### GGUF IQ-quant with imatrix (sub-4-bit)

```bash
# 1. Generate calibration imatrix
./llama-imatrix -m model-f16.gguf -f wiki.train.raw -o model.imatrix

# 2. Quantize with imatrix
./llama-quantize --imatrix model.imatrix model-f16.gguf model-iq3_m.gguf IQ3_M
./llama-quantize --imatrix model.imatrix model-f16.gguf model-iq2_s.gguf IQ2_S
```

IQ-quants gain 10-30% perplexity advantage over K-quants at the same bit count below Q4 — but they're slower on AVX2 CPUs because of the lookup-table inner loop.

### AWQ (AutoAWQ → vLLM)

```python
from awq import AutoAWQForCausalLM
from transformers import AutoTokenizer

model = AutoAWQForCausalLM.from_pretrained("meta-llama/Meta-Llama-3.1-8B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3.1-8B-Instruct")
quant_config = {"zero_point": True, "q_group_size": 128, "w_bit": 4, "version": "GEMM"}
model.quantize(tok, quant_config=quant_config, calib_data="pileval")
model.save_quantized("./llama-3.1-8b-awq")
tok.save_pretrained("./llama-3.1-8b-awq")
```

```bash
vllm serve ./llama-3.1-8b-awq --quantization awq_marlin
```

`awq_marlin` is the fast kernel; `awq` is the reference path.

### GPTQ (AutoGPTQ → vLLM)

```python
from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig
qconfig = BaseQuantizeConfig(bits=4, group_size=128, desc_act=False)
model = AutoGPTQForCausalLM.from_pretrained("meta-llama/Meta-Llama-3.1-8B-Instruct", qconfig)
model.quantize(calibration_dataset)
model.save_quantized("./llama-3.1-8b-gptq")
```

```bash
vllm serve ./llama-3.1-8b-gptq --quantization gptq_marlin
```

### bitsandbytes NF4 (on-the-fly, no calibration)

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
import torch

bnb = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # or "fp4"
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3.1-8B-Instruct", quantization_config=bnb, device_map="auto")
```

bitsandbytes is the only path for **QLoRA training**. Serving throughput is lower than AWQ/GPTQ.

### EXL2 (ExLlamaV2)

```bash
python convert.py -i ./llama-3.1-8b -o ./llama-3.1-8b-exl2 -b 4.5  # 4.5 bpw avg
```

EXL2 chooses bpw per layer to maximise quality. Highest quality-per-bit but only runs in ExLlamaV2 / oobabooga.

### MLX 4-bit (Apple Silicon)

```bash
mlx_lm.convert --hf-path meta-llama/Meta-Llama-3.1-8B-Instruct \
  --mlx-path ./llama-mlx-4bit -q --q-bits 4 --q-group-size 64
```

### NVFP4 / MXFP4 (Hopper / Blackwell)

```python
# vLLM with NVFP4 (post-conversion via nvidia-modelopt)
from modelopt.torch.quantization import quantize
qmodel = quantize(model, "FP4_DEFAULT_CFG")
```

```bash
vllm serve ./model-nvfp4 --quantization nvfp4
```

NVFP4 needs Hopper/Blackwell + recent CUDA + recent vLLM. **Does not currently support LoRA adapters** — use GPTQ-Int4 if you need LoRA.

## Decision Matrix

| Constraint | Pick |
|-----------|------|
| Run on laptop CPU / Apple Silicon (non-MLX) | GGUF Q4_K_M |
| Run on Apple Silicon, native | MLX 4-bit |
| NVIDIA GPU server, max throughput | AWQ-Marlin or GPTQ-Marlin |
| NVIDIA H100/B100 | NVFP4 (no LoRA) or AWQ-Marlin |
| Need LoRA + 4-bit serve | GPTQ-Int4 |
| Train QLoRA | bitsandbytes NF4 |
| ≤4 bpw on CPU | GGUF IQ3_M / IQ4_XS with imatrix |
| Best quality per bit, single-user GPU | EXL2 |
| Multi-format compatibility (Ollama, llama.cpp, web) | GGUF |
| One-line conversion, no calibration | bitsandbytes or GGUF K |

## Common Pitfalls

- **Quantizing without imatrix below Q5** — naive sub-Q5 K-quant loses 0.3+ perplexity. Always use imatrix for ≤Q4.
- **AWQ calibration set too narrow** — calibrating on only English shifts multilingual performance. Use a balanced set (pileval, c4, custom domain mix).
- **GPTQ `desc_act=True` slow at inference** — `desc_act=True` improves quality but disables Marlin kernel. For serving prefer `desc_act=False`.
- **Mixing AWQ + LoRA** — works in vLLM but LoRA must be loaded against fp16 base; AWQ + LoRA needs careful setup. NVFP4 + LoRA does not work yet.
- **bitsandbytes 4-bit with prompt caching** — interactions with vLLM cache are immature; benchmark before relying on it.
- **EXL2 portability** — only runs in ExLlamaV2; can't use it from vLLM, llama.cpp, or transformers.
- **MLX 4-bit on Intel Mac** — falls back to CPU and is unusable. M-series only.
- **Treating quant as free** — even Q8_0 introduces a small perplexity bump. Always measure on your eval set, not vibes.
- **Re-quantizing an already-quantized file** — convert from the original fp16/bf16 source. Quantizing GGUF Q4 → Q3 stacks errors.

## Compatibility Notes

| Engine | GGUF | AWQ | GPTQ | bnb | EXL2 | MLX | NVFP4 |
|--------|------|-----|------|-----|------|-----|-------|
| llama.cpp | yes | no | no | no | no | no | no |
| Ollama | yes | no | no | no | no | no | no |
| vLLM | no | yes | yes | partial | no | no | yes |
| TGI | no | yes | yes | yes | no | no | partial |
| transformers | no | yes | yes | yes | no | no | no |
| ExLlamaV2 | no | no | yes | no | yes | no | no |
| MLX-LM | no | no | no | no | no | yes | no |

## When to Use This Mode

- Picking the quant for a release matrix.
- Debugging quality regressions after quantization.
- Choosing between AWQ vs GPTQ for vLLM deployment.
- Sub-4-bit shipping for memory-constrained edge.
- Evaluating EXL2 vs GGUF tradeoff for single-user setups.

## Sources

- [llama.cpp quantize docs](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md)
- [AutoAWQ](https://github.com/casper-hansen/AutoAWQ)
- [AutoGPTQ](https://github.com/AutoGPTQ/AutoGPTQ)
- [bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes)
- [ExLlamaV2](https://github.com/turboderp-org/exllamav2)
- [oobabooga GPTQ vs AWQ vs EXL2 benchmark](https://oobabooga.github.io/blog/posts/gptq-awq-exl2-llamacpp/)
- [Quantization Methods Compared (ai.rs)](https://ai.rs/ai-developer/quantization-methods-compared)
- [vLLM Quantization Guide (Jarvis Labs)](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks)
- [LLM Quantization Guide 2026 (PremAI)](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/)

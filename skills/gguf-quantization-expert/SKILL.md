---
name: gguf-quantization-expert
description: Convert HF safetensors to GGUF, run llama-imatrix, choose K-quants vs IQ-quants, and quantize models for llama.cpp. Use when deploying, running, or configuring local LLM inference with gguf quantization.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: local-llm
  tags: [local-llm, gguf, quantization, llama-cpp, imatrix, k-quants, iq-quants]
---

# GGUF Quantization Expert Mode

You are an expert in the GGUF format and the `llama.cpp` quantization toolchain. You convert HuggingFace `safetensors` to GGUF, generate importance matrices (imatrix) on representative calibration text, and pick the right quant level for the target hardware budget. You measure perplexity, not vibes.

## Core Capabilities

- Convert HF models to GGUF F16/BF16 with `convert_hf_to_gguf.py`
- Generate imatrix with `llama-imatrix` on `wiki.train.raw` or `groups_merged.txt`
- Quantize to K-quants (Q2_K, Q3_K_S/M/L, Q4_K_S/M, Q5_K_S/M, Q6_K, Q8_0)
- Quantize to IQ-quants (IQ1_S/M, IQ2_XXS/XS/S/M, IQ3_XXS/XS/S/M, IQ4_XS/NL)
- Measure quality with `llama-perplexity`, throughput with `llama-bench`
- Pick quant per VRAM/quality target — Q4_K_M default; Q5/Q6 if VRAM allows; IQ for ≤4-bit
- Strip / requantize tensors, hold output tensor at higher precision
- Embed imatrix and dataset metadata in the resulting GGUF

## Approach

1. **Convert to F16 first** — never quantize from BF16 if you can avoid it; convert to F16 GGUF then quantize.
2. **Always run imatrix for ≤ Q5** — imatrix typically reduces perplexity 10-30% versus naive quantization, especially for sub-Q5 quants.
3. **Pick K-quant for ≥4 bpw**, IQ-quant for ≤4 bpw. K-quants are faster on most hardware; IQ-quants are smaller per bit but slower on AVX2 CPUs.
4. **Verify** with perplexity on a held-out wikitext sample. A 0.05-0.10 ppl bump is normal; >0.3 means the quant is too aggressive.
5. **Pin the imatrix dataset** in the GGUF metadata so consumers can audit calibration source.

## Key Patterns

### Convert HF safetensors → GGUF F16

```bash
python convert_hf_to_gguf.py \
  /path/to/Qwen2.5-7B-Instruct \
  --outfile qwen2.5-7b-instruct-f16.gguf \
  --outtype f16
```

Use `--outtype bf16` if the source is BF16 and you want zero conversion loss before quantization.

### Generate importance matrix

```bash
# Calibration data: wiki.train.raw (~20MB) is the standard
wget https://huggingface.co/datasets/eaddario/imatrix-calibration/resolve/main/wiki.train.raw

./llama-imatrix \
  -m qwen2.5-7b-instruct-f16.gguf \
  -f wiki.train.raw \
  -o qwen2.5-7b.imatrix.gguf \
  -ngl 99 \
  --chunks 100
```

Default output is GGUF format. Pass `--output-format dat` only if a downstream tool needs the legacy form.

### Quantize with imatrix

```bash
./llama-quantize \
  --imatrix qwen2.5-7b.imatrix.gguf \
  qwen2.5-7b-instruct-f16.gguf \
  qwen2.5-7b-instruct-q4_k_m.gguf \
  Q4_K_M
```

### Hold output tensor at higher precision

```bash
./llama-quantize \
  --imatrix imatrix.gguf \
  --output-tensor-type Q8_0 \
  --token-embedding-type Q8_0 \
  model-f16.gguf model-iq3_xxs.gguf IQ3_XXS
```

This is the difference between a usable IQ3 and an unusable one for ≤7B models.

### Measure perplexity

```bash
./llama-perplexity -m model-q4_k_m.gguf -f wiki.test.raw -ngl 99
```

Compare against the F16 baseline. K-quants Q4_K_M typically adds +0.05 to +0.10 ppl on Llama-class models.

### Picking the right quant (rule of thumb)

| Bpw target | Recommended quant | Notes |
|-----------:|-------------------|-------|
| 8.0 | Q8_0              | Reference quality, big |
| 6.6 | Q6_K              | Near-lossless, common pick |
| 5.5 | Q5_K_M            | Best 5-bit balance |
| 4.8 | Q4_K_M            | **Default for most use** |
| 4.5 | IQ4_XS / IQ4_NL   | Smaller than Q4_K_M, similar quality with imatrix |
| 3.5 | IQ3_M / IQ3_S     | 70B fits 32GB |
| 2.7 | IQ2_M             | 70B fits 24GB; quality drop noticeable |
| 2.2 | IQ2_XXS           | Last-resort, only 70B+ holds together |

### Quantize multiple variants in one pass

```bash
for q in Q4_K_M Q5_K_M Q6_K IQ4_XS; do
  ./llama-quantize --imatrix im.gguf model-f16.gguf model-${q,,}.gguf "$q"
done
```

## Common Pitfalls

- **Quantizing without imatrix below Q5** → measurable quality regression on instruction following. Always use imatrix for Q4 and below.
- **Calibration dataset that mismatches use case** — pure code calibration ruins prose models. Use `wiki.train.raw` or `groups_merged.txt` (mixed) for general models; add domain text for specialized ones.
- **Calibration overfitting** — feeding the model your eval prompts as calibration gives misleading benchmarks. Keep them separate.
- **Re-quantizing already quantized GGUFs** — only allowed with `--allow-requantize` and quality only goes down. Always quantize from F16/BF16.
- **IQ-quants on weak CPU** — they need fast SIMD; on a Raspberry Pi, K-quants are 2-3x faster.
- **Forgetting `--token-embedding-type` / `--output-tensor-type`** for ≤Q3 quants — the embedding/output layer dominates final quality.
- **Wrong `--outtype`** in conversion (e.g. `q8_0`) skips the F16 intermediate; you lose ability to re-quantize cheaply later.

## Hardware/Resource Sizing

- **Conversion**: needs RAM ≥ model size (F16). 70B → 140GB. Consider `--split` or convert on a fat node.
- **Imatrix**: GPU strongly recommended. 7B + 100 chunks of wiki = ~3 min on RTX 4090; ~30 min CPU-only.
- **Quantization**: I/O bound, ~2-5 min for 7B on NVMe; minutes more for 70B.
- **Disk**: keep F16 around if you plan to re-quantize. Otherwise discard after generating final variants.

## When to Use This Mode

- Producing optimal GGUFs for `llama-server`, Ollama, LM Studio, Jan
- Custom fine-tunes (LoRA-merged) you want to ship as quants
- Audit / reproduce a community quant whose imatrix source is unknown
- Compare quant levels for a target VRAM budget
- Use **llama-cpp-expert** for runtime tuning of an existing GGUF
- Use **mlx-apple-silicon-expert** for MLX 4-bit quantization on Mac

## Sources

- [llama-quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md)
- [llama-imatrix README](https://github.com/ggml-org/llama.cpp/blob/master/tools/imatrix/README.md)
- [Quantizing Models guide](https://mintlify.com/ggml-org/llama.cpp/models/quantizing-models)
- [imatrix overfitting discussion #5263](https://github.com/ggml-org/llama.cpp/discussions/5263)
- [imatrix near-random data discussion #5006](https://github.com/ggml-org/llama.cpp/discussions/5006)
- [Qwen llama.cpp quantization guide](https://qwen.readthedocs.io/en/latest/quantization/llama.cpp.html)

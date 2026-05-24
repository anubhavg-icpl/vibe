---
name: distil-mini-model-expert
description: Author small distilled models for shipping — choose teacher, design distillation recipe, evaluate on real prompts before publish, GGUF quant for footprint. Use when creating, converting, or publishing model files with distil mini model.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, distillation, small-models, slm, knowledge-distillation, gguf, deployment]
---

# Distil / Mini Model Expert Mode

You are an expert at authoring **small / distilled models** for on-device or edge deployment. You pick a teacher (frontier model or specialised in-house), choose the distillation recipe (response distillation vs logit / KL distillation vs feature distillation), evaluate on real-world prompts before push, and quantize the student to GGUF / MLX / ONNX for footprint.

## Core Concept

Distillation transfers behavior from a large **teacher** to a smaller **student**. Three variants:

| Type | What's matched | Needs teacher logits? |
|------|---------------|----------------------|
| **Response (text) distillation** | Final tokens / responses | No — just outputs |
| **Logit / KL distillation** | Soft probability dist over vocab | Yes — full logits at every position |
| **Feature / hidden-state distillation** | Intermediate activations | Yes — full hidden states |

Modern open-model practice is dominated by **response distillation** because it works with closed-API teachers (GPT-4o, Claude, o3) and avoids licensing issues with logits. DeepSeek-R1-Distill-Qwen-7B was built this way: take Qwen2.5-7B, fine-tune on R1 outputs, ship.

### Pipeline

```
[teacher]  →  [synthetic dataset]  →  [student SFT]  →  [optional DPO/RLAIF]  →  [eval]  →  [quantize]  →  [publish]
```

## Real Examples

### 1. Pick teacher + student

| Goal | Teacher candidate | Student candidate |
|------|-------------------|-------------------|
| General chat for laptop | Claude Sonnet / GPT-4o | Llama 3.2 3B, Phi-3.5 mini, Qwen 2.5 3B |
| Reasoning on edge | o3-mini, R1, Sonnet thinking | Qwen 2.5 7B, Mistral 7B |
| Coding on phone | GPT-4o, Claude, Codestral | Qwen 2.5 Coder 1.5B, Phi-3.5-mini |
| Tool use / agents | Claude / GPT-4 with tools | Mistral 7B, Llama 3.1 8B |

Match the student's **architecture family** to expected deployment runtime — Llama-arch is GGUF-mature, Phi-3 is MLX/ONNX-friendly, Gemma is mobile-friendly via MediaPipe.

### 2. Build a synthetic dataset (response distillation)

```python
import anthropic
client = anthropic.Anthropic()

def generate_pair(prompt, model="claude-opus-4-7"):
    msg = client.messages.create(
        model=model, max_tokens=1024,
        messages=[{"role":"user","content":prompt}],
    )
    return {"prompt": prompt, "completion": msg.content[0].text}

# Iterate over a curated prompt set covering target distribution
prompts = json.load(open("prompts.json"))
dataset = [generate_pair(p) for p in prompts]
```

Tips:

- **Cover real-world prompt distribution** — sample from production logs (with PII scrub), not from synthetic adversarial sets.
- **Include refusals** — the teacher's refusals teach the student safety.
- **Reject low-quality** — auto-filter teacher outputs by length, language detection, hallucination signal.
- **License the outputs** — many providers' ToS restrict using outputs to train competing models. Read terms.

### 3. SFT the student (axolotl / TRL)

```yaml
# axolotl distill.yml
base_model: Qwen/Qwen2.5-3B
sequence_len: 4096
adapter: lora
lora_r: 32
lora_alpha: 64
lora_target_modules: [q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj]
datasets:
  - path: ./distill_data.jsonl
    type: chat_template
    chat_template: chatml
num_epochs: 3
optimizer: adamw_bnb_8bit
learning_rate: 0.0002
warmup_steps: 100
gradient_accumulation_steps: 4
micro_batch_size: 4
```

```bash
accelerate launch -m axolotl.cli.train distill.yml
python -m axolotl.cli.merge_lora distill.yml --lora_model_dir ./out
```

### 4. Logit distillation (open-weights teacher only)

```python
import torch.nn.functional as F

# Teacher and student forward
with torch.no_grad():
    t_logits = teacher(input_ids).logits
s_logits = student(input_ids).logits

T = 2.0  # temperature
loss_kd = F.kl_div(
    F.log_softmax(s_logits / T, dim=-1),
    F.softmax(t_logits / T, dim=-1),
    reduction="batchmean") * (T * T)

loss = 0.5 * loss_ce + 0.5 * loss_kd
```

Used when both teacher and student are open weights with same tokenizer.

### 5. Evaluate on real prompts before quantize

```bash
# Sanity baseline vs teacher
promptfoo eval --providers openai:gpt-4o anthropic:claude-opus-4-7 \
  ollama:my-distil-3b --prompts ./real_prompts.yaml \
  --tests ./assertions.yaml

# Domain accuracy
lm_eval --model hf --model_args pretrained=./out \
  --tasks mmlu,gsm8k,arc_challenge --batch_size 8

# Latency on target hardware
llama-bench -m ./out-q4_K_M.gguf -p 512 -n 128
```

Eval **before** quantization to know what the model actually learned, then **after** to see the quant cost.

### 6. Quantize for footprint

```bash
# Convert to GGUF F16
python convert_hf_to_gguf.py ./merged --outfile distil-3b-f16.gguf --outtype f16

# Generate imatrix for sub-Q5
./llama-imatrix -m distil-3b-f16.gguf -f calibration.txt -o distil-3b.imatrix

# Quantize at multiple targets
for q in Q4_K_M Q5_K_M Q8_0; do
  ./llama-quantize distil-3b-f16.gguf distil-3b-$q.gguf $q
done
./llama-quantize --imatrix distil-3b.imatrix distil-3b-f16.gguf distil-3b-iq3_m.gguf IQ3_M
```

For Apple Silicon: `mlx_lm.convert --hf-path ./merged --mlx-path ./distil-3b-mlx -q --q-bits 4`.

### 7. Publish

```bash
# HF Hub
huggingface-cli upload yourname/distil-3b-q4 ./distil-3b-q4_K_M.gguf

# Ollama
ollama create yourname/distil:3b-q4_K_M -f Modelfile
ollama push yourname/distil:3b-q4_K_M
```

## Common Pitfalls

- **Teacher contamination** — training on prompts that overlap eval sets gives misleading scores. Decontaminate against MMLU/GSM8K/HumanEval.
- **License violation** — using OpenAI/Anthropic outputs to build a competing commercial model violates ToS. Distill for personal/research or use openly-licensed teachers (Llama, Qwen).
- **Tokenizer mismatch** — logit distillation across different tokenizers requires a vocab projection layer; usually not worth the complexity.
- **Overfit to teacher style** — student parrots teacher tics ("Certainly! Here is..."). Mix in human-written data.
- **Evaluating only on benchmarks** — high MMLU + bad real-world prompts is the most common distil failure. Always include domain prompts in eval.
- **Quant before SFT eval** — quantize first and you can't separate distillation quality from quant cost.
- **Calibration data drift in IQ-quants** — use distillation-domain text in the imatrix call, not just wikitext.
- **Skipping safety tuning** — student inherits teacher behavior but may regress on refusals. Re-eval safety after distill.
- **Smaller student doesn't mean smaller binary** — Phi-3.5-mini at fp16 is 7.6 GB; quantize to ship.

## Compatibility Notes

- Common student bases: Qwen 2.5 0.5B/1.5B/3B/7B, Llama 3.2 1B/3B, Phi-3.5 mini/medium, Gemma 2 2B/9B, SmolLM2.
- Teachers commonly used: GPT-4o, Claude Opus / Sonnet, o3, R1, Llama 3.1 405B.
- Frameworks: Axolotl, TRL, Unsloth, LLaMA-Factory, OpenPipe, DistillKit.
- DeepSeek published the recipe used for R1-Distill-Qwen-7B (response distill, no RL on student).
- For mobile: ONNX Runtime Mobile, MediaPipe (Gemma), Core ML (Llama / Phi via conversion).

## When to Use This Mode

- Shipping a chatbot to a phone / laptop / browser.
- Replacing repeated GPT-4 calls on a narrow task with a free-to-run student.
- Building a domain-specialist mini model without pretraining from scratch.
- Compressing a 70B in-house model to a 7B serving footprint.
- Authoring a release for the SLM benchmark community.

## Sources

- [DeepSeek-R1-Distill-Qwen-7B model card](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B)
- [MiniLLM paper (on-policy distillation)](https://arxiv.org/abs/2306.08543)
- [MiniPLM (pretraining-stage distillation)](https://openreview.net/forum?id=tJHDw8XfeC)
- [HF blog — distillation in transformers](https://huggingface.co/docs/transformers/main/en/model_memory_anatomy)
- [Axolotl docs](https://github.com/axolotl-ai-cloud/axolotl)
- [TRL distillation example](https://huggingface.co/docs/trl/main/en/sft_trainer)
- [On-device distillation explained (Enclave AI)](https://enclaveai.app/blog/2026/03/29/llm-knowledge-distillation-on-device-explained/)

---
name: distillation-expert
description: Teacher-student LLM distillation — logits, on-policy distillation, context distillation. Use when fine-tuning, training, or adapting language models with distillation techniques.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [distillation, fine-tuning, training, compression]
---

# Knowledge Distillation Expert Mode

You are an expert in distilling large language model capabilities into smaller students. You pick between hard-label SFT distillation, soft-label (logit) KL distillation, on-policy distillation (e.g., DistillKit, MiniLLM, GKD), and context distillation for behavioral compression.

## Core Concepts

### 1. Hard-Label (Sequence-Level) Distillation

Generate completions with a strong teacher; SFT the student on those completions. This is by far the most common form in practice (e.g., Alpaca from `text-davinci-003`, OpenHermes from GPT-4).

### 2. Soft-Label (Logit / KL) Distillation

Train the student to match the teacher's full output distribution token-by-token:

```
L_KD = α * KL(p_teacher(·|x, y_<t) || p_student(·|x, y_<t)) + (1-α) * L_SFT
```

Often with temperature `T > 1` to soften both distributions and surface dark knowledge in the tails.

### 3. On-Policy Distillation (GKD, DistillKit, MiniLLM)

The student samples its **own** completions; the teacher scores or critiques them. Avoids exposure bias of pure off-policy KD and matches RL post-training distributions far better.

### 4. Context Distillation

Distill *behavior elicited by a long system prompt* into a model that doesn't need that prompt at inference. Useful for compressing safety constitutions, complex personas, or long few-shot demos into the weights.

## When to Use

- Compress a frontier model into a 1-7B student you can serve cheaply.
- Replace a closed-API dependency with an open weight model trained on its outputs (license permitting).
- Inherit reasoning traces from a R1-class model into a smaller model.
- Bake in a long system prompt to avoid paying for it at every inference.

Skip if: the student is already near the teacher's capability (diminishing returns), or you can fine-tune the teacher directly (just do SFT/DPO).

## Implementation Pattern A: Hard-Label SFT Distillation

```python
# Step 1: generate completions with teacher (offline)
from transformers import pipeline
gen = pipeline("text-generation", model="Qwen/Qwen2.5-72B-Instruct", device_map="auto")
prompts = load_dataset("HuggingFaceH4/no_robots", split="train")["prompt"]
completions = [gen(p, max_new_tokens=512)[0]["generated_text"] for p in prompts]

# Step 2: SFT the student
from trl import SFTTrainer, SFTConfig
trainer = SFTTrainer(
    model="Qwen/Qwen2.5-1.5B",
    train_dataset=Dataset.from_dict({"prompt": prompts, "completion": completions}),
    args=SFTConfig(completion_only_loss=True, learning_rate=2e-5),
)
trainer.train()
```

## Implementation Pattern B: Logit KL Distillation (GKDTrainer)

TRL provides `GKDTrainer` (Generalized Knowledge Distillation, Agarwal et al. 2024) which combines on-policy generation with teacher-distribution matching:

```python
from trl import GKDTrainer, GKDConfig
from transformers import AutoModelForCausalLM

teacher = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-72B-Instruct", torch_dtype="bfloat16")
student = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-1.5B")

args = GKDConfig(
    output_dir="qwen-gkd",
    teacher_model_name_or_path=None,         # use the loaded teacher object
    lmbda=0.5,                                # student-self vs teacher-data mix (on-policy fraction)
    beta=0.5,                                 # JSD interpolation between forward/reverse KL
    temperature=1.0,
    learning_rate=2e-5,
    bf16=True,
)

trainer = GKDTrainer(
    model=student,
    teacher_model=teacher,
    args=args,
    train_dataset=ds,
)
trainer.train()
```

## Implementation Pattern C: Context Distillation (sketch)

```python
# Run teacher with the long system prompt; capture its outputs.
LONG_SYSTEM = "You are SafetyBot. Always... [several KB of policy] ..."
teacher_outputs = [teacher(LONG_SYSTEM + "\n\n" + user_msg) for user_msg in user_msgs]

# Train student WITHOUT the system prompt to produce the same outputs.
student_dataset = [{"prompt": user_msg, "completion": out}
                   for user_msg, out in zip(user_msgs, teacher_outputs)]
# Standard SFT from here.
```

## Hyperparameter Guidance

| Knob | Hard-label SFT | Logit KL / GKD |
|---|---|---|
| `learning_rate` | 1e-5 to 5e-5 | 1e-5 to 2e-5 |
| `temperature` (KL) | n/a | 1.0–2.0 |
| `lmbda` (GKD on-policy fraction) | n/a | 0.25–0.5 |
| `beta` (JSD mix in GKD) | n/a | 0.5 (JSD); 0 = forward KL, 1 = reverse KL |
| Dataset size | 50k–500k | 10k–100k (logits are richer per token) |

Forward KL (teacher mode-covering) tends to make the student bland but safe. Reverse KL (teacher mode-seeking) sharpens but can collapse to one mode. JSD at `beta=0.5` is a robust default.

## Common Pitfalls

- **Tokenizer mismatch between teacher and student.** Logit-level KD requires *identical* vocabularies. If they differ, fall back to hard-label distillation or use a vocabulary-projection layer.
- **Off-policy distillation exposure bias.** A student trained only on teacher trajectories may flounder on its own samples. Mix in on-policy data (GKD) or do a follow-up RL pass.
- **License contamination.** OpenAI/Anthropic ToS forbid using outputs to train competing models; check licensing before distilling closed APIs.
- **Distilling reasoning traces incoherently.** R1-style traces have specific markers (`<think>...</think>`); preserve them in the student's chat template or strip them consistently.
- **Over-distillation kills creativity.** A student perfectly matching the teacher loses diversity. Stop early and evaluate on real tasks, not just KL.
- **Forgetting the SFT term in KL distillation.** Pure KL with no ground-truth anchor sometimes diverges; keep `(1-α) * L_SFT` at α≈0.5.

## When to Use This Mode

Activate when the user wants to compress a large model, mentions distillation / GKD / DistillKit / MiniLLM, asks about teacher-student training, or wants to bake a long system prompt into weights.

## Sources

- GKD paper (Agarwal et al. 2024): https://arxiv.org/abs/2306.13649
- TRL GKDTrainer docs: https://huggingface.co/docs/trl/main/en/gkd_trainer
- arcee-ai DistillKit: https://github.com/arcee-ai/DistillKit
- MiniLLM paper (Gu et al. 2023): https://arxiv.org/abs/2306.08543
- Anthropic context distillation: https://www.anthropic.com/research/context-distillation

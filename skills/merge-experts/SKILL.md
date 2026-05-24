---
name: merge-experts
description: MergeKit recipes — SLERP, TIES, DARE, model soups, task arithmetic, MoE merging. Use when fine-tuning, training, or adapting language models with merge experts techniques.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: llm-training
  tags: [merging, mergekit, slerp, ties, dare, model-soups]
---

# Model Merging Expert Mode

You are an expert in post-hoc model merging using MergeKit (arcee-ai/mergekit). You combine fine-tuned LLMs without additional training to recover or stack capabilities, build cheap MoE models, and run leaderboard-style mash-ups responsibly.

## Core Concept

Model merging takes two or more checkpoints derived from a common ancestor and combines their weights into a single model — no gradients, no data, just tensor arithmetic. The major methods:

| Method | What it does |
|---|---|
| **Linear** | Weighted average of N models. Simplest baseline (also called "model soup"). |
| **SLERP** | Spherical linear interpolation between two models — preserves vector norm direction. |
| **Task Arithmetic** | Add/subtract "task vectors" (`delta = finetuned - base`) onto a base. |
| **TIES** | Trim small-magnitude deltas, elect sign by majority, then merge — handles destructive interference. |
| **DARE** | Drop random elements + rescale before merging — restores most quality post-pruning. |
| **DARE-TIES** | DARE pruning then TIES merging — current popular recipe. |
| **Model Stock** | Geometric weight calculation across many checkpoints (Apple's approach). |
| **DELLA / DELLA-Linear** | Magnitude-pruning + adaptive sampling refinement of TIES. |
| **NuSLERP / Karcher Mean** | Multi-model spherical extensions. |
| **Passthrough** | Stitch layer slices from different models (frankenmerges, MoE construction). |

## When to Use

- Combine specialized fine-tunes (math + code + chat) into one model without re-training.
- Build a cheap "ensemble in one model" without inference cost.
- Construct a Mixture-of-Experts from independent dense fine-tunes (`mergekit-moe`).
- Climb leaderboards without compute (be aware of contamination concerns).
- Recover quality after aggressive pruning.

Skip if: the constituent models don't share a base (merging a Llama with a Mistral is nonsense), you're solving a specific task and have data (just fine-tune), or you need verifiable behavior guarantees (merging is unpredictable).

## Implementation Pattern: SLERP

```yaml
# slerp.yml
slices:
  - sources:
      - model: NousResearch/Hermes-3-Llama-3.1-8B
        layer_range: [0, 32]
      - model: meta-llama/Llama-3.1-8B-Instruct
        layer_range: [0, 32]
merge_method: slerp
base_model: meta-llama/Llama-3.1-8B-Instruct
parameters:
  t:
    - filter: self_attn
      value: [0, 0.5, 0.3, 0.7, 1]
    - filter: mlp
      value: [1, 0.5, 0.7, 0.3, 0]
    - value: 0.5
dtype: bfloat16
```

```bash
mergekit-yaml slerp.yml ./out/slerp-llama --cuda --lazy-unpickle
```

## Implementation Pattern: DARE-TIES

```yaml
# dare-ties.yml
models:
  - model: meta-llama/Llama-3.1-8B-Instruct
    # base, no parameters needed
  - model: NousResearch/Hermes-3-Llama-3.1-8B
    parameters:
      density: 0.5            # keep top 50% by magnitude
      weight: 0.5
  - model: cognitivecomputations/dolphin-2.9-llama3-8b
    parameters:
      density: 0.5
      weight: 0.3
  - model: meta-math/MetaMath-Llama-3-8B
    parameters:
      density: 0.5
      weight: 0.4
merge_method: dare_ties
base_model: meta-llama/Llama-3.1-8B-Instruct
parameters:
  int8_mask: true
dtype: bfloat16
```

## Implementation Pattern: Task Arithmetic

```yaml
# task-arithmetic.yml
models:
  - model: meta-llama/Llama-3.1-8B-Instruct
    parameters:
      weight: 1.0
  - model: meta-math/MetaMath-Llama-3-8B
    parameters:
      weight: 0.7              # add math task vector
  - model: codellama/CodeLlama-7b-Python   # subtract is allowed via negative weight
    parameters:
      weight: -0.3
merge_method: task_arithmetic
base_model: meta-llama/Llama-3.1-8B
dtype: bfloat16
```

## Implementation Pattern: MoE from Dense Models

```yaml
# moe.yml
base_model: meta-llama/Llama-3.1-8B-Instruct
gate_mode: hidden          # or "cheap_embed", "random"
dtype: bfloat16
experts:
  - source_model: NousResearch/Hermes-3-Llama-3.1-8B
    positive_prompts: ["assistant", "chat", "general"]
  - source_model: meta-math/MetaMath-Llama-3-8B
    positive_prompts: ["math", "calculate", "equation"]
  - source_model: WizardLMTeam/WizardCoder-Python-7B-V1.0
    positive_prompts: ["code", "function", "python"]
```

```bash
mergekit-moe moe.yml ./out/moe-llama --cuda
```

## Implementation Pattern: Frankenmerge (Layer Stitching)

```yaml
# franken.yml — duplicate-and-stitch a model to grow it
slices:
  - sources:
      - model: meta-llama/Llama-3.1-8B-Instruct
        layer_range: [0, 24]
  - sources:
      - model: meta-llama/Llama-3.1-8B-Instruct
        layer_range: [8, 32]
merge_method: passthrough
dtype: bfloat16
```

## Hyperparameter Guidance

- **SLERP `t` value**: 0.0 = pure model A, 1.0 = pure model B. Per-layer interpolation (attention vs MLP) often beats global `t`.
- **TIES `density`**: 0.3-0.7. Lower = more aggressive pruning, more divergence from base. 0.5 is a safe default.
- **DARE `density`**: 0.5-0.9. DARE is more forgiving than TIES because of magnitude preservation.
- **Number of merged models**: 2-8. Past 8, interference dominates and quality stalls.
- **Always set `base_model`** for TIES/DARE/Task Arithmetic — they need a reference to compute deltas.
- **`int8_mask: true`** for memory-tight merges; trades a tiny bit of precision for big RAM savings.
- **`--lazy-unpickle`** to avoid loading full models in RAM at once.
- For MoE merging: `gate_mode: hidden` uses positive_prompts to compute gate weights from hidden states; `cheap_embed` is faster but lower quality; `random` for ablations.

## Common Pitfalls

- **Mismatched architectures.** Merging Llama-3 with Llama-2 silently produces garbage (different RoPE, different layer sizes). MergeKit will error if shapes mismatch but won't catch architectural divergence.
- **Different chat templates.** The merged model has *one* template; constituent models may disagree. Decide which to keep.
- **Tokenizer drift.** Some derivatives extended vocab; merging requires the same tokenizer. Use `tokenizer:` block to project vocabularies if needed.
- **Eval contamination.** Merging models that saw eval data → high benchmarks, low real quality. The "open-LLM-leaderboard" merging arms race in 2024 made this a notorious issue.
- **Frankenmerge overlap.** Stitching layers from the same model can produce useful larger models (e.g., Goliath-120B from Llama-2-70Bx2), but more often produces incoherent output. Validate aggressively.
- **MoE without finetuning.** `mergekit-moe` builds the structure; usually you still need a brief SFT pass to align the router. Plain merge MoEs often underperform.
- **Forgetting `dtype`.** Default may be fp32; explicitly set `bfloat16` to halve disk size.
- **Merging RLHF'd + base + RLHF'd in DARE.** Sign disagreement on safety updates can produce a model less safe than any input.

## When to Use This Mode

Activate when the user wants to combine fine-tunes without training, builds an MoE from dense models, asks about MergeKit / SLERP / TIES / DARE / model soups, or wants to climb HF leaderboards via merging.

## Sources

- MergeKit GitHub: https://github.com/arcee-ai/mergekit
- "Model soups" paper (Wortsman et al. 2022): https://arxiv.org/abs/2203.05482
- TIES paper (Yadav et al. 2023): https://arxiv.org/abs/2306.01708
- DARE paper (Yu et al. 2023): https://arxiv.org/abs/2311.03099
- Task Arithmetic paper: https://arxiv.org/abs/2212.04089
- HF "Merge LLMs with mergekit" blog: https://huggingface.co/blog/mlabonne/merge-models

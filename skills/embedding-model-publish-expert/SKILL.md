---
name: embedding-model-publish-expert
description: Publish embedding models — sentence-transformers config, modules.json, 1_Pooling, MTEB submission, Matryoshka dims, embedding-specific model card
risk: unknown
source: community
kind: mode
category: model-authoring
tags: [model-authoring, embeddings, sentence-transformers, mteb, matryoshka, retrieval, publishing]
---

# Embedding Model Publish Expert Mode

You are an expert at publishing **embedding models** — the sentence-transformers stack, the canonical HF Hub layout (`modules.json`, `config_sentence_transformers.json`, `1_Pooling/`), MTEB leaderboard submission, and Matryoshka representation learning for variable-dim outputs.

## Core Concept

A sentence-transformers model is a **pipeline of modules** stored on disk as a directory. The pipeline is described in `modules.json`; each module is a subdirectory with its own config. The most common pipeline is `Transformer → Pooling → Normalize`, optionally with a `Dense` projection layer.

### Canonical directory layout

```
my-embedder/
  README.md
  config.json                          # base transformer config
  config_sentence_transformers.json    # ST version + similarity_fn_name + prompts
  modules.json                         # pipeline spec
  tokenizer.json
  tokenizer_config.json
  special_tokens_map.json
  model.safetensors
  sentence_bert_config.json            # max_seq_length, do_lower_case
  1_Pooling/
    config.json                        # pooling mode (mean/cls/max)
  2_Normalize/                         # optional L2 norm module
```

### `modules.json`

```json
[
  {"idx": 0, "name": "0", "path": "",          "type": "sentence_transformers.models.Transformer"},
  {"idx": 1, "name": "1", "path": "1_Pooling", "type": "sentence_transformers.models.Pooling"},
  {"idx": 2, "name": "2", "path": "2_Normalize","type": "sentence_transformers.models.Normalize"}
]
```

### `config_sentence_transformers.json`

```json
{
  "__version__": {
    "sentence_transformers": "3.4.0",
    "transformers": "4.46.0",
    "pytorch": "2.4.0"
  },
  "prompts": {
    "query":   "Represent this query for retrieval: ",
    "passage": ""
  },
  "default_prompt_name": null,
  "similarity_fn_name": "cosine"
}
```

`prompts` enables the asymmetric query/passage convention used by BGE / E5 / mxbai families.

### `1_Pooling/config.json`

```json
{
  "word_embedding_dimension": 768,
  "pooling_mode_cls_token":  false,
  "pooling_mode_mean_tokens": true,
  "pooling_mode_max_tokens": false,
  "pooling_mode_mean_sqrt_len_tokens": false
}
```

## Real Examples

### Train + save

```python
from sentence_transformers import SentenceTransformer, models, losses
from torch.utils.data import DataLoader

word_emb = models.Transformer("BAAI/bge-base-en-v1.5", max_seq_length=512)
pool     = models.Pooling(word_emb.get_word_embedding_dimension(), pooling_mode_mean_tokens=True)
norm     = models.Normalize()
model    = SentenceTransformer(modules=[word_emb, pool, norm])

train_loss = losses.MultipleNegativesRankingLoss(model)
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=3, warmup_steps=100, output_path="./my-embedder",
)
```

### Push to HF Hub

```python
model.push_to_hub(
    "yourname/my-embedder",
    train_datasets=["sentence-transformers/all-nli"],
)
```

### Matryoshka training (variable dim outputs)

```python
from sentence_transformers.losses import MatryoshkaLoss, MultipleNegativesRankingLoss

base_loss = MultipleNegativesRankingLoss(model)
loss = MatryoshkaLoss(model, base_loss, matryoshka_dims=[768, 512, 256, 128, 64])

model.fit([(train_dataloader, loss)], epochs=3, output_path="./my-matryoshka")
```

At inference, truncate embeddings:

```python
emb = model.encode("hello", truncate_dim=128)   # 128-dim Matryoshka slice
```

### Add asymmetric query / passage prompts

```python
model.prompts = {
    "query":   "Represent this query for retrieval: ",
    "passage": "",
}
model.save_pretrained("./my-embedder")
```

```python
q_emb = model.encode("how to bake bread", prompt_name="query")
p_emb = model.encode(documents,            prompt_name="passage")
```

### Required model card frontmatter

```markdown
---
license: apache-2.0
library_name: sentence-transformers
pipeline_tag: sentence-similarity
base_model: BAAI/bge-base-en-v1.5
language: en
tags:
  - sentence-transformers
  - sentence-similarity
  - feature-extraction
  - mteb
  - matryoshka
metrics:
  - spearmanr
  - cosine_accuracy
datasets:
  - sentence-transformers/all-nli
---

# My Embedder

768-dim (Matryoshka 768/512/256/128/64) sentence embedding model fine-tuned on
all-nli for asymmetric retrieval.

## Usage

```python
from sentence_transformers import SentenceTransformer
m = SentenceTransformer("yourname/my-embedder")
emb = m.encode(["hello world"])
```

## MTEB

| Task | Score |
|------|-------|
| BIOSSES | 84.5 |
| STS-B | 87.1 |
| ... |
```

### MTEB submission

```python
from mteb import MTEB
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("yourname/my-embedder")
evaluation = MTEB(tasks=["BIOSSES","STSBenchmark","NFCorpus","SciFact"])
results = evaluation.run(model, output_folder="results/my-embedder")
```

Results write to `results/my-embedder/<model-revision>/<task>.json`. Add `mteb` to your model's `tags` and the leaderboard scraper picks them up. Submit via the `mteb` GitHub repo's results PR.

### Use without sentence-transformers (transformers only)

```python
from transformers import AutoTokenizer, AutoModel
import torch.nn.functional as F

tok = AutoTokenizer.from_pretrained("yourname/my-embedder")
model = AutoModel.from_pretrained("yourname/my-embedder")
inp = tok(["hello"], return_tensors="pt", padding=True, truncation=True)
out = model(**inp)
# Mean pool
mask = inp["attention_mask"][..., None]
emb = (out.last_hidden_state * mask).sum(1) / mask.sum(1)
emb = F.normalize(emb, p=2, dim=1)
```

## Common Pitfalls

- **Missing `1_Pooling/`** — without it, `SentenceTransformer.from_pretrained` falls back to default pooling (CLS) which may not match training.
- **Wrong `pipeline_tag`** — `text-generation` or `feature-extraction` instead of `sentence-similarity` breaks the inference widget and search.
- **Library_name mismatch** — `transformers` instead of `sentence-transformers` hides the model in MTEB filters.
- **No prompts set** — BGE / E5 / mxbai families *require* "query: " / "passage: " prompts. Missing them silently halves retrieval quality.
- **Matryoshka without truncation** — training with Matryoshka but never `truncate_dim` at inference negates the benefit.
- **Saving only the base transformer** — calling `model.save_pretrained` from transformers (not sentence-transformers) loses the pooling and modules.json.
- **Wrong `similarity_fn_name`** — claiming `cosine` but the model wasn't trained with normalized outputs gives wrong rankings.
- **MTEB version drift** — submitting with old MTEB version produces obsolete scores. Pin a version.
- **Shipping `pytorch_model.bin` (pickle)** — modern publishes should be safetensors; convert with `safe_serialization=True`.

## Compatibility Notes

- Sentence-transformers v5+ supports text, images, audio, video, and combined modalities (CLIP-style).
- Compatible loaders: sentence-transformers, langchain `HuggingFaceEmbeddings`, llama-index `HuggingFaceEmbedding`, fastembed, infinity.
- For ONNX export: `sentence-transformers` ships `onnx_export.py`; results in `model.onnx` for fastembed / Triton.
- Quantized versions: int8 ONNX via `optimum.intel`, GGUF embedding via `llama.cpp`'s `--embedding` flag.
- MTEB leaderboard at `huggingface.co/spaces/mteb/leaderboard`; v2 introduced expanded multilingual coverage.

## When to Use This Mode

- Publishing a domain-specific embedding model (legal, biomedical, code).
- Adding a Matryoshka head to an existing embedding model.
- Cleaning up a sentence-transformers repo that lacks `modules.json` or asymmetric prompts.
- Submitting to MTEB.
- Migrating an embedding model to ONNX / GGUF for serving.

## Sources

- [Sentence Transformers docs](https://sbert.net/)
- [Sentence Transformers GitHub](https://github.com/huggingface/sentence-transformers)
- [Matryoshka Embeddings docs](https://sbert.net/examples/sentence_transformer/training/matryoshka/README.html)
- [Training a multimodal sentence transformer](https://huggingface.co/blog/train-multimodal-sentence-transformers)
- [MTEB GitHub repo](https://github.com/embeddings-benchmark/mteb)
- [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard)
- [BGE paper / repo](https://github.com/FlagOpen/FlagEmbedding)

---
name: multimodal-rag-expert
description: RAG over images+text — ColPali, DSE, jina-embeddings-v4, voyage-multimodal-3, PDF chunking. Use when building or optimizing retrieval-augmented generation pipelines with multimodal rag.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rag-advanced
  tags: [rag, multimodal, colpali, vision, pdf, jina-v4, voyage-multimodal]
---

# Multimodal RAG Expert Mode

You are an expert in multimodal RAG. The dirty secret of "PDF RAG" is that classical pipelines (OCR → chunk → embed) lose massive amounts of signal: tables collapse into garbled text, figures vanish, layout cues disappear, formulas turn into nonsense. Modern multimodal embedders ingest the *page image* directly, preserving everything humans see. This is the right architecture for visually-rich corpora in 2025-2026.

## Core Concept

Three families of multimodal RAG:

1. **Text-only after OCR** (legacy): Tesseract / Unstructured / Azure Document Intelligence → chunk → text embed. Cheap, well-tooled, lossy on visuals.
2. **Hybrid text+image**: extract text + extract figures, embed each in their modality, merge at retrieval. Captions for images.
3. **Vision-native**: render each page as an image, embed the image directly with a vision-language embedder. ColPali, DSE, jina-embeddings-v4, voyage-multimodal-3.

Within vision-native, two scoring modes:

- **Single-vector** (CLIP-style, jina-clip-v2 dense, voyage-multimodal-3): one vector per image, cosine search. Fast, smaller index.
- **Late-interaction multi-vector** (ColPali, jina-embeddings-v4 multi-vector mode): patch-level vectors per page, MaxSim scoring. Higher accuracy on visually rich pages, larger index.

## Model Landscape (2025-2026)

| Model | Modality | Architecture | Notes |
|------|----------|--------------|-------|
| **ColPali / ColQwen2 / ColSmolVLM** | Page image | Multi-vector late interaction (PaliGemma / Qwen2-VL / SmolVLM backbone) | Strong on visually rich PDFs; ViDoRe leader |
| **jina-embeddings-v4** | Text + image | Qwen2.5-VL-3B; supports single-vec AND multi-vec modes; 32K context | 84.11 ViDoRe single-vec, 90.17 multi-vec; open weights |
| **voyage-multimodal-3** | Text + image | Single-vector | API; competitive with ColPali on ViDoRe |
| **jina-clip-v2** | Text + image | CLIP-style dual encoder, multilingual | Good general-purpose |
| **nomic-embed-vision-v1.5** | Text + image | Open weights, lightweight | Good for cost-sensitive |
| **DSE (Document Screenshot Embedding)** | Page image | Single-vec (early baseline) | Faiss-friendly |

## When Vision-Native Helps

- **Visually rich PDFs**: financial reports, scientific papers with figures, technical manuals with diagrams, slide decks.
- **Tables and forms**: OCR mangles structure; image embedders preserve it.
- **Charts**: legend, axes, trendlines — gone in OCR, kept in vision.
- **Multi-language scanned docs**: image embedders sidestep OCR error compounding.
- **Schemas, architecture diagrams, UI screenshots, code-on-screen**.

## When It Hurts

- **Plain prose corpora**: pure text RAG is faster, cheaper, equally good.
- **Storage**: multi-vector page representations are 50-200KB each; 1M pages = 50-200GB.
- **Latency at index time**: rendering pages, vision-encoding each one is GPU-heavy.
- **Generation step**: you still need a VLM (GPT-4o, Claude Sonnet 4.5, Gemini 2.5) to actually *read* the retrieved page images. Token costs for image inputs are 5-20x text.
- **Filtering / metadata**: classic vector DB metadata filters work; full-text filters don't apply when you skipped OCR.

## Implementation Patterns

### ColPali via the colpali-engine library

```python
from colpali_engine.models import ColPali, ColPaliProcessor
from PIL import Image
import torch

model = ColPali.from_pretrained("vidore/colpali-v1.3", torch_dtype=torch.bfloat16, device_map="cuda")
proc = ColPaliProcessor.from_pretrained("vidore/colpali-v1.3")

# Index: page images -> multi-vector embeddings
page_imgs = [Image.open(p) for p in page_paths]
batch = proc.process_images(page_imgs).to(model.device)
with torch.no_grad():
    page_embs = model(**batch)  # (N_pages, N_patches, dim)

# Query: text -> multi-vector embedding
qbatch = proc.process_queries(["What was Q3 revenue?"]).to(model.device)
with torch.no_grad():
    q_emb = model(**qbatch)

# MaxSim scoring
scores = proc.score_multi_vector(q_emb, page_embs)  # (1, N_pages)
top = scores[0].topk(5).indices.tolist()
```

### jina-embeddings-v4 (single-vector mode, API)

```python
import requests
r = requests.post("https://api.jina.ai/v1/embeddings", json={
    "model": "jina-embeddings-v4",
    "task": "retrieval.passage",  # or retrieval.query
    "input": [{"image": "https://.../page1.png"}, {"text": "table of revenue"}]
}, headers={"Authorization": f"Bearer {JINA_KEY}"})
```

### Voyage multimodal-3

```python
import voyageai
vo = voyageai.Client()
docs_emb = vo.multimodal_embed(
    inputs=[[Image.open(p)] for p in page_paths],
    model="voyage-multimodal-3",
    input_type="document",
).embeddings
q_emb = vo.multimodal_embed(
    inputs=[["What was Q3 revenue?"]],
    model="voyage-multimodal-3",
    input_type="query",
).embeddings[0]
```

### PDF preprocessing for vision RAG

```python
import fitz  # PyMuPDF
doc = fitz.open("report.pdf")
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=200)  # 150-200 dpi sweet spot; >300 wastes tokens
    pix.save(f"page_{i:04d}.png")
```

### Late chunking for long PDFs (text path)

When you do extract text, prefer **late chunking** with a long-context embedder (jina-embeddings-v3/v4) over naive split-then-embed — preserves cross-chunk context. See the late-chunking-expert mode.

## Generation Step

Retrieved page images go to a VLM. With Anthropic / OpenAI / Google APIs:

```python
# Anthropic
client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64(p)}}
        for p in top_pages
    ] + [{"type": "text", "text": user_question}]}],
)
```

## Eval / Tuning

- **Use ViDoRe** for benchmarking — covers academic, industrial, infographic, table-heavy domains.
- **Build your own labeled set**: 50-200 (query, target_page) pairs from real users.
- **Compare vision-native vs OCR+text** on Recall@5. Vision usually wins on table/figure queries; OCR wins on speed and cost.
- **Index size budget**: estimate (pages × patches × dim × bytes_per_dim). ColPali on 100K pages ≈ 50GB+.
- **Generation cost**: image input tokens dwarf text. Cap top-k tightly (3-5 pages).
- **DPI tuning**: 150-200 dpi captures most signal; higher just bloats token usage.

## Common Pitfalls

- **Embedding low-resolution renders**: 72 dpi loses table text. 200 dpi is a good default.
- **Skipping page-aware chunking for long pages**: tall pages may exceed model context. Split long pages by region.
- **Forgetting to store page provenance**: you'll need (doc_id, page_number) for citations and re-renders.
- **Using a single-vector model on dense visuals**: late-interaction (ColPali / jina-v4 multi-vec) typically wins on tables and dense figures.
- **Treating multimodal as a drop-in for text RAG cost-wise**: do the index size and generation cost math up front.
- **Mixing modalities at retrieval without normalization**: align query/doc input types per the model's API.

## When to Use This Mode

Use vision-native multimodal RAG when:

- Corpus is ≥30% visually-rich (PDFs with tables/figures, slide decks, scanned docs).
- Your eval shows OCR errors are dragging accuracy.
- Budget supports the storage/compute uptick.

Stick with text RAG when:

- Corpus is flat prose (Markdown docs, transcripts).
- Cost is the dominant constraint.
- You can route only the visual queries to a separate index.

## Sources

- Faysse et al., "ColPali: Efficient Document Retrieval with Vision Language Models" — https://arxiv.org/abs/2407.01449
- ColPali model card — https://huggingface.co/vidore/colpali-v1.3
- ViDoRe benchmark — https://huggingface.co/spaces/vidore/vidore-leaderboard
- jina-embeddings-v4 paper — https://arxiv.org/abs/2506.18902
- Jina v4 announcement — https://jina.ai/news/jina-embeddings-v4-universal-embeddings-for-multimodal-multilingual-retrieval/
- Voyage multimodal-3 — https://docs.voyageai.com/docs/multimodal-embeddings
- DSE (Document Screenshot Embedding) — https://arxiv.org/abs/2406.11251
- colpali-engine library — https://github.com/illuin-tech/colpali

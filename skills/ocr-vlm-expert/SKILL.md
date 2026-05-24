---
name: ocr-vlm-expert
description: OCR with VLMs - Mistral OCR, Surya, GOT-OCR2.0 - and PDF parsing pipelines (Marker, Docling, Unstructured). Use when working with multimodal AI (images, audio, video) using ocr vlm.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: multimodal-ai
  tags: [multimodal, ocr, document, pdf, mistral-ocr, surya, marker, docling]
---

# OCR & Document VLM Expert Mode

You are an expert in modern document parsing and OCR. You pick between dedicated OCR models (Mistral OCR, Surya, GOT-OCR2), pipeline frameworks (Marker, Docling, Unstructured), and general VLMs (Qwen2.5-VL, Claude) per cost and quality, then ship LLM-ready Markdown/JSON.

## Core Capabilities

- Choose between OCR models, parsing pipelines, and VLMs by use case.
- PDF -> Markdown / JSON / DocTags conversion with structure preservation.
- Tables, equations, charts, and handwriting extraction.
- Layout analysis: reading order, header/figure/caption detection.
- Production scaling (batched VLM, on-prem OCR vs API).

## Stack Map

| Layer | Tool | Use |
|---|---|---|
| **API OCR** | Mistral OCR (`mistral-ocr-2505`) | Hosted, best quality on PDFs incl. handwriting + tables |
| **Open OCR model** | Surya (90+ langs), GOT-OCR2.0 (unified), Tesseract (legacy) | Self-host text extraction |
| **End-to-end pipeline** | Marker, Docling, Unstructured, MinerU | Orchestrate PDF -> structured output |
| **General VLM** | Qwen2.5-VL, Claude, GPT-4o | Flexible OCR + reasoning |
| **Layout-only** | LayoutLMv3, DocLayoutYOLO | Detect blocks before OCR |

## Implementation Patterns

### Mistral OCR API

```python
from mistralai import Mistral
client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

# Upload PDF
uploaded = client.files.upload(
    file={"file_name": "doc.pdf", "content": open("doc.pdf", "rb")},
    purpose="ocr",
)
signed_url = client.files.get_signed_url(file_id=uploaded.id).url

result = client.ocr.process(
    model="mistral-ocr-latest",
    document={"type": "document_url", "document_url": signed_url},
    include_image_base64=True,                       # extracts embedded images
)
for page in result.pages:
    print(page.markdown)                              # Markdown with images and tables
```

Mistral OCR ~ $1 per 1000 pages, leads on tables, equations, and handwriting (`mistral-ocr-2505` improvement).

### Surya (open, self-host)

```bash
pip install surya-ocr
surya_ocr docs/ --langs en --output_dir out/
surya_layout docs/ --output_dir layout/
surya_table docs/ --output_dir tables/
```

```python
from surya.ocr import run_ocr
from surya.model.detection.model import load_model as load_det
from surya.model.recognition.model import load_model as load_rec
from PIL import Image

det_model, det_proc = load_det(), None
rec_model, rec_proc = load_rec(), None
preds = run_ocr([Image.open("page.png")], [["en"]], det_model, det_proc, rec_model, rec_proc)
for line in preds[0].text_lines: print(line.text, line.bbox, line.confidence)
```

Surya: 90+ languages, line-level detection, layout, reading order, table recognition. Apache 2.0.

### GOT-OCR2.0 (unified model)

```python
from transformers import AutoModel, AutoTokenizer
tokenizer = AutoTokenizer.from_pretrained("ucaslcl/GOT-OCR2_0", trust_remote_code=True)
model = AutoModel.from_pretrained("ucaslcl/GOT-OCR2_0", trust_remote_code=True,
                                  low_cpu_mem_usage=True, device_map="cuda", use_safetensors=True).eval()
res = model.chat(tokenizer, "page.png", ocr_type="format")        # 'ocr' | 'format' | 'fine-grained'
print(res)
```

GOT-OCR2 is a 580M unified model that handles plain text, tables, charts, equations, sheet music, and molecular formulas in one pass.

### Marker (PDF -> Markdown, uses Surya)

```bash
pip install marker-pdf
marker_single doc.pdf --output_dir out/ --output_format markdown
marker /pdfs --workers 4 --max_pages 50
```

```python
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict

converter = PdfConverter(artifact_dict=create_model_dict())
rendered = converter("doc.pdf")
# rendered.markdown, rendered.images, rendered.metadata
```

Marker is fast, accurate, handles equations (LaTeX) and tables. Best end-to-end open pipeline as of 2025.

### Docling (IBM, structured representation)

```python
from docling.document_converter import DocumentConverter
converter = DocumentConverter()
result = converter.convert("doc.pdf")
print(result.document.export_to_markdown())          # also export_to_dict, export_to_doctags
```

Docling outputs **DocTags** - a structured tag format LLMs can reason over far better than raw markdown. Strong on technical PDFs.

### Unstructured (multi-format)

```python
from unstructured.partition.auto import partition
elements = partition(filename="doc.pdf", strategy="hi_res")
for el in elements:
    print(type(el).__name__, el.text[:80])
# strategy: "fast" (PDF text only), "hi_res" (layout + OCR), "ocr_only"
```

Unstructured handles 20+ formats (PDF, DOCX, PPTX, HTML, EML, etc.) with consistent element types (NarrativeText, Title, Table, Image, ListItem).

### VLM-based OCR (Qwen2.5-VL, Claude)

```python
# Qwen2.5-VL with explicit grounding prompt
prompt = """Extract every visible text element. Return JSON:
{"blocks": [{"text": "...", "bbox": [x1,y1,x2,y2], "kind": "title|paragraph|table_cell|caption"}]}"""
# Send page image + prompt - Qwen2.5-VL has native bbox grounding.
```

Use VLMs when you need *reasoning* about the page (summarize, classify, extract specific fields) rather than dumping all text.

## Pipeline Pattern (PDF -> RAG-ready chunks)

```python
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict

rendered = PdfConverter(artifact_dict=create_model_dict())("doc.pdf")
md = rendered.markdown

# Chunk with structure-aware splitter
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
hdr = MarkdownHeaderTextSplitter([("#", "h1"), ("##", "h2"), ("###", "h3")])
sections = hdr.split_text(md)
splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=150)
chunks = splitter.split_documents(sections)
```

## Hardware / Cost

| Tool | Throughput |
|---|---|
| Mistral OCR API | API; ~$1/1000 pages |
| Surya on RTX 4090 | ~10-30 pages/s (depends on doc) |
| GOT-OCR2 on RTX 4090 | ~3-5 pages/s |
| Marker on RTX 4090 | ~1-3 pages/s end-to-end |
| Qwen2.5-VL-7B | ~0.5-2 pages/s, expensive but flexible |

## Common Pitfalls

- Sending entire scanned PDFs to a VLM at low detail - misses small text.
- Using Tesseract on modern documents - WER far worse than Surya/Mistral.
- Marker default workers oversaturate VRAM - tune `--workers`.
- Treating tables as plain text loses semantics - prefer Marker / Docling that preserve table structure.
- Skipping layout detection on multi-column papers - reading order breaks.
- Not handling image-only pages (no text layer) - must enable hi_res / OCR strategy.

## When to Use

- Highest-quality, smallest effort -> Mistral OCR API.
- Self-host, open license, all-rounder -> Marker (Surya inside).
- Structured doc representation for downstream agents -> Docling DocTags.
- Mixed file formats in one pipeline -> Unstructured.
- Charts, equations, sheet music in one model -> GOT-OCR2.
- Page-level reasoning + extraction (not bulk OCR) -> Claude / Qwen2.5-VL.

## Sources

- https://mistral.ai/news/mistral-ocr
- https://docs.mistral.ai/studio-api/document-processing/basic_ocr
- https://github.com/VikParuchuri/surya
- https://github.com/VikParuchuri/marker
- https://github.com/DS4SD/docling
- https://github.com/Unstructured-IO/unstructured
- https://www.kdnuggets.com/10-awesome-ocr-models-for-2025

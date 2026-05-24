---
name: tokenizer-engineering-expert
description: Train tokenizers from scratch with HF tokenizers — BPE / SentencePiece / WordPiece — extend vocab for new languages or code, and add chat / special tokens. Use when creating, converting, or publishing model files with tokenizer engineering.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: model-authoring
  tags: [model-authoring, tokenizer, bpe, sentencepiece, wordpiece, vocab-extension, special-tokens]
---

# Tokenizer Engineering Expert Mode

You are an expert in tokenizer fundamentals and the Hugging Face `tokenizers` Rust-Python library. You train BPE / WordPiece / Unigram tokenizers from scratch, extend an existing Llama / Qwen / Gemma tokenizer with new-language or code vocab without breaking the embedding table, and register chat / tool / structural special tokens correctly.

## Core Concept

A tokenizer is a deterministic function `str → List[int]`. Modern LLMs use one of three subword algorithms:

| Algorithm | Used by | Merge rule |
|-----------|---------|-----------|
| **BPE** (Byte-Pair Encoding) | GPT-2/3/4, Llama 1/2/3, Mistral, Qwen | Greedily merge most-frequent adjacent pair |
| **WordPiece** | BERT, DistilBERT | Merge pair that maximises likelihood lift |
| **Unigram** | T5, ALBERT, mT5 | Start large, prune by EM toward target size |
| **SentencePiece** (wrapper) | Llama 1/2 (BPE-mode), Gemma, T5 (Unigram) | Treats space as a regular char (`▁`), runs BPE or Unigram on the byte stream |

Llama 3 / Qwen 3 use a tiktoken-style **byte-level BPE** with a much bigger vocab (128k for Llama 3, 152k for Qwen 2.5). Their merges are baked into `tokenizer.json` (HF fast-tokenizer file) — not a `tokenizer.model` SentencePiece blob.

## Real Examples

### Train a BPE tokenizer from scratch

```python
from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders

tokenizer = Tokenizer(models.BPE(unk_token="[UNK]"))
tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)
tokenizer.decoder = decoders.ByteLevel()

trainer = trainers.BpeTrainer(
    vocab_size=32000,
    min_frequency=2,
    special_tokens=["[UNK]", "<s>", "</s>", "<pad>",
                    "<|im_start|>", "<|im_end|>"],
    initial_alphabet=pre_tokenizers.ByteLevel.alphabet(),
)
tokenizer.train(["corpus.txt"], trainer)
tokenizer.save("tokenizer.json")
```

### Train a SentencePiece-style Unigram (T5-like)

```python
from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders, normalizers

tokenizer = Tokenizer(models.Unigram())
tokenizer.normalizer = normalizers.NFKC()
tokenizer.pre_tokenizer = pre_tokenizers.Metaspace(replacement="▁")
tokenizer.decoder = decoders.Metaspace()

trainer = trainers.UnigramTrainer(
    vocab_size=32000, special_tokens=["<unk>", "<s>", "</s>"], unk_token="<unk>",
)
tokenizer.train(["corpus.txt"], trainer)
```

### Extend an existing Llama tokenizer with new vocab (e.g., domain code)

```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tok = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3.1-8B")
print(len(tok))  # 128256

new = ["<my_python_func>", "<my_react_hook>", "useReducer", "qiskit"]
added = tok.add_tokens(new)        # returns count actually added
print(added, len(tok))             # 4, 128260

# Resize embedding to match
model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3.1-8B")
model.resize_token_embeddings(len(tok))
# New rows are randomly initialized — fine-tune before serving.
```

### Add new special tokens (chat / structural)

```python
tok.add_special_tokens({
    "additional_special_tokens": ["<|tool_call|>", "<|observation|>"]
})
model.resize_token_embeddings(len(tok))
# Optionally make pad explicit
tok.add_special_tokens({"pad_token": "<|pad|>"})
```

### Extend vocab for a new language (Hindi on Llama 3)

```python
# 1. Train a small BPE on the new-language corpus only
from tokenizers import Tokenizer, models, trainers, pre_tokenizers
hindi = Tokenizer(models.BPE())
hindi.pre_tokenizer = pre_tokenizers.ByteLevel()
hindi.train(["hindi_corpus.txt"],
            trainers.BpeTrainer(vocab_size=8000,
                                initial_alphabet=pre_tokenizers.ByteLevel.alphabet()))

# 2. Merge into the base tokenizer's vocab (kept tokens only)
new_pieces = [p for p in hindi.get_vocab() if p not in tok.get_vocab()]
tok.add_tokens(new_pieces)

# 3. Resize embeddings, then continued-pretrain on bilingual corpus
model.resize_token_embeddings(len(tok))
```

Skip-step: many practitioners use a **mean-init** (average of subword embeddings of the new piece's subword decomposition under the old tokenizer) instead of random — converges much faster.

### Save and round-trip

```python
tok.save_pretrained("./my-tok")
# Reload
tok2 = AutoTokenizer.from_pretrained("./my-tok")
assert tok2.encode("test <|tool_call|> stuff") == tok.encode("test <|tool_call|> stuff")
```

## Common Pitfalls

- **Forgetting `resize_token_embeddings`** — adding tokens without resizing crashes at first forward pass with `IndexError`.
- **Random embedding init** — new tokens with random rows give garbage at inference. Always either (a) fine-tune on data containing them, or (b) mean-init from subword decomposition.
- **Adding a special token but not in `special_tokens_map.json`** — `add_tokens` puts it in vocab but not in special-tokens map, so it can be split during pre-tokenization. Use `add_special_tokens` for chat/control tokens.
- **Conflicting `unk_token`** — if your trainer uses `[UNK]` but the model config expects `<unk>`, the model never sees real UNK behavior.
- **ByteLevel vs Metaspace mismatch** — Llama 3 is ByteLevel BPE. Training a Metaspace tokenizer and saving it as Llama-compatible breaks decode (you get `▁` everywhere).
- **Vocab size not a multiple of 64** — many GPU kernels assume `vocab_size % 64 == 0`. Round up and pad with reserved tokens.
- **Tying issue after resize** — if `tie_word_embeddings=True`, only call resize once; calling on both `embed_tokens` and `lm_head` doubles up.
- **Saving as `tokenizer.model`** — HF fast tokenizers save `tokenizer.json`, not the legacy SP file. llama.cpp converters need `tokenizer.json` for byte-level BPE models; the legacy SP path is only for true SentencePiece models.

## Compatibility Notes

- `tokenizers` is the Rust lib; `transformers` wraps it as `PreTrainedTokenizerFast`.
- llama.cpp's `convert_hf_to_gguf.py` reads `tokenizer.json` directly and embeds it in GGUF metadata as `tokenizer.ggml.tokens`, `merges`, `pre`.
- Ollama, vLLM, TGI, SGLang all consume HF `tokenizer.json`.
- SentencePiece `tokenizer.model` files convert with `--vocab-type spm` flag in older converters.
- Llama 3 vocab (128256) leaves 256 reserved tokens for fine-tuning extensions — use those before adding new IDs.

## When to Use This Mode

- Adding a domain vocabulary (medical, legal, code) to a base model before fine-tune.
- Authoring a tokenizer for a from-scratch pretrain run.
- Extending a multilingual model into a new language.
- Adding tool / function / structural control tokens.
- Debugging tokenization mismatches between HF and llama.cpp.

## Sources

- [Hugging Face tokenizers docs](https://huggingface.co/docs/tokenizers)
- [HF Tokenizer summary (algorithms)](https://huggingface.co/docs/transformers/en/tokenizer_summary)
- [HF LLM Course chapter 6 (build a tokenizer)](https://huggingface.co/learn/llm-course/chapter6/8)
- [tokenizers GitHub repo](https://github.com/huggingface/tokenizers)
- [Llama 3 tokenizer docs](https://huggingface.co/docs/transformers/en/model_doc/llama3)
- [Tokenization in Transformers v5 blog](https://huggingface.co/blog/tokenizers)

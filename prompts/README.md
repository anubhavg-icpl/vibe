# Prompts

Collection of 99 ready-made prompt templates pulled from the `ai-engineering-from-scratch` curriculum, organized by phase.

Each prompt is a self-contained Markdown file with YAML frontmatter (`name`, `description`, `phase`, `lesson`) followed by the prompt body.

## Index

### Phase 00 - Setup And Tooling

- [`prompt-api-troubleshooter.md`](./prompt-api-troubleshooter.md) - Diagnose and fix common AI API errors (auth, rate limits, timeouts)
- [`prompt-data-helper.md`](./prompt-data-helper.md) - Find and load the right dataset for an AI/ML task
- [`prompt-debug-ai-code.md`](./prompt-debug-ai-code.md) - Diagnose AI-specific bugs including NaN loss, shape errors, training failures, and OOM
- [`prompt-env-check.md`](./prompt-env-check.md) - Diagnose and fix AI engineering environment setup issues
- [`prompt-notebook-helper.md`](./prompt-notebook-helper.md) - Debug Jupyter notebook issues including kernel crashes, memory problems, and display failures

### Phase 01 - Math Foundations

- [`prompt-bayesian-reasoning.md`](./prompt-bayesian-reasoning.md) - Walk through Bayesian reasoning step by step for any scenario
- [`prompt-distance-chooser.md`](./prompt-distance-chooser.md) - Guides the user through choosing the right distance metric for their specific task
- [`prompt-linear-algebra-tutor.md`](./prompt-linear-algebra-tutor.md) - Teach linear algebra through geometric intuition and AI applications
- [`prompt-linear-solver.md`](./prompt-linear-solver.md) - Recommend the right algorithm for solving a linear system Ax=b based on matrix properties
- [`prompt-matrix-operations.md`](./prompt-matrix-operations.md) - Teaches matrix operations through geometric intuition, connecting abstract math to neural network mechanics
- [`prompt-numerical-debugger.md`](./prompt-numerical-debugger.md) - Diagnoses NaN, Inf, and numerical stability issues in neural network training
- [`prompt-optimizer-guide.md`](./prompt-optimizer-guide.md) - Guides the user through choosing the right optimizer for their specific machine learning problem
- [`prompt-spectral-analyzer.md`](./prompt-spectral-analyzer.md) - Guides analysis of frequency content in signals using Fourier transform techniques
- [`prompt-stochastic-process-advisor.md`](./prompt-stochastic-process-advisor.md) - Identify which stochastic process framework applies to a given problem and recommend implementation
- [`prompt-tensor-debugger.md`](./prompt-tensor-debugger.md) - Step-by-step debugging prompt for tensor shape errors in deep learning code
- [`prompt-tensor-shapes.md`](./prompt-tensor-shapes.md) - Debug tensor shape mismatches and recommend fixes for common deep learning operations
- [`prompt-transformation-visualizer.md`](./prompt-transformation-visualizer.md) - Explain what a matrix transformation does geometrically given its entries

### Phase 02 - Ml Fundamentals

- [`prompt-distance-metric-advisor.md`](./prompt-distance-metric-advisor.md) - Recommend the right distance metric based on data type and problem characteristics
- [`prompt-ensemble-selector.md`](./prompt-ensemble-selector.md) - Pick the right ensemble method for a given dataset and problem
- [`prompt-feature-engineer.md`](./prompt-feature-engineer.md) - Systematic prompt for engineering features from raw tabular data
- [`prompt-ml-pipeline.md`](./prompt-ml-pipeline.md) - Build, debug, and deploy reproducible ML pipelines
- [`prompt-ml-problem-framer.md`](./prompt-ml-problem-framer.md) - Frame a real-world business problem as a machine learning task
- [`prompt-model-diagnostics.md`](./prompt-model-diagnostics.md) - Diagnose model performance issues using train/test metrics and learning curves
- [`prompt-time-series-advisor.md`](./prompt-time-series-advisor.md) - Frame time series problems and recommend approaches
- [`prompt-tree-interpreter.md`](./prompt-tree-interpreter.md) - Interpret decision tree results and diagnose potential issues
- [`prompt-tuning-strategy.md`](./prompt-tuning-strategy.md) - Recommend a hyperparameter tuning strategy based on model type, data size, and compute budget

### Phase 03 - Deep Learning Core

- [`prompt-activation-selector.md`](./prompt-activation-selector.md) - A decision prompt for choosing the right activation function for any neural network architecture
- [`prompt-framework-architect.md`](./prompt-framework-architect.md) - Design neural network architectures using framework abstractions -- modules, containers, losses, and optimizers
- [`prompt-gradient-debugger.md`](./prompt-gradient-debugger.md) - Diagnose and fix gradient problems in neural networks -- vanishing gradients, exploding gradients, and NaN values
- [`prompt-init-strategy.md`](./prompt-init-strategy.md) - Diagnose weight initialization problems and recommend the right strategy for any neural network architecture
- [`prompt-jax-optimizer.md`](./prompt-jax-optimizer.md) - Choose and configure the right JAX/Optax optimizer for a given training scenario
- [`prompt-loss-debugger.md`](./prompt-loss-debugger.md) - A diagnostic prompt for debugging loss curves and training failures
- [`prompt-loss-function-selector.md`](./prompt-loss-function-selector.md) - A decision prompt for choosing the right loss function for any ML task
- [`prompt-lr-schedule-advisor.md`](./prompt-lr-schedule-advisor.md) - Recommend the right learning rate schedule and hyperparameters for any training setup
- [`prompt-network-architect.md`](./prompt-network-architect.md) - Guides the user through designing neural network architectures by choosing layer counts, neuron counts, and activation functions for a given problem
- [`prompt-nn-debugger.md`](./prompt-nn-debugger.md) - Diagnose neural network training failures from symptoms -- loss curves, gradient stats, and activation patterns
- [`prompt-optimizer-selector.md`](./prompt-optimizer-selector.md) - A decision prompt for choosing the right optimizer and learning rate for any architecture
- [`prompt-pytorch-debugger.md`](./prompt-pytorch-debugger.md) - Diagnose and fix common PyTorch training failures from symptoms
- [`prompt-regularization-advisor.md`](./prompt-regularization-advisor.md) - A diagnostic prompt for choosing regularization strategies based on overfitting symptoms

### Phase 04 - Computer Vision

- [`prompt-3d-task-router.md`](./prompt-3d-task-router.md) - Route to the right 3D representation (point cloud, mesh, voxel, NeRF, Gaussian splat) based on task and input
- [`prompt-3dgs-capture-planner.md`](./prompt-3dgs-capture-planner.md) - Plan a photo capture session for 3DGS reconstruction given scene type and hardware
- [`prompt-backbone-selector.md`](./prompt-backbone-selector.md) - Pick the right vision backbone (LeNet, VGG, ResNet, MobileNet, EfficientNet-Lite, ConvNeXt, ViT) for a given task, dataset size, and compute budget
- [`prompt-classifier-pipeline-auditor.md`](./prompt-classifier-pipeline-auditor.md) - Audit a PyTorch image classification training script for the five invariants that cover most silent bugs
- [`prompt-cnn-architect.md`](./prompt-cnn-architect.md) - Design a stack of Conv2d layers from input size, parameter budget, and target receptive field
- [`prompt-depth-model-picker.md`](./prompt-depth-model-picker.md) - Pick Depth Anything V3 / Marigold / UniDepth / MiDaS given latency, metric-vs-relative need, and scene type
- [`prompt-detection-metric-reader.md`](./prompt-detection-metric-reader.md) - Turn a precision/recall/AP/mAP row into a one-line diagnosis and the single most useful next experiment
- [`prompt-diffusion-sampler-picker.md`](./prompt-diffusion-sampler-picker.md) - Pick DDPM, DDIM, DPM-Solver++, or Euler ancestral based on quality target, latency budget, and conditioning type
- [`prompt-dit-model-picker.md`](./prompt-dit-model-picker.md) - Pick between SD3, SD3.5, FLUX.1-dev, FLUX.1-schnell, Z-Image, SD4 Turbo given quality, latency, and license
- [`prompt-edge-deployment-planner.md`](./prompt-edge-deployment-planner.md) - Pick backbone, quantisation strategy, and runtime given target device and latency SLA
- [`prompt-fine-tune-planner.md`](./prompt-fine-tune-planner.md) - Pick feature extraction vs progressive vs end-to-end fine-tuning given dataset size, domain distance, and compute budget
- [`prompt-gan-training-triage.md`](./prompt-gan-training-triage.md) - Read a description of GAN training curves and pick the failure mode plus the single recommended fix
- [`prompt-instance-vs-semantic-router.md`](./prompt-instance-vs-semantic-router.md) - Ask three questions and pick instance vs semantic vs panoptic segmentation plus the first model
- [`prompt-ocr-stack-picker.md`](./prompt-ocr-stack-picker.md) - Pick Tesseract / PaddleOCR / Donut / VLM-OCR given document type, language, and structure
- [`prompt-open-vocab-stack-picker.md`](./prompt-open-vocab-stack-picker.md) - Pick SAM 3 / Grounded SAM 2 / YOLO-World / SAM-MI based on latency, concept complexity, and licensing
- [`prompt-pose-stack-picker.md`](./prompt-pose-stack-picker.md) - Pick MediaPipe / YOLOv8-pose / HRNet / ViTPose given latency, crowd size, and 2D vs 3D need
- [`prompt-retrieval-loss-picker.md`](./prompt-retrieval-loss-picker.md) - Pick triplet / InfoNCE / ProxyNCA for a given retrieval problem
- [`prompt-sd-pipeline-planner.md`](./prompt-sd-pipeline-planner.md) - Pick SD 1.5 / SDXL / SD3 / FLUX plus scheduler and precision given a latency budget, fidelity target, and licensing constraint
- [`prompt-segmentation-task-picker.md`](./prompt-segmentation-task-picker.md) - Pick semantic vs instance vs panoptic segmentation and name the architecture for a given task
- [`prompt-ssl-pretraining-picker.md`](./prompt-ssl-pretraining-picker.md) - Pick SimCLR / MAE / DINOv2 given dataset size, compute, and downstream task
- [`prompt-tracker-picker.md`](./prompt-tracker-picker.md) - Pick SORT / ByteTrack / BoT-SORT / SAM 2 / SAM 3.1 given scene type, occlusion patterns, and latency budget
- [`prompt-video-architecture-picker.md`](./prompt-video-architecture-picker.md) - Pick 2D+pool / I3D / (2+1)D / spatio-temporal transformer based on appearance-vs-motion, dataset size, and compute budget
- [`prompt-video-model-picker.md`](./prompt-video-model-picker.md) - Pick Sora 2 / Runway Gen-5 / Wan-Video / HunyuanVideo / Cosmos for a given task, license, and latency target
- [`prompt-vision-preprocessing-audit.md`](./prompt-vision-preprocessing-audit.md) - Turn any model card or dataset card into a checklist of the preprocessing invariants a vision pipeline must honour
- [`prompt-vision-service-shape-reviewer.md`](./prompt-vision-service-shape-reviewer.md) - Review a vision service's code for contract/response shape violations and name the first breaking bug
- [`prompt-vit-vs-cnn-picker.md`](./prompt-vit-vs-cnn-picker.md) - Pick between ViT, ConvNeXt, or Swin based on dataset size, compute, and inference stack
- [`prompt-vlm-selector.md`](./prompt-vlm-selector.md) - Pick Qwen3-VL / InternVL3.5 / LLaVA-Next / API given accuracy, latency, context length, and budget
- [`prompt-zero-shot-class-picker.md`](./prompt-zero-shot-class-picker.md) - Design prompt templates for zero-shot CLIP given a list of classes and a domain

### Phase 05 - Nlp Foundations To Advanced

- [`prompt-attention-shapes.md`](./prompt-attention-shapes.md) - Debug shape bugs in attention implementations.
- [`prompt-lm-baseline.md`](./prompt-lm-baseline.md) - Build a reproducible n-gram language model baseline before training a neural LM.
- [`prompt-preprocessing-advisor.md`](./prompt-preprocessing-advisor.md) - Recommends a tokenization, stemming, and lemmatization setup for an NLP task.
- [`prompt-sentiment-baseline.md`](./prompt-sentiment-baseline.md) - Design a sentiment analysis baseline for a new dataset.
- [`prompt-seq2seq-design.md`](./prompt-seq2seq-design.md) - Design a sequence-to-sequence pipeline for a given task.
- [`prompt-text-encoder-picker.md`](./prompt-text-encoder-picker.md) - Pick a text encoder architecture for a given constraint set.
- [`prompt-vectorization-picker.md`](./prompt-vectorization-picker.md) - Given a text-classification task, recommend BoW, TF-IDF, embeddings, or a hybrid.

### Phase 07 - Transformers Deep Dive

- [`prompt-attention-explainer.md`](./prompt-attention-explainer.md) - Explain the attention mechanism through the database lookup analogy

### Phase 10 - Llms From Scratch

- [`prompt-alignment-method-selector.md`](./prompt-alignment-method-selector.md) - Choose the right alignment method (SFT, RLHF, DPO, KTO, ORPO, SimPO) for your use case
- [`prompt-data-quality-checker.md`](./prompt-data-quality-checker.md) - Validate and debug data quality in LLM pre-training pipelines
- [`prompt-distributed-training-planner.md`](./prompt-distributed-training-planner.md) - Plan a distributed training run given model size and available hardware
- [`prompt-eval-designer.md`](./prompt-eval-designer.md) - Design a custom evaluation suite for any LLM task, including test cases, scoring functions, and pass/fail thresholds
- [`prompt-gpt-architecture-analyzer.md`](./prompt-gpt-architecture-analyzer.md) - Analyze architecture choices in any GPT-style transformer model
- [`prompt-reward-model-designer.md`](./prompt-reward-model-designer.md) - Design reward model training pipelines for RLHF alignment
- [`prompt-sft-data-curator.md`](./prompt-sft-data-curator.md) - Design and curate instruction datasets for supervised fine-tuning
- [`prompt-tokenizer-analyzer.md`](./prompt-tokenizer-analyzer.md) - Analyze tokenization efficiency for a given text across different models and tokenizer types
- [`prompt-tokenizer-builder.md`](./prompt-tokenizer-builder.md) - Build and debug production-quality tokenizers for LLM projects

### Phase 11 - Llm Engineering

- [`p11-prompt-eval-designer.md`](./p11-prompt-eval-designer.md) - Design tailored evaluation rubrics and test suites for LLM applications from a description of the use case
- [`prompt-advanced-rag-debugger.md`](./prompt-advanced-rag-debugger.md) - Diagnose and fix RAG quality issues across retrieval, generation, and evaluation
- [`prompt-architecture-reviewer.md`](./prompt-architecture-reviewer.md) - Review the architecture of any LLM application against a production readiness checklist -- identifies gaps, risks, and missing components
- [`prompt-context-optimizer.md`](./prompt-context-optimizer.md) - Audit a context assembly strategy and recommend optimizations to reduce token waste and improve response quality
- [`prompt-cost-optimizer.md`](./prompt-cost-optimizer.md) - Analyze an LLM application and recommend specific cost optimizations with projected savings
- [`prompt-embedding-advisor.md`](./prompt-embedding-advisor.md) - Choose embedding models, dimensions, and strategies for specific use cases
- [`prompt-lora-advisor.md`](./prompt-lora-advisor.md) - Decide LoRA rank, target modules, and hyperparameters for a specific fine-tuning task
- [`prompt-prompt-optimizer.md`](./prompt-prompt-optimizer.md) - Takes a draft prompt and rewrites it using proven prompt engineering patterns for maximum effectiveness across models
- [`prompt-rag-architect.md`](./prompt-rag-architect.md) - Design RAG systems for specific use cases with concrete architecture decisions
- [`prompt-reasoning-chain.md`](./prompt-reasoning-chain.md) - Production-ready few-shot CoT prompt with self-consistency support for multi-step reasoning tasks
- [`prompt-safety-auditor.md`](./prompt-safety-auditor.md) - Audit any LLM application for safety vulnerabilities -- prompt injection, data leakage, jailbreaks, and output risks
- [`prompt-structured-extractor.md`](./prompt-structured-extractor.md) - Extract structured data from unstructured text given a JSON Schema definition
- [`prompt-tool-designer.md`](./prompt-tool-designer.md) - Design complete tool definitions (JSON Schema) for function calling from a natural language description

### Phase 16 - Multi Agent And Swarms

- [`prompt-multi-agent-decision.md`](./prompt-multi-agent-decision.md) - Decide whether a task needs a multi-agent system or a single agent
- [`prompt-protocol-selector.md`](./prompt-protocol-selector.md) - Helps choose the right agent communication protocol (MCP, A2A, ACP, ANP) based on system requirements


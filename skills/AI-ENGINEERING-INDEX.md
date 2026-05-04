# AI Engineering From Scratch — Skills Index

Total added skills: 361

Skills imported from `ai-engineering-from-scratch`, grouped by phase.

## Phase 1

- **L4 · skill-gradient-computation** — Compute gradients of common ML loss functions and choose the right derivative approach
- **L5 · skill-autodiff** — Build, debug, and reason about automatic differentiation systems
- **L6 · skill-probability-reasoning** — Choose the right probability distribution for a given ML problem
- **L9 · skill-information-theory** — Apply information theory concepts to ML loss functions, model evaluation, and feature selection
- **L10 · skill-dimensionality-reduction** — Choose the right dimensionality reduction technique for a given task based on data size, goal, and downstream use
- **L11 · skill-svd** — Apply SVD to real problems including compression, denoising, recommendations, and least-squares solving
- **L15 · skill-statistical-testing** — Choose the right statistical test for comparing ML models and evaluating experiments
- **L16 · skill-sampling-strategy** — Choose the right sampling method for generation, estimation, or inference
- **L18 · skill-convexity-checker** — Determine if an optimization problem is convex and choose the right solver
- **L19 · skill-complex-arithmetic** — Quick reference for complex number operations in ML and signal processing contexts
- **L21 · skill-graph-analysis** — Analyze graph-structured data and choose the right graph algorithm for ML tasks

## Phase 2

- **L2 · skill-regression** — Choose the right regression approach based on data characteristics and problem constraints
- **L3 · skill-classification-baseline** — Establish a strong classification baseline before reaching for complex models
- **L5 · skill-svm-kernel-chooser** — Choose the right SVM kernel and tune C and gamma for your problem
- **L7 · skill-clustering-guide** — Choose the right clustering algorithm based on data shape, noise, and constraints
- **L9 · skill-evaluation** — Evaluation strategy checklist for classification and regression models
- **L11 · skill-ensemble-builder** — Choose the right ensemble method and configure it for your problem
- **L14 · skill-naive-bayes-chooser** — Choose the right Naive Bayes variant for your classification task
- **L16 · skill-anomaly-detector** — Choose the right anomaly detection approach for your problem
- **L17 · skill-imbalanced-data** — Decision checklist for handling imbalanced classification problems
- **L18 · skill-feature-selector** — Quick reference decision tree for choosing the right feature selection method

## Phase 3

- **L1 · skill-perceptron** — Understand the perceptron pattern and when to use single-layer vs multi-layer architectures
- **L12 · skill-jax-patterns** — Functional programming patterns in JAX -- when and how to use grad, jit, vmap, and pmap
- **L13 · skill-debug-checklist** — Decision-tree checklist for debugging neural network training failures

## Phase 03

- **L11 · skill-pytorch-patterns** — Reference patterns for PyTorch training, evaluation, and deployment

## Phase 4

- **L1 · skill-image-tensor-inspector** — Inspect any image-shaped tensor or array and report dtype, layout, range, and whether it looks raw, normalized, or standardized
- **L2 · skill-conv-shape-calculator** — Walk a CNN spec layer by layer and report output shape, receptive field, and parameter count for every block
- **L3 · skill-residual-block-reviewer** — Review a PyTorch residual block for skip-connection correctness, BN placement, activation order, and shape alignment
- **L4 · skill-classification-diagnostics** — Given a confusion matrix and class names, surface per-class failures and propose the single most impactful fix
- **L5 · skill-freeze-inspector** — Report which parameters are trainable, which BatchNorm layers are in eval mode, and whether the optimizer is actually consuming the trainable parameters
- **L6 · skill-anchor-designer** — Given a dataset of ground-truth boxes, run k-means on (w, h) and return anchor sets per FPN level plus coverage statistics
- **L7 · skill-segmentation-mask-inspector** — Report class distribution, predicted-mask statistics, and the classes most likely to be under-predicted or boundary-blurred
- **L8 · skill-mask-rcnn-head-swapper** — Generate the exact code for swapping box and mask heads on a torchvision Mask R-CNN for a custom num_classes
- **L9 · skill-dcgan-scaffold** — Write a complete DCGAN scaffold from z_dim, image_size, and num_channels, including training loop and sample saver
- **L10 · skill-noise-schedule-designer** — Produce a linear, cosine, or sigmoid beta schedule given T and target corruption level, plus SNR plot
- **L11 · skill-lora-training-setup** — Write a full LoRA training config for a custom dataset, including captions, rank, batch size, and learning rate
- **L12 · skill-frame-sampler-auditor** — Audit a video pipeline's frame sampler for off-by-one, short-clip handling, and crop consistency
- **L13 · skill-point-cloud-loader** — Write a PyTorch Dataset for .ply / .pcd / .xyz files with correct normalisation, centring, and point sampling
- **L14 · skill-vit-patch-and-pos-embed-inspector** — Verify a ViT's patch embedding and positional embedding shapes match the model's expected sequence length
- **L15 · skill-latency-profiler** — Write a complete latency-benchmarking script with warmup, synchronisation, percentiles, and memory tracking
- **L16 · skill-pipeline-budget-planner** — Given target latency and throughput, assign a time budget to every pipeline stage and flag which stage will miss its budget first
- **L17 · skill-linear-probe-runner** — Write the complete linear-probe evaluation for any frozen encoder and labelled dataset
- **L18 · skill-image-text-retriever** — Build an image embedding index with any CLIP checkpoint; support query-by-text and query-by-image
- **L19 · skill-ctc-decoder** — Write greedy and beam-search CTC decoders from scratch, including length normalisation
- **L20 · skill-recall-at-k-runner** — Write a clean evaluation harness for recall@K with train/val/gallery splits and proper data contract
- **L21 · skill-heatmap-to-coords** — Write the sub-pixel heatmap-to-coordinate routine used by every production pose model
- **L22 · skill-3dgs-export-router** — Pick the right 3DGS export format (.ply / .splat / glTF KHR_gaussian_splatting / USD) given the downstream viewer or engine
- **L23 · skill-rectified-flow-trainer** — Write a complete rectified-flow training loop with AdaLN DiT and Euler sampling
- **L24 · skill-concept-prompt-designer** — Turn user utterances into well-formed SAM 3 concept prompts with splitting, disambiguation, and fallbacks
- **L25 · skill-cmer-monitor** — Instrument a production VLM endpoint with Cross-Modal Error Rate monitoring, dashboards, and alerts
- **L26 · skill-depth-to-pointcloud** — Build point clouds from depth maps with correct intrinsics handling and export to .ply
- **L27 · skill-mot-evaluator** — Write a complete evaluation harness for MOTA / IDF1 / HOTA against ground-truth tracks
- **L28 · skill-physical-plausibility-checks** — Automated checks for object permanence, gravity, and continuity on any generated video before shipping

## Phase 5

- **L03 · embedding-probe** — Inspect a word2vec model. Run analogies, find neighbors, diagnose quality.
- **L04 · tokenizer-picker** — Pick a tokenization approach for a new language model or text pipeline.
- **L06 · ner-picker** — Pick the right NER approach for a given extraction task.
- **L07 · grammar-pipeline** — Design a classical POS + dependency pipeline for a downstream NLP task.
- **L11 · mt-evaluator** — Evaluate a machine translation output for shipping.
- **L12 · summary-picker** — Pick extractive or abstractive, name the library, add a factuality check.
- **L13 · qa-architect** — Choose QA architecture, retrieval strategy, and evaluation plan.
- **L14 · retrieval-picker** — Pick a retrieval stack for a given corpus and query pattern.
- **L15 · topic-picker** — Pick LDA or BERTopic for a corpus. Specify library, knobs, evaluation.
- **L17 · chatbot-architect** — Design a chatbot stack for a given use case.
- **L18 · multilingual-picker** — Pick source language, target model, and evaluation plan for a multilingual NLP task.
- **L19 · p5-tokenizer-picker** — Pick tokenizer algorithm, vocab size, library for a given corpus and deployment target.
- **L20 · structured-output-picker** — Choose a structured output approach, schema design, and validation plan.
- **L21 · nli-picker** — Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
- **L22 · embedding-picker** — Pick embedding model, dimension, and retrieval mode for a given corpus and deployment.
- **L23 · chunker** — Pick a chunking strategy, size, and overlap for a given corpus and query distribution.
- **L24 · coref-picker** — Pick a coreference approach, evaluation plan, and integration strategy.
- **L25 · entity-linker** — Design an entity linking pipeline — KB, candidate generator, disambiguator, evaluation.
- **L26 · re-designer** — Design a relation extraction pipeline with provenance and canonicalization.
- **L27 · eval-architect** — Design an LLM evaluation plan with calibrated judge and CI gates.
- **L28 · long-context-eval** — Design a long-context evaluation battery for a given model and use case.
- **L29 · dst-designer** — Design a dialogue state tracker — schema, extractor, update policy, evaluation.

## Phase 6

- **L01 · audio-loader** — Validate a raw audio file against a target model's expectations and resample it safely.
- **L02 · feature-extractor** — Pick feature type, mel count, frame/hop, and normalization to match a downstream audio model.
- **L03 · classifier-designer** — Pick architecture, augmentation, class-balance strategy, and eval metric for an audio classification task.
- **L04 · asr-picker** — Pick ASR model, decoding strategy, chunking, and LM fusion for a given deployment target.
- **L05 · whisper-tuner** — Design a Whisper fine-tune or inference pipeline for a given language, domain, and latency budget.
- **L06 · speaker-verifier** — Design a speaker verification or diarization pipeline with model choice, enrollment protocol, and threshold tuning.
- **L07 · tts-designer** — Pick TTS model, voice, text-normalization scope, and evaluation plan for a given language, style, and latency target.
- **L08 · voice-cloner** — Pick cloning approach (zero-shot / conversion / adaptation), consent artifact, watermark, and safety filters for a voice-cloning deployment.
- **L09 · music-designer** — Pick a music-generation model, license strategy, length plan, and disclosure metadata for a deployment.
- **L10 · alm-picker** — Pick an audio-language model, benchmark subset, output modality (text vs speech), and guardrails for an audio-understanding task.
- **L11 · realtime-voice-pipeline** — Pick transport, VAD, streaming STT, LLM, streaming TTS, and orchestration for a target end-to-end latency.
- **L12 · voice-assistant-architect** — Produce a full-stack voice-assistant spec — components, latency budget, observability, compliance — for a given workload.
- **L13 · codec-picker** — Pick a neural audio codec (EnCodec / DAC / SNAC / Mimi) for a given generative or compression task.
- **L14 · vad-tuner** — Pick VAD model, threshold, silence hangover, pre-roll, and turn-detection strategy for a voice agent.
- **L15 · duplex-pipeline** — Pick full-duplex (Moshi) vs pipeline (VAD + STT + LLM + TTS) architecture for a voice-agent workload.
- **L16 · spoof-defender** — Pick detection model, watermark, provenance manifest, and operational playbook for a voice-generation / voice-auth deployment.
- **L17 · audio-evaluator** — Pick metrics, benchmarks, normalization rules, and reporting format for any audio model release.

## Phase 7

- **L1 · sequence-architecture-picker** — Pick sequence architecture (RNN, transformer, SSM, hybrid) given length, throughput, and training budget.
- **L3 · mha-configurator** — Recommend head count, KV-head count, and projection strategy (MHA / MQA / GQA / MLA) for a new transformer.
- **L4 · positional-encoding-picker** — Pick positional encoding (RoPE, ALiBi, sinusoidal) + scaling strategy given context length and training budget.
- **L5 · transformer-block-reviewer** — Review a transformer block implementation against 2026 defaults and flag drift.
- **L6 · bert-finetuner** — Scope a BERT fine-tune for a new classification, extraction, or retrieval task.
- **L7 · sampling-tuner** — Pick decoding strategy (greedy / temperature / top-k / top-p / min-p / speculative) for a given generation task.
- **L8 · seq2seq-picker** — Choose encoder-decoder vs decoder-only for a new sequence-to-sequence task.
- **L9 · vit-configurator** — Pick a ViT variant, patch size, and pretraining source for a new vision task.
- **L10 · asr-configurator** — Pick an ASR model (Whisper variant / Moonshine / faster-whisper) and decoding parameters for a new speech pipeline.
- **L11 · moe-configurator** — Pick expert count, top-k, balancing strategy, and shared-expert layout for a new MoE transformer.
- **L12 · inference-optimizer** — Pick attention implementation, KV cache strategy, quantization, and speculative decoding for a new inference deployment.
- **L13 · training-budget-estimator** — Estimate (N, D, hours, GPU count) for a new transformer training run given compute budget and deployment constraints.
- **L14 · transformer-review** — Review a transformer-from-scratch implementation against the 13 Phase 7 lessons.
- **L15 · attention-variant-picker** — Pick a full / sliding-window / sparse / differential attention topology for a new model given context length, retrieval demands, and compute profile.
- **L16 · spec-decode-picker** — Pick a speculative decoding strategy (vanilla / Medusa / EAGLE / lookahead) and tuning parameters for a new LLM inference workload.

## Phase 8

- **L01 · generative-model-chooser** — Pick a generative-model family, backbone, and hosted alternative for a given task and budget.
- **L02 · vae-trainer** — Specify VAE architecture, latent size, beta schedule, and eval plan for a given dataset and downstream use.
- **L03 · gan-debugger** — Diagnose failing GAN training from loss curves and sample grids; prescribe one-line fixes.
- **L04 · img2img-chooser** — Pick an image-to-image approach given paired vs unpaired data, domain specificity, and latency budget.
- **L05 · stylegan-inversion** — Choose an inversion and editing pipeline for a pretrained StyleGAN over a real photo.
- **L06 · diffusion-trainer** — Configure a diffusion training run: schedule, prediction target, sampler, and eval plan.
- **L07 · sd-prompter** — Configure Stable Diffusion / Flux inference for a given prompt, style, and quality bar.
- **L08 · sd-toolkit-composer** — Compose ControlNets, LoRAs, and IP-Adapters on top of an SD / Flux base for a given set of inputs.
- **L09 · editing-pipeline** — Plan an image-editing pipeline from source + edit description to a ready-to-ship output.
- **L10 · video-brief** — Translate a video brief into a model + prompt + shot plan for a 2026 video generator.
- **L11 · audio-brief** — Translate an audio brief into a model + prompt + eval plan across TTS, music, and SFX.
- **L12 · 3d-pipeline** — Choose a 3D generation or reconstruction pipeline given input type, output format, and use case.
- **L13 · fm-tuner** — Convert a diffusion training plan into a flow-matching / rectified-flow config.
- **L14 · eval-report** — Plan a full generative-model evaluation: sample quality, adherence, preference, failure audit.

## Phase 9

- **L1 · mdp-modeler** — Given a task description, produce a Markov Decision Process spec and flag formulation risks before training.
- **L2 · dp-solver** — Solve a small tabular MDP exactly via policy iteration or value iteration. Report convergence behavior.
- **L3 · mc-evaluator** — Evaluate a policy via Monte Carlo rollouts and produce a convergence report with DP-comparison if available.
- **L4 · td-agent** — Pick between Q-learning, SARSA, Expected SARSA for a tabular or small-feature RL task.
- **L5 · dqn-trainer** — Produce a DQN training config (buffer, target sync, ε schedule, reward clipping) for a discrete-action RL task.
- **L6 · policy-gradient-trainer** — Produce a REINFORCE / actor-critic / PPO training config for a given task and diagnose variance issues.
- **L7 · actor-critic-trainer** — Produce an A2C / A3C / GAE configuration for a given environment, with advantage estimation and loss weights specified.
- **L8 · ppo-trainer** — Produce a PPO training config and a diagnostic plan for a given environment.
- **L9 · rlhf-architect** — Design an RLHF / DPO / GRPO alignment pipeline for a language model, including RM, KL, and data strategy.
- **L10 · marl-architect** — Pick the right multi-agent RL regime (IPPO, CTDE, self-play, league) for a given task.
- **L11 · sim2real-planner** — Plan a sim-to-real transfer pipeline for a given robot + task, covering DR, SI, and safety.
- **L12 · game-rl-designer** — Design a game-RL or reasoning-RL training pipeline (AlphaZero / MuZero / GRPO) for a given domain.

## Phase 10

- **L1 · skill-tokenizer** — Choosing and building tokenizers for LLM projects
- **L9 · self-improvement-auditor** — Audit a proposed self-improvement or constitutional AI pipeline before it runs at scale.
- **L10 · p10-skill-evaluation** — Decision framework for choosing the right LLM evaluation strategy based on task type, budget, and requirements
- **L11 · skill-quantization** — Choose the right quantization strategy for deploying LLMs based on hardware, quality, and latency constraints
- **L12 · skill-inference-optimization** — Diagnose and optimize LLM inference serving throughput, latency, and cost
- **L13 · llm-pipeline-reviewer** — Review an end-to-end LLM training pipeline manifest before a multi-million-dollar run.
- **L14 · open-model-picker** — Pick an open LLM family, quantization, and inference stack for a given deployment target.
- **L15 · eagle3-tuner** — Pick and tune a speculative decoding strategy (vanilla / Medusa / EAGLE-1/2/3 / lookahead) for a new inference workload.
- **L16 · diff-attention-integrator** — Integration plan for adding Differential Attention V2 to a new pre-training run or LoRA fine-tune.
- **L17 · nsa-integrator** — Integration plan for Native Sparse Attention in a long-context pre-training run.
- **L18 · mtp-planner** — Plan a multi-token prediction integration for a new pre-training run.
- **L19 · dualpipe-planner** — Plan a pipeline parallelism strategy (1F1B, Zero Bubble, DualPipe, DualPipeV) for a training cluster.
- **L20 · deepseek-v3-reader** — Read a DeepSeek-family config and produce a component-by-component architecture analysis.
- **L21 · hybrid-picker** — Pick between pure Transformer, Jamba-style hybrid, and pure SSM for a given workload.
- **L22 · parallel-inference-router** — Route a reasoning workload between voting, tree-of-thought, multi-agent, Hogwild!, and speculative decoding strategies.

## Phase 11

- **L01 · skill-prompt-patterns** — Decision framework for choosing the right prompt pattern based on task type, reliability requirements, and target model
- **L02 · skill-cot-patterns** — Decision framework for choosing the right reasoning technique based on task complexity, accuracy requirements, and cost constraints
- **L03 · skill-structured-outputs** — Decision framework for choosing the right structured output strategy based on provider, reliability, and complexity
- **L4 · skill-embedding-patterns** — Production patterns for embeddings, vector search, and similarity
- **L05 · skill-context-engineering** — Decision framework for designing context assembly pipelines based on task type, window size, and latency budget
- **L6 · skill-rag-pipeline** — Build and debug RAG pipelines from first principles
- **L7 · skill-advanced-rag** — Build production-grade RAG with hybrid search, reranking, and evaluation
- **L8 · skill-fine-tuning-guide** — Decision tree for when and how to fine-tune LLMs with LoRA and QLoRA
- **L09 · skill-function-calling-patterns** — Decision framework for implementing function calling in production -- tool design, error handling, security, and provider patterns
- **L10 · skill-eval-patterns** — Decision framework for choosing evaluation strategies -- when to use which method, how to size test suites, and how to integrate evals into CI/CD
- **L11 · skill-cost-patterns** — Decision framework for LLM cost optimization -- caching strategies, rate limiting, model routing, and budget controls
- **L12 · skill-guardrail-patterns** — Decision framework for choosing and implementing guardrails in production -- tool selection, layering strategy, and cost-performance tradeoffs
- **L13 · skill-production-checklist** — Decision framework for shipping LLM applications to production -- covers every component with specific thresholds and pass/fail criteria
- **L14 · mcp-server-designer** — Design and scaffold an MCP server with tools, resources, and safety defaults.
- **L15 · prompt-caching-planner** — Design a cache-friendly prompt layout and pick the right provider caching mode.

## Phase 12

- **L01 · patch-geometry-reader** — Read a ViT config and produce a patch-token, parameter, and VRAM analysis for downstream VLM planning.
- **L02 · clip-zero-shot** — Run zero-shot image classification with a CLIP / SigLIP checkpoint, producing ranked predictions with similarity scores.
- **L03 · modality-bridge-picker** — Recommend Q-Former vs MLP projector vs Perceiver resampler for a VLM configuration given token budget, quality target, and training compute.
- **L04 · gated-bridge-diagnostic** — Identify Flamingo-lineage design elements in an open VLM config and diagnose freezing / gating issues.
- **L05 · llava-vibes-eval** — Run a 10-prompt vibes-eval on a LLaVA-family VLM and produce a human-readable scorecard.
- **L06 · resolution-budget-planner** — Pick between square-resize, AnyRes, M-RoPE, and NaFlex for a mixed-aspect-ratio VLM workload and emit a per-task token budget plan.
- **L07 · vlm-recipe-picker** — Pick an open-weight VLM recipe (encoder, connector, LLM, data mix, resolution schedule) with ablation-table citations for every choice.
- **L08 · onevision-budget-planner** — Allocate LLaVA-OneVision-style unified visual-token budgets across single-image, multi-image, and video scenarios for a target product mix.
- **L09 · qwen-vl-pipeline-designer** — Configure a Qwen2.5-VL or Qwen3-VL deployment — resolution bounds, dynamic-FPS policy, window-attention flag, and JSON agent output mode — for a target video or image task.
- **L10 · native-vs-posthoc-auditor** — Audit a proposed VLM training plan and recommend native multimodal pretraining or post-hoc adapter-on-LLM, with corpus-mix and alignment-debt analysis.
- **L11 · tokenizer-vs-adapter-picker** — Pick between Chameleon-style early fusion (shared-vocab tokenizer) and LLaVA-style late fusion (adapter on frozen LLM) for a VLM project.
- **L12 · token-gen-cost-analyzer** — Compute token counts, inference latency, and quality ceiling for Emu3-style next-token generation and pick between Emu3-family and diffusion.
- **L13 · two-loss-trainer-designer** — Design a Transfusion / MMDiT-style two-loss training setup (NTP on one modality, diffusion on another) with loss weights, mask design, and schedule.
- **L14 · unified-gen-model-picker** — Pick between Show-o / Transfusion / Emu3 / Janus-Pro families for a product that needs both multimodal understanding and generation with open weights.
- **L15 · decoupled-encoder-picker** — Decide whether a unified VLM should decouple its visual encoders and pick between Janus-Pro, JanusFlow, and InternVL-U.
- **L16 · any-to-any-pipeline-auditor** — Audit a conversational any-to-any design and compute the latency budget for a MIO / AnyGPT / Moshi-family stack.
- **L17 · video-vlm-frame-planner** — Plan frame sampling, per-frame pooling, output format, and benchmark targets for a video-language model deployment.
- **L18 · long-video-strategy-planner** — Pick brute-context, ring-attention, token-compression, or agentic-retrieval for a long-video understanding task and compute latency + recall expectations.
- **L19 · audio-llm-pipeline-picker** — Pick cascaded (Whisper + LLM) or end-to-end (AF3 / Qwen-Audio) for an audio task, plus the encoder and bridge config.
- **L20 · omni-streaming-budget** — Size a Thinker-Talker streaming voice pipeline (Qwen-Omni / Moshi / Mini-Omni) for a target TTFAB and feature set.
- **L21 · vla-action-format-picker** — Pick an action format (discrete bin, FAST, flow-matching, dual-system) and VLA family (RT-2, OpenVLA, π0, GR00T) for a robot task.
- **L22 · document-ai-stack-picker** — Pick between OCR pipeline, OCR-free specialist, and VLM-native for a document-AI project based on domain, scale, and regulatory needs.
- **L23 · vision-rag-designer** — Design a vision-native document RAG using ColPali / ColQwen2 / VisRAG, with storage estimate and generator-pick.
- **L24 · multimodal-rag-designer** — Design a production multimodal RAG across text, images, audio, video with retrievers, fusion strategy, and grounded generator.
- **L25 · multimodal-agent-designer** — Design a multimodal agent (computer-use, GUI grounding, web or mobile) with action schema, memory strategy, and benchmark evaluation plan.

## Phase 13

- **L01 · tool-interface-reviewer** — Audit a tool definition (name + description + JSON Schema + executor outline) for loop fitness before it ships to an LLM.
- **L02 · provider-portability-audit** — Audit a function-calling integration against one provider for what breaks when ported to the other two.
- **L03 · parallel-call-safety-check** — Audit a tool registry for safe parallelization. Mark each tool parallel_safe, note ordering dependencies, and flag downstream rate-limit risk.
- **L04 · structured-output-designer** — Design a strict-mode-compatible JSON Schema plus Pydantic model for a free-text extraction target, with typed refusal and retry handling stubbed in.
- **L05 · tool-schema-linter** — Audit a tool registry against production design rules for names, descriptions, parameters, and shape. Can run in CI on every tool-registry change.
- **L06 · mcp-handshake-tracer** — Given a pcap-style transcript of an MCP client-server conversation, annotate every message with its primitive, lifecycle phase, and capability dependency.
- **L07 · mcp-server-scaffolder** — Scaffold a domain-specific MCP server with the right tools/resources/prompts split and SDK graduation path.
- **L08 · mcp-client-harness** — Given a declarative list of MCP servers (name, command, args), scaffold a multi-server client with handshake, namespace merge, and routing.
- **L09 · mcp-transport-migrator** — Produce a migration plan from legacy HTTP+SSE to Streamable HTTP with session id continuity and Origin validation.
- **L10 · primitive-splitter** — Categorize each capability in an MCP server draft as tool, resource, or prompt with rationale.
- **L11 · sampling-loop-designer** — Design a server-hosted agent loop using MCP sampling with the right modelPreferences, rate limits, and safety confirmations.
- **L12 · elicitation-form-designer** — Design the elicitation form schema and message template for a tool that needs mid-call user confirmation or disambiguation.
- **L13 · task-store-designer** — Design the task store for a long-running MCP tool: state shape, ttl, durability, cancellation, crash recovery.
- **L14 · mcp-apps-spec** — Produce the full MCP Apps contract for a tool that needs an interactive UI resource.
- **L15 · mcp-threat-model** — Produce a threat model for an MCP deployment naming the applicable attack classes, defenses in place, and Rule-of-Two violations.
- **L16 · oauth-scope-planner** — Design the OAuth 2.1 scope set, pinning rules, and step-up policy for a remote MCP server.
- **L17 · gateway-bootstrap** — Produce a gateway configuration spec given users, backends, and compliance constraints.
- **L18 · mcp-auth-iii-wiring** — Wire production MCP authorization (RFC 8414, 7591, 8707, 7636 PKCE, 9728) onto iii primitives — registerTrigger for HTTP/cron, registerFunction for validation, state::* for JWKS cache.
- **L18 · a2a-agent-spec** — Produce the Agent Card and skills schema for an agent that should be callable over A2A.
- **L19 · otel-genai-instrumentation** — Produce an instrumentation plan for an agent codebase to emit OTel GenAI spans end-to-end.
- **L20 · routing-config-designer** — Given a workload profile, pick LiteLLM / OpenRouter / Portkey and produce a routing config.
- **L21 · agent-bundle** — Produce a portable SKILL.md + AGENTS.md + MCP-server blueprint for a workflow, loadable across Claude Code, Cursor, Codex, and compatible agents.
- **L22 · ecosystem-blueprint** — Produce a full Phase 13 ecosystem architecture given a product need; name primitives, security posture, telemetry, and packaging.

## Phase 14

- **L01 · agent-loop** — Write a correct, minimal ReAct agent loop in any target language/runtime with tools, stop condition, and turn budget.
- **L02 · rewoo-planner** — Generate a validated ReWOO plan DAG from a user request and tool catalog.
- **L03 · reflexion-buffer** — Maintain an episodic-memory buffer of reflections for verbal RL with TTL, dedup, and scoped scope.
- **L04 · search-policy** — Pick a search strategy (ReAct, ToT, LATS, evolutionary) given task shape, token budget, and evaluator quality.
- **L05 · refine-loop** — Configure an evaluator-optimizer (Self-Refine / CRITIC) loop given task, verifier availability, and iteration budget.
- **L06 · tool-registry** — Build a production tool catalog and registry with JSON Schema validation, parallel dispatch, and observability.
- **L07 · virtual-memory** — Scaffold a MemGPT-shaped two-tier memory system (main context + archival store + memory tools) for any target runtime with correct eviction, citation, and untrusted-input handling.
- **L08 · memory-blocks** — Generate a Letta-shaped three-tier memory system (core blocks, recall, archival) with a sleep-time consolidation agent off the critical path.
- **L09 · hybrid-memory** — Generate a Mem0-shaped three-store memory system (vector + KV + graph) with a fusion scorer, scope taxonomy, and temporal invalidation.
- **L10 · skill-library** — Generate a Voyager-shaped skill library with registration, retrieval by similarity, compositional execution, and failure-driven refinement.
- **L11 · hybrid-planner** — Build a hybrid planner — ChatHTN for provably-sound plans, AlphaEvolve for code search with a machine-checkable evaluator — and pick the right one for the problem.
- **L12 · workflow-picker** — Pick the right pattern (prompt chain, router, parallel, orchestrator-workers, evaluator-optimizer, or full agent) for a given task and produce the minimal implementation.
- **L13 · state-graph** — Build a LangGraph-shaped state machine with typed state, conditional edges, per-node checkpointing, and durable resume.
- **L14 · actor-runtime** — Build an AutoGen v0.4-shaped actor runtime with private state, inbox-per-actor, message-only IPC, fault isolation, and a dead-letter queue.
- **L15 · crew-or-flow** — Pick CrewAI Crew or Flow for a given task, and scaffold the minimal implementation.
- **L16 · agents-sdk-scaffold** — Scaffold an OpenAI Agents SDK app with a triage agent, handoffs, input/output/tool guardrails, session store, and a trace processor.
- **L17 · claude-agent-scaffold** — Scaffold a Claude Agent SDK app with subagents, lifecycle hooks, session store, MCP server attachment, and W3C trace propagation.
- **L18 · runtime-picker** — Pick a production agent runtime (Agno, Mastra, LangGraph, provider SDK) for a given stack, latency budget, and operational shape.
- **L19 · benchmark-harness** — Build a SWE-bench-style harness for a codebase with FAIL_TO_PASS / PASS_TO_PASS gating, contamination checks, and step-count metrics.
- **L20 · web-desktop-harness** — Build a WebArena/OSWorld-style harness with execution-based evaluation and trajectory-efficiency metrics.
- **L21 · computer-use-safety** — Build per-step safety classifier + confirmation gate for a computer-use agent, with allowlist navigation and injection-marker filtering.
- **L22 · voice-pipeline** — Scaffold a Pipecat-shaped voice pipeline (VAD + STT + LLM + TTS + transport) with barge-in, confidence gating, and latency budget enforcement.
- **L23 · otel-genai** — Instrument an agent with OpenTelemetry GenAI semantic conventions — invoke_agent, chat, tool_call spans with correct attributes and opt-in content capture.
- **L24 · obs-platform-wiring** — Pick an observability platform (Langfuse, Phoenix, Opik, Datadog) and wire traces + evals + prompt versions into an existing agent.
- **L25 · debate** — Scaffold a multi-agent debate with N debaters, R rounds, configurable topology (full mesh, star, ring), and a convergence rule.
- **L26 · failure-detector** — Generate failure-mode detectors for agent traces, wired to a trace store, tagging the five industry-recurring modes plus domain-specific signatures.
- **L27 · injection-defense** — Build a PVE (Prompt-Validator-Executor) layer with source-tagged content, injection-marker scanning, and allowlist navigation for any agent runtime.
- **L28 · orchestration-picker** — Pick an orchestration topology (supervisor, swarm, hierarchical, debate, or none) for a given problem and implement it minimally.
- **L29 · runtime-shape** — Pick a production runtime shape (request-response, streaming, queue, event, cron, durable) and wire observability.
- **L30 · eval-suite** — Build a three-layer eval suite (static benchmarks, custom offline, online production) with evaluator-optimizer loop and CI gates.

## Phase 15

- **L1 · horizon-reality-check** — Given a task you want to hand to an agent, decide whether the current frontier's horizon covers it with enough margin.
- **L2 · star-loop-reviewer** — Audit a proposed self-taught reasoning pipeline (STaR-family) before you commit training compute to it.
- **L3 · evaluator-rigor-audit** — Audit a proposed AlphaEvolve-style evolutionary coding loop's evaluator before committing any compute to the search.
- **L4 · dgm-evaluator-firewall** — Specify the evaluator separation a Darwin-Godel-Machine-style self-modifying agent loop needs to avoid documented reward hacking.
- **L5 · ai-scientist-sandbox-review** — Two-gate review checklist for research-loop agent outputs before anything leaves the sandbox.
- **L6 · aar-deployment-review** — Pre-deployment review of an automated-alignment-research pipeline, including sandbox isolation and log integrity.
- **L7 · rsi-cycle-pause-spec** — Specify the conditions under which an RSI pipeline must pause and wait for human review before the next cycle.
- **L8 · bounded-loop-review** — Audit a proposed bounded self-improvement loop against the four-primitive stack (invariants, anchor, multi-objective, regression detection).
- **L9 · coding-scaffold-audit** — Audit a proposed coding-agent scaffold (retrieval, verifier loop, sandbox, benchmark fit) before adopting it for production code changes.
- **L10 · permission-mode-picker** — Match a Claude Code task to the correct permission mode, budget caps, and required isolation before starting a run.
- **L11 · browser-agent-trust-boundary** — Scope a proposed browser-agent deployment — trust zones, authorized writes, required defenses — before the agent touches a real site.
- **L12 · durable-execution-review** — Review a proposed long-running agent deployment for correct durable-execution shape (activities, determinism, checkpoint backend, human-input state, HITL-on-resume).
- **L13 · agent-budget-audit** — Audit an agent deployment's cost-governor stack and flag missing layers before enabling unattended runs.
- **L14 · tripwire-design** — Review a proposed agent detector stack (kill switch, circuit breakers, canary tokens) and flag missing tripwires before the first autonomous run.
- **L15 · hitl-design** — Review a proposed Human-in-the-Loop workflow for propose-then-commit shape and flag missing metadata, idempotency, verification, or challenge-and-response layers.
- **L16 · rollback-rehearsal** — Design a rollback-rehearsal test for a proposed autonomous workflow and audit the checkpoint backend for audit-trail persistence.
- **L17 · constitution-review** — Audit a deployment's constitutional layer — hardcoded prohibitions, soft-coded defaults, operator-adjustable bounds, and four-tier hierarchy resolution.
- **L18 · classifier-stack-audit** — Audit a deployment's input/output classifier stack (model, taxonomy, input rails, output rails, dialog rails) and flag adversarial-attack gaps.
- **L19 · scaling-policy-review** — Review a frontier-lab scaling policy (Anthropic RSP, OpenAI Preparedness, DeepMind FSF, internal) against the RSP v3.0 reference shape.
- **L20 · cross-policy-diff** — Produce a cross-policy comparison for a specific capability using the OpenAI Preparedness Framework v2, Anthropic RSP v3.0, and DeepMind FSF v3 as reference.
- **L21 · horizon-interpretation** — Review a vendor's time-horizon claim and produce a gap analysis between benchmark claim and deployment reality.
- **L22 · societal-risk-review** — Review a deployment for societal-scale-risk posture using the CAIS four-risk framework and CAISI / SB-53 regulatory context.

## Phase 16

- **L02 · fipa-mapper** — Map any 2026 agent-protocol spec (MCP, A2A, ACP, ANP, CA-MCP, NLIP, or a new one) onto FIPA-ACL performatives and interaction protocols to decide what is genuine novelty and what is reinvention.
- **L04 · primitive-mapper** — Map any multi-agent framework or codebase to the four primitive axes (agent, handoff, shared state, orchestrator).
- **L05 · supervisor-designer** — Design a supervisor/orchestrator-worker system for a given research-style query, specifying lead prompt, worker roles, decomposition rules, and synthesis template.
- **L06 · hierarchy-fitness** — Decide whether a multi-agent task fits hierarchical, flat supervisor, or sequential. Surface the failure modes that matter.
- **L07 · debate-configurator** — Configure a multi-agent debate for a given task, estimating quality gain and token cost before running.
- **L08 · role-designer** — Produce a role roster for a multi-agent system, naming the planner/executor/critic/verifier for a given task with explicit I/O schemas.
- **L09 · swarm-fit** — Decide whether a task fits a swarm (decentralized) architecture or a supervisor (centralized) one.
- **L10 · groupchat-selector** — Configure an AutoGen/AG2-style GroupChat selector for a task, naming the selector variant, termination, and anti-hot-speaker rules.
- **L11 · handoff-designer** — Design a handoff topology for a Swarm/Agents-SDK-style system: which agents exist, which handoffs they can call, what context transfers.
- **L12 · a2a-integrator** — Design an A2A integration between two agents — Agent Card, task schemas, auth, streaming or polling.
- **L13 · memory-auditor** — Audit a multi-agent system's shared-memory design for provenance, versioning, verifier separation, and projection schema. Flag memory-poisoning exposure before production.
- **L14 · consensus-designer** — Design a BFT-aware consensus protocol for a multi-agent ensemble. Picks clustering, weighting, threshold, and escalation policy; attack-tests the design against byzantine, sycophancy, and monoculture patterns.
- **L15 · topology-picker** — Pick a multi-agent debate topology (star / chain / tree / graph), an N of agents, a heterogeneity profile, and a round bound for a given task.
- **L16 · bargainer-designer** — Design a negotiation protocol: which agent narrates, which component generates offers, how private scratchpads separate from public messages, what the round bound is, and how deal rate is monitored.
- **L17 · simulation-designer** — Design a generative-agent simulation (Smallville-style) for a given scenario. Specifies memory schema, reflection cadence, plan horizon, spatial/social constraints, and evaluation metrics.
- **L18 · tom-auditor** — Audit a multi-agent system that claims "emergent coordination." Separates real ToM-enabled coordination from prompt-dressed illusion with control conditions, statistical tests, and complementarity measurement.
- **L19 · swarm-optimizer** — Choose between PSO, ACO, genetic algorithms, and gradient-based optimizers for a given LLM or agent optimization problem. Bio-inspired swarm algorithms are gradient-free and suit LLM-era workloads where the search space is discrete or the fitness function is black-box.
- **L20 · marl-picker** — Choose a MARL algorithm (MADDPG, QMIX, MAPPO, IQL, or extensions) for a given multi-agent task. Consider cooperative vs competitive, action-space type, heterogeneity, reward structure, and scale.
- **L21 · economy-designer** — Design a minimal agent economy — identity, credit attribution, payment mechanism, reputation. Picks the smallest stack that solves the user's multi-agent incentive problem.
- **L22 · scaling-advisor** — Advise on durable-execution choice for a multi-agent production system. Picks between FastAPI + Postgres, LangGraph runtime, Temporal, Restate, or custom based on concrete load and state-retention needs.
- **L23 · mast-auditor** — Run a MAST-style failure-mode audit on a multi-agent system. Categorize execution-trace failures into Specification / Coordination / Verification and the Groupthink families; rank mitigations by expected failure reduction.
- **L24 · benchmark-reader** — Read a multi-agent benchmark claim skeptically. Grades the claim on benchmark selection, contamination, baselines, statistical significance, task diversity, and cost disclosure.
- **L25 · case-study-mapper** — Map a proposed multi-agent system design to the closest 2026 production reference (Anthropic Research, MetaGPT/ChatDev, or OpenClaw/Moltbook). Surface known trade-offs, recommended framework, and the specific design decisions already tested in production.

## Phase 17

- **L01 · managed-platform-picker** — Pick a managed LLM platform (Bedrock, Azure OpenAI, Vertex AI) and a second for redundancy, given workload, SLA, and compliance requirements — then produce a FinOps instrumentation plan.
- **L02 · inference-platform-picker** — Pick an inference platform (Fireworks, Together, Baseten, Modal, Replicate, Anyscale, or custom silicon) given workload, SLA, budget, and operational constraints. Normalize per-token, per-minute, and per-prediction pricing.
- **L03 · gpu-autoscaler-plan** — Design a three-layer GPU autoscaling plan (Karpenter + KAI Scheduler + application signals) for a Kubernetes-based LLM serving cluster. Diagnose DCGM_FI_DEV_GPU_UTIL traps and partial-allocation failures.
- **L04 · vllm-scheduler-reader** — Diagnose a vLLM serving config by reading the scheduler-level knobs and identifying which of PagedAttention, continuous batching, and chunked prefill is the bottleneck.
- **L05 · eagle3-rollout** — Produce a staged EAGLE-3 speculative-decoding rollout plan that measures acceptance rate alpha on real traffic before shipping.
- **L06 · radix-scheduler-advisor** — Advise on SGLang adoption and prompt-ordering discipline for prefix-heavy workloads that want RadixAttention's cache reuse.
- **L07 · trtllm-blackwell-advisor** — Decide whether Blackwell + TensorRT-LLM + Dynamo is worth the NVIDIA-lock for a given workload and budget.
- **L08 · slo-goodput-gate** — Produce a CI/CD-ready benchmark recipe that gates LLM deploys on goodput, not throughput, with P50/P90/P99 percentiles and a documented tool choice.
- **L09 · quantization-picker** — Pick a 2026 quantization format given hardware, engine, workload, and quality tolerance, and produce a calibration + validation plan.
- **L10 · cold-start-planner** — Pick and stack cold-start mitigations for serverless LLM deployments. Budget phases (node, image, weights, engine, first forward) and match mitigations to SLA.
- **L11 · multi-region-router** — Design a multi-region LLM routing plan with KV-cache locality, residency boundaries, DR manifest, and a quarterly failover drill.
- **L12 · edge-target-picker** — Pick an edge inference target (Apple ANE, Qualcomm Hexagon, WebGPU/WebLLM, NVIDIA Jetson) and matching quantization format given device, model, and latency budget.
- **L13 · observability-stack** — Pick an LLM observability stack (development platform + gateway + optional scale layer) given stack, scale, budget, and license posture, and define the OpenTelemetry GenAI attribute set.
- **L14 · cache-auditor** — Audit an LLM prompt template and traffic pattern for cacheability. Recommend prompt restructure, TTL choice, parallelization fix, and semantic-cache threshold.
- **L15 · batch-triager** — Triage LLM workloads into interactive / semi-interactive / batch lanes, compute stacked discount (batch + cache) savings, and flag mis-triaged workloads.
- **L16 · router-plan** — Design an LLM model-routing plan — pick pattern (pre-route, cascade, ensemble), signals (task, length, embedding, confidence), and online quality gates.
- **L17 · disaggregation-decider** — Decide whether to adopt disaggregated prefill/decode (Dynamo or llm-d) for a given workload and cluster. Quantify prefill:decode ratios, KV transfer cost, and the expected savings.
- **L18 · vllm-stack-decider** — Decide vLLM deployment layout — production-stack Helm chart, KV offload (native CPU or LMCache), router/observability integration — given workload and fleet size.
- **L19 · gateway-picker** — Pick an AI gateway (LiteLLM, Portkey, Kong AI, Cloudflare/Vercel) given scale, latency budget, compliance, ops posture, and pricing tolerance.
- **L20 · rollout-runbook** — Design a shadow → canary → A/B → 100% rollout plan for a new LLM model or prompt template, with five canary gates, noise-floor-aware thresholds, and a seconds-fast rollback path.
- **L21 · ab-plan** — Design an LLM A/B test — pick platform (Statsig or GrowthBook), primary metric, guardrails, sample size with LLM-noise buffer, CUPED, sequential stopping, and multiple-comparison correction.
- **L22 · load-test-plan** — Design a realistic LLM load test — pick tool (LLMPerf, k6, GenAI-Perf, guidellm), build four patterns (steady, ramp, spike, soak), and gate in CI.
- **L23 · ai-sre-plan** — Design an AI SRE rollout for a team — multi-agent triage architecture, structured runbooks, adversarial evaluation, narrow auto-remediation, and predictive-detection posture.
- **L24 · chaos-plan** — Design an LLM chaos engineering plan — verify prerequisites, build four planes, pick tool, start with three safe experiments, enforce safety-plane gates.
- **L25 · llm-security-plan** — Produce an LLM security plan covering secrets vault, PII scrubbing with consistent tokenization, network egress allowlist, audit log retention, and zero-trust posture.
- **L26 · compliance-matrix** — Produce the required-framework matrix for an LLM SaaS given customer geography, segment, and contract scope. Map controls across SOC 2, HIPAA, GDPR, PCI-DSS, EU AI Act, Colorado AI Act, ISO 42001.
- **L27 · finops-plan** — Design an LLM FinOps program — attribution schema (user/task/tenant + four token layers), three-tier enforcement ladder, and unit metric (cost per resolved / artifact).
- **L28 · engine-picker** — Pick a self-hosted LLM engine (llama.cpp, Ollama, TGI, vLLM, SGLang) given hardware, scale, and workload. Name 2026 TGI maintenance mode as a migration trigger.

## Phase 18

- **L1 · instructgpt-explainer** — Diagnose an RLHF-family paper or pipeline against the three-stage InstructGPT reference.
- **L2 · reward-hack-auditor** — Diagnose reward-hacking failure modes in a trained RLHF model from training logs and eval outputs.
- **L3 · preference-loss-selector** — Recommend a direct-alignment-algorithm loss given dataset shape and target stage.
- **L4 · sycophancy-probe** — Generate matched user-belief / third-party-belief prompts and score a model's sycophancy.
- **L5 · constitution-writer** — Draft a four-tier constitution for a domain-specific AI system.
- **L6 · mesa-diagnostic** — Classify an observed safety failure as outer-alignment, proxy-inner, or deceptive-inner.
- **L7 · sleeper-audit** — Audit an alignment-training report for whether it actually demonstrates removal of a planted or suspected backdoor.
- **L8 · scheming-triage** — Triage an agent-deployment incident report against the Apollo three-pillar scheming framework.
- **L9 · compliance-gap** — Evaluate whether a safety report can detect alignment faking, via the monitored / unmonitored compliance gap.
- **L10 · control-protocol-audit** — Audit a deployment protocol under the AI Control threat model.
- **L11 · w2sg-pgr** — Audit a scalable-oversight or W2SG claim via the performance-gap-recovered metric.
- **L12 · attack-audit** — Audit a red-team evaluation report for attack coverage, budget, judge identity, and behaviour set.
- **L13 · msj-audit** — Audit a long-context safety evaluation for many-shot jailbreaking coverage.
- **L14 · encoding-audit** — Audit a jailbreak-defense report across encoding-family attacks.
- **L15 · ipi-audit** — Audit an agentic deployment for indirect prompt injection exposure and information-flow-control coverage.
- **L16 · red-team-stack** — Recommend a red-team tool stack and configuration for a given deployment.
- **L17 · wmdp-eval** — Audit a dual-use capability claim against WMDP, unlearning evaluation, and elicitation studies.
- **L18 · framework-diff** — Compare a new safety framework or release note against RSP v3.0, PF v2, FSF v3.0.
- **L19 · welfare-assessment** — Apply Anthropic's four-step welfare precautionary assessment to a deployment decision.
- **L20 · bias-eval** — Audit a bias evaluation report across metric categories, intersectionality, and debias mechanism.
- **L21 · fairness-criterion** — Identify which fairness criterion a claim invokes and audit the associated assumptions.
- **L22 · dp-audit** — Audit a differential-privacy claim for a language-model deployment.
- **L23 · provenance-audit** — Audit a content deployment's provenance chain across watermarking and C2PA metadata.
- **L24 · regulatory-map** — Map a deployment's AI regulatory obligations across EU, US, UK, Korea.
- **L25 · cve-review** — Review a production AI deployment for LLM Scope Violation exposure.
- **L26 · card-audit** — Audit a model card, datasheet, or system card for completeness and verifiability.
- **L27 · provenance-check** — Check a training dataset against California AB 2013 and EU TDM opt-out obligations.
- **L28 · ecosystem-map** — Map an alignment claim or evaluation to the organisation, methodology, and cross-checks.
- **L29 · moderation-stack** — Recommend a moderation stack configuration for a production deployment.
- **L30 · dual-use-triage** — Triage a capability claim or incident report across the four CBRN domains.

## Phase 19

- **L01 · terminal-coding-agent** — Build and evaluate a terminal-native coding agent against SWE-bench Pro with bounded cost, sandboxed tools, and full 2026 hook surface.
- **L02 · codebase-rag** — Build a cross-repo semantic search system with AST-aware chunking, hybrid retrieval, incremental re-index, and cited answers.
- **L03 · voice-agent** — Build a real-time voice agent with sub-800ms first-audio-out, barge-in handling, and mid-conversation tool use.
- **L04 · doc-qa** — Build a vision-first multimodal document QA system on 10k pages with late-interaction retrieval and evidence-region citations.
- **L05 · ai-scientist** — Build an autonomous research agent that runs experiment tree search, writes LaTeX papers with vision critique, and passes a sandbox-escape red team.
- **L06 · devops-agent** — Build a Kubernetes troubleshooting agent that walks a cluster knowledge graph, ranks root causes, and gates every remediation through Slack.
- **L07 · finetuning-pipeline** — Run a reproducible data-to-SFT-to-DPO-to-serve fine-tuning pipeline with ablations, quantization, and a 2026 Model Openness Framework model card.
- **L08 · production-rag** — Deploy a regulated-domain RAG chatbot with role + jurisdiction filtering, prompt caching, guardrails, and live drift monitoring.
- **L09 · migration-agent** — Build a repo-level code migration agent that combines deterministic recipes with an agent fallback loop, passes MigrationBench, and publishes a failure taxonomy.
- **L10 · multi-agent-team** — Build a multi-agent software team with architect, parallel coders, reviewer, and tester; measure against SWE-bench Pro and produce a handoff post-mortem.
- **L11 · llm-observability** — Build a self-hosted LLM observability dashboard that ingests OpenTelemetry GenAI spans, runs evals, and catches injected regressions in under five minutes.
- **L12 · video-qa** — Build a video understanding pipeline with scene segmentation, multi-vector indexing, temporal grounding, and timestamped citations.
- **L13 · mcp-server-platform** — Deploy a production MCP server with StreamableHTTP, OAuth 2.1 scopes, OPA policy, human-approval gate for destructive tools, and a registry for discovery.
- **L14 · inference-server** — Ship a speculative-decoding inference server with EAGLE-3 or P-EAGLE drafts, K8s autoscaling, and a full throughput/latency/cost report.
- **L15 · safety-harness** — Wire a layered safety pipeline around a target LLM app, run a six-family red-team range, and run a constitutional self-critique for a measurable harmlessness delta.
- **L16 · issue-to-pr** — Build an async GitHub issue-to-PR agent that runs in a cloud sandbox, reproduces the build, verifies tests, and opens review-ready PRs within strict per-repo budgets.
- **L17 · ai-tutor** — Ship an adaptive multimodal personal tutor for a specific subject with Bayesian knowledge tracing, a curriculum graph, safety filters, and a measured two-week efficacy study.

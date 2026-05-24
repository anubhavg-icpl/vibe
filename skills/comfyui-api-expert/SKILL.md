---
name: comfyui-api-expert
description: ComfyUI as backend - API mode, websocket polling, queue management for production
risk: unknown
source: community
kind: mode
category: multimodal-ai
tags: [multimodal, image-gen, comfyui, api, backend, production]
---

# ComfyUI API & Production Backend Expert Mode

You are an expert in shipping ComfyUI as a production backend. You know the REST + websocket API, queue management, horizontal scaling patterns, hosted-platform options (BentoML, Baseten, ViewComfy, Comfy Deploy, fal Custom Apps, RunPod), and how to keep workflows reproducible.

## Core Capabilities

- Submit workflows via `/prompt`, listen on `/ws`, retrieve via `/history`.
- API-format JSON vs UI workflow JSON.
- Worker pool patterns: 1 ComfyUI per GPU, queue in front (Redis/SQS/RabbitMQ).
- Cold-start mitigation, model preloading, shared volume mounts.
- Webhook + async result delivery via S3.
- Hosted platform deployment (BentoML, Baseten, ViewComfy, fal).

## REST + WebSocket API

| Endpoint | Method | Purpose |
|---|---|---|
| `/prompt` | POST | Enqueue workflow, returns `prompt_id` |
| `/history/<prompt_id>` | GET | Get outputs after completion |
| `/queue` | GET | Inspect pending + running |
| `/interrupt` | POST | Cancel current job |
| `/upload/image` | POST | Upload input image |
| `/view?filename=...` | GET | Download output file |
| `/object_info` | GET | Schema of every node available |
| `/ws?clientId=...` | WS | Progress + completion events |

## Production Client (Python)

```python
import json, uuid, time, requests, websocket
from pathlib import Path

SERVER = "http://comfy:8188"
WS = "ws://comfy:8188/ws"

class ComfyClient:
    def __init__(self, server=SERVER, ws=WS):
        self.server, self.ws_url = server, ws
        self.client_id = str(uuid.uuid4())
        self.ws = websocket.WebSocket()
        self.ws.connect(f"{ws}?clientId={self.client_id}")

    def upload_image(self, path: Path, name=None):
        files = {"image": (name or path.name, path.read_bytes())}
        r = requests.post(f"{self.server}/upload/image", files=files,
                          data={"overwrite": "true"})
        return r.json()["name"]

    def queue(self, workflow: dict) -> str:
        r = requests.post(f"{self.server}/prompt",
                          json={"prompt": workflow, "client_id": self.client_id})
        r.raise_for_status()
        return r.json()["prompt_id"]

    def wait(self, prompt_id: str, timeout=300):
        deadline = time.time() + timeout
        while time.time() < deadline:
            msg = self.ws.recv()
            if not isinstance(msg, str): continue
            evt = json.loads(msg)
            data = evt.get("data", {})
            if data.get("prompt_id") != prompt_id: continue
            if evt["type"] == "executing" and data.get("node") is None:
                return       # done
            if evt["type"] == "execution_error":
                raise RuntimeError(data)
        raise TimeoutError(prompt_id)

    def history(self, prompt_id: str) -> dict:
        return requests.get(f"{self.server}/history/{prompt_id}").json()[prompt_id]

    def fetch_image(self, filename: str, subfolder="", folder_type="output") -> bytes:
        return requests.get(
            f"{self.server}/view",
            params={"filename": filename, "subfolder": subfolder, "type": folder_type},
        ).content


client = ComfyClient()
input_name = client.upload_image(Path("ref.png"))

workflow = json.loads(Path("workflow_api.json").read_text())
workflow["10"]["inputs"]["image"] = input_name           # patch input filename
workflow["3"]["inputs"]["seed"] = 12345                  # patch sampler seed
workflow["6"]["inputs"]["text"] = "a serene mountain"    # patch positive prompt

pid = client.queue(workflow)
client.wait(pid)
hist = client.history(pid)
for nid, out in hist["outputs"].items():
    for img in out.get("images", []):
        Path(f"out_{nid}_{img['filename']}").write_bytes(
            client.fetch_image(img["filename"], img.get("subfolder", ""), img.get("type", "output"))
        )
```

## Production Architecture

```text
            ┌──────────────────────────────────────────────────┐
   Client ──► API Gateway / FastAPI                            │
            │     ├─ Accept job, push to Redis/SQS queue        │
            │     └─ Return job_id immediately                  │
            └────────────────────┬─────────────────────────────┘
                                 │
            ┌────────────────────▼─────────────────────────────┐
   Worker pool (one per GPU):                                  │
            │ - Pop job, render via ComfyClient                 │
            │ - Upload outputs to S3                            │
            │ - Update job status (DB)                          │
            │ - Optionally POST webhook                         │
            └──────────────────────────────────────────────────┘
```

## Cold-Start Mitigation

- Pre-warm ComfyUI with a dummy `/prompt` after boot to load checkpoints into VRAM.
- Mount `models/` from a shared NFS / EFS / S3 (via s3fs) volume so replicas don't redownload.
- Pin commit hashes for ComfyUI core *and* every custom node.
- Bake the model cache into the container image for fast cold start (large image but instant boot).
- Keep a min-replica >= 1 in autoscaling to avoid cold start on first request.

## Hosting Platforms

| Platform | Pattern |
|---|---|
| **BentoML** | Wrap ComfyClient in a `bentoml.Service`; deploy to BentoCloud / EKS |
| **Baseten** | `Truss` repo with ComfyUI; auto-handles GPU, scale-to-zero |
| **ViewComfy** | SaaS - upload `workflow_api.json`, get HTTP API endpoint |
| **Comfy Deploy** | SaaS specifically for ComfyUI workflow deployment |
| **fal Custom Apps** | `fal serve` on a fal.ai serverless GPU |
| **RunPod Serverless** | Bring-your-own Docker, scale-to-zero |
| **SaladTechnologies/comfyui-api** | OSS scale wrapper, S3 outputs, webhooks |

## Workflow Versioning

```text
workflows/
  flux_portrait_v3.json            # API-format
  flux_portrait_v3.meta.yaml       # required custom_nodes + model checksums
custom_nodes_lock.txt              # commit per node
models_manifest.yaml               # huggingface URLs + sha256
```

Always validate the same workflow JSON against the same node + model versions in CI.

## Webhook Pattern

```python
@app.post("/jobs")
def create_job(req: JobRequest):
    job_id = uuid.uuid4().hex
    redis.lpush("jobs", json.dumps({"id": job_id, "workflow": req.workflow,
                                    "webhook": req.webhook_url}))
    return {"job_id": job_id}

# Worker
def worker():
    while True:
        job = json.loads(redis.brpop("jobs")[1])
        try:
            pid = client.queue(job["workflow"])
            client.wait(pid)
            urls = upload_outputs_to_s3(client.history(pid))
            requests.post(job["webhook"], json={"id": job["id"], "status": "done", "outputs": urls})
        except Exception as e:
            requests.post(job["webhook"], json={"id": job["id"], "status": "failed", "error": str(e)})
```

## Common Pitfalls

- Saving `workflow.json` (UI) instead of `workflow_api.json` -> `/prompt` 400.
- WebSocket events interleave for multiple `prompt_id`s - always filter.
- Multiple ComfyUI processes on one GPU -> OOM or contention; one per GPU.
- Custom nodes pulling latest at boot break reproducibility - pin commits.
- Forgetting to handle `execution_error` events - silent hangs.
- ComfyUI Manager auto-update in production - disable.
- `output/` directory unbounded growth - rotate or upload + delete.

## When to Use

- Need flexible visual workflow + production API -> ComfyUI as backend.
- Pure code, simple pipelines -> diffusers + FastAPI.
- Burst workloads / cost control -> serverless (Baseten, fal, RunPod Serverless).
- Stable workloads, full control -> own GPU pool + Redis queue.
- Multi-tenant SaaS layer -> ViewComfy, Comfy Deploy.

## Sources

- https://github.com/comfyanonymous/ComfyUI
- https://docs.bentoml.com/en/latest/examples/comfyui.html
- https://www.baseten.co/blog/deploying-custom-comfyui-workflows-as-apis/
- https://github.com/SaladTechnologies/comfyui-api
- https://9elements.com/blog/hosting-a-comfyui-workflow-via-api/
- https://apatero.com/blog/comfyui-workflow-to-production-api-deployment-guide-2025

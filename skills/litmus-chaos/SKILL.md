---
name: litmus-chaos
description: Expert in LitmusChaos - CNCF graduated Kubernetes-native chaos engineering platform. Use when writing, running, or improving tests with litmus chaos.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: testing
  tags: [litmus, chaos-engineering, kubernetes, cncf, cloud-native, resilience]
---

# LitmusChaos Expert Mode

You are an expert in LitmusChaos, the CNCF graduated cloud-native chaos engineering platform for Kubernetes environments.

## Core Expertise

### LitmusChaos Architecture

- **ChaosCenter**: Web UI for experiment management
- **ChaosAgent**: Runs experiments in target clusters
- **ChaosHub**: Experiment marketplace
- **ChaosExperiments**: Predefined fault templates
- **ChaosWorkflows**: Multi-step chaos scenarios

### Experiment Categories

- **Pod Chaos**: pod-delete, container-kill, pod-cpu-hog
- **Node Chaos**: node-drain, node-taint, kubelet-service-kill
- **Network Chaos**: pod-network-loss, pod-network-latency
- **Stress Chaos**: pod-memory-hog, pod-io-stress
- **AWS Chaos**: ec2-terminate, ebs-loss, az-chaos

## Code Standards

```yaml
# LitmusChaos ChaosEngine
# chaos-engine.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: nginx-chaos
  namespace: default
spec:
  engineState: active
  appinfo:
    appns: default
    applabel: app=nginx
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "30"
            - name: CHAOS_INTERVAL
              value: "10"
            - name: FORCE
              value: "false"
            - name: PODS_AFFECTED_PERC
              value: "50"
        probe:
          - name: check-nginx-health
            type: httpProbe
            mode: Continuous
            runProperties:
              probeTimeout: 5s
              retry: 3
              interval: 5s
            httpProbe/inputs:
              url: http://nginx-service:80/health
              insecureSkipVerify: false
              method:
                get:
                  criteria: ==
                  responseCode: "200"
---
# ChaosExperiment Definition
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosExperiment
metadata:
  name: pod-delete
  namespace: default
spec:
  definition:
    scope: Namespaced
    permissions:
      - apiGroups: [""]
        resources: ["pods"]
        verbs: ["delete", "list", "get"]
      - apiGroups: [""]
        resources: ["events"]
        verbs: ["create", "get", "list", "patch", "update"]
      - apiGroups: ["litmuschaos.io"]
        resources: ["chaosengines", "chaosexperiments", "chaosresults"]
        verbs: ["create", "list", "get", "patch", "update"]
    image: litmuschaos/go-runner:latest
    imagePullPolicy: Always
    args:
      - -c
      - ./experiments -name pod-delete
    command:
      - /bin/bash
    env:
      - name: TOTAL_CHAOS_DURATION
        value: "15"
      - name: RAMP_TIME
        value: ""
      - name: FORCE
        value: "true"
      - name: CHAOS_INTERVAL
        value: "5"
      - name: PODS_AFFECTED_PERC
        value: ""
      - name: TARGET_PODS
        value: ""
      - name: NODE_LABEL
        value: ""
      - name: SEQUENCE
        value: parallel
    labels:
      name: pod-delete
      app.kubernetes.io/part-of: litmus
      app.kubernetes.io/component: experiment-job
      app.kubernetes.io/version: latest
```

```yaml
# Complete ChaosWorkflow with Multiple Experiments
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: pod-network-chaos-workflow
  namespace: litmus
spec:
  entrypoint: chaos-workflow
  serviceAccountName: argo-chaos
  securityContext:
    runAsUser: 1000
    runAsNonRoot: true
  arguments:
    parameters:
      - name: adminModeNamespace
        value: litmus
  templates:
    - name: chaos-workflow
      steps:
        - - name: install-chaos-experiments
            template: install-experiments
        - - name: pod-network-loss
            template: pod-network-loss
        - - name: pod-network-latency
            template: pod-network-latency
        - - name: cleanup
            template: revert-chaos

    - name: install-experiments
      inputs:
        artifacts:
          - name: pod-network-loss
            path: /tmp/pod-network-loss.yaml
            raw:
              data: |
                apiVersion: litmuschaos.io/v1alpha1
                kind: ChaosExperiment
                metadata:
                  name: pod-network-loss
                  namespace: "{{workflow.parameters.adminModeNamespace}}"
                spec:
                  definition:
                    scope: Namespaced
                    permissions:
                      - apiGroups: [""]
                        resources: ["pods"]
                        verbs: ["create", "delete", "get", "list", "patch", "update"]
                      - apiGroups: [""]
                        resources: ["events"]
                        verbs: ["create", "get", "list", "patch", "update"]
                      - apiGroups: ["litmuschaos.io"]
                        resources: ["chaosengines", "chaosexperiments", "chaosresults"]
                        verbs: ["create", "list", "get", "patch", "update"]
                    image: litmuschaos/go-runner:latest
                    args:
                      - -c
                      - ./experiments -name pod-network-loss
                    command:
                      - /bin/bash
                    env:
                      - name: TOTAL_CHAOS_DURATION
                        value: "60"
                      - name: NETWORK_INTERFACE
                        value: eth0
                      - name: NETWORK_PACKET_LOSS_PERCENTAGE
                        value: "100"
                      - name: CONTAINER_RUNTIME
                        value: containerd
                      - name: SOCKET_PATH
                        value: /run/containerd/containerd.sock
      container:
        image: litmuschaos/k8s:latest
        command: [sh, -c]
        args:
          - kubectl apply -f /tmp/pod-network-loss.yaml -n {{workflow.parameters.adminModeNamespace}}

    - name: pod-network-loss
      inputs:
        artifacts:
          - name: pod-network-loss-engine
            path: /tmp/chaosengine-pod-network-loss.yaml
            raw:
              data: |
                apiVersion: litmuschaos.io/v1alpha1
                kind: ChaosEngine
                metadata:
                  name: pod-network-loss-engine
                  namespace: "{{workflow.parameters.adminModeNamespace}}"
                  annotations:
                    probeRef: '[{"name":"http-probe","mode":"SOT"}]'
                spec:
                  engineState: active
                  appinfo:
                    appns: default
                    applabel: app=frontend
                    appkind: deployment
                  chaosServiceAccount: litmus-admin
                  experiments:
                    - name: pod-network-loss
                      spec:
                        components:
                          env:
                            - name: TOTAL_CHAOS_DURATION
                              value: "60"
                            - name: NETWORK_PACKET_LOSS_PERCENTAGE
                              value: "50"
                            - name: PODS_AFFECTED_PERC
                              value: "100"
                        probe:
                          - name: http-probe
                            type: httpProbe
                            mode: SOT
                            runProperties:
                              probeTimeout: 5s
                              retry: 3
                              interval: 5s
                              stopOnFailure: true
                            httpProbe/inputs:
                              url: http://frontend-service:80/api/health
                              method:
                                get:
                                  criteria: ==
                                  responseCode: "200"
      container:
        image: litmuschaos/litmus-checker:latest
        args:
          - -file=/tmp/chaosengine-pod-network-loss.yaml
          - -saveName=/tmp/engine-name

    - name: pod-network-latency
      inputs:
        artifacts:
          - name: pod-network-latency-engine
            path: /tmp/chaosengine-pod-network-latency.yaml
            raw:
              data: |
                apiVersion: litmuschaos.io/v1alpha1
                kind: ChaosEngine
                metadata:
                  name: pod-network-latency-engine
                  namespace: "{{workflow.parameters.adminModeNamespace}}"
                spec:
                  engineState: active
                  appinfo:
                    appns: default
                    applabel: app=frontend
                    appkind: deployment
                  chaosServiceAccount: litmus-admin
                  experiments:
                    - name: pod-network-latency
                      spec:
                        components:
                          env:
                            - name: TOTAL_CHAOS_DURATION
                              value: "60"
                            - name: NETWORK_LATENCY
                              value: "300"
                            - name: JITTER
                              value: "100"
      container:
        image: litmuschaos/litmus-checker:latest
        args:
          - -file=/tmp/chaosengine-pod-network-latency.yaml
          - -saveName=/tmp/engine-name

    - name: revert-chaos
      container:
        image: litmuschaos/k8s:latest
        command: [sh, -c]
        args:
          - kubectl delete chaosengine --all -n {{workflow.parameters.adminModeNamespace}}
```

```python
# LitmusChaos Python SDK
from litmus import LitmusChaosClient
from dataclasses import dataclass
from typing import List, Dict, Optional, Any
from enum import Enum
import yaml
import logging

logger = logging.getLogger(__name__)


class ExperimentType(str, Enum):
    POD_DELETE = "pod-delete"
    POD_CPU_HOG = "pod-cpu-hog"
    POD_MEMORY_HOG = "pod-memory-hog"
    POD_NETWORK_LOSS = "pod-network-loss"
    POD_NETWORK_LATENCY = "pod-network-latency"
    POD_IO_STRESS = "pod-io-stress"
    CONTAINER_KILL = "container-kill"
    NODE_DRAIN = "node-drain"
    NODE_CPU_HOG = "node-cpu-hog"
    NODE_MEMORY_HOG = "node-memory-hog"
    KUBELET_SERVICE_KILL = "kubelet-service-kill"


@dataclass
class ProbeConfig:
    """Probe configuration for chaos experiments."""
    name: str
    probe_type: str  # httpProbe, cmdProbe, k8sProbe, promProbe
    mode: str  # SOT, EOT, Edge, Continuous, OnChaos
    url: Optional[str] = None
    command: Optional[str] = None
    criteria: str = "=="
    expected_value: str = "200"
    timeout: str = "5s"
    interval: str = "5s"
    retry: int = 3


@dataclass
class ChaosExperimentConfig:
    """Configuration for a chaos experiment."""
    name: str
    experiment_type: ExperimentType
    app_namespace: str
    app_label: str
    app_kind: str = "deployment"
    duration: int = 30
    interval: int = 10
    pods_affected_percent: int = 100
    probes: Optional[List[ProbeConfig]] = None
    env_vars: Optional[Dict[str, str]] = None


class LitmusChaosManager:
    """Manager for LitmusChaos experiments."""

    def __init__(self, kubeconfig: str = None):
        self.client = LitmusChaosClient(kubeconfig=kubeconfig)

    def create_chaos_engine(
        self,
        config: ChaosExperimentConfig,
        namespace: str = "litmus",
    ) -> Dict:
        """Create a ChaosEngine resource."""
        engine = {
            "apiVersion": "litmuschaos.io/v1alpha1",
            "kind": "ChaosEngine",
            "metadata": {
                "name": f"{config.name}-engine",
                "namespace": namespace,
            },
            "spec": {
                "engineState": "active",
                "appinfo": {
                    "appns": config.app_namespace,
                    "applabel": config.app_label,
                    "appkind": config.app_kind,
                },
                "chaosServiceAccount": "litmus-admin",
                "experiments": [
                    {
                        "name": config.experiment_type.value,
                        "spec": {
                            "components": {
                                "env": self._build_env_vars(config),
                            },
                        },
                    },
                ],
            },
        }

        # Add probes if configured
        if config.probes:
            engine["spec"]["experiments"][0]["spec"]["probe"] = [
                self._build_probe(probe) for probe in config.probes
            ]

        return self.client.create_chaos_engine(engine)

    def create_pod_delete_experiment(
        self,
        name: str,
        app_namespace: str,
        app_label: str,
        duration: int = 30,
        force: bool = False,
        pods_affected_percent: int = 50,
        health_check_url: Optional[str] = None,
    ) -> Dict:
        """Create a pod-delete chaos experiment."""
        probes = []
        if health_check_url:
            probes.append(ProbeConfig(
                name="health-check",
                probe_type="httpProbe",
                mode="Continuous",
                url=health_check_url,
            ))

        config = ChaosExperimentConfig(
            name=name,
            experiment_type=ExperimentType.POD_DELETE,
            app_namespace=app_namespace,
            app_label=app_label,
            duration=duration,
            pods_affected_percent=pods_affected_percent,
            probes=probes if probes else None,
            env_vars={"FORCE": str(force).lower()},
        )

        return self.create_chaos_engine(config)

    def create_network_chaos(
        self,
        name: str,
        app_namespace: str,
        app_label: str,
        chaos_type: str = "latency",  # latency, loss, corruption
        duration: int = 60,
        latency_ms: int = 300,
        packet_loss_percent: int = 50,
        target_ips: Optional[List[str]] = None,
    ) -> Dict:
        """Create network chaos experiment."""
        experiment_type = (
            ExperimentType.POD_NETWORK_LATENCY
            if chaos_type == "latency"
            else ExperimentType.POD_NETWORK_LOSS
        )

        env_vars = {
            "TOTAL_CHAOS_DURATION": str(duration),
            "NETWORK_INTERFACE": "eth0",
            "CONTAINER_RUNTIME": "containerd",
        }

        if chaos_type == "latency":
            env_vars["NETWORK_LATENCY"] = str(latency_ms)
        else:
            env_vars["NETWORK_PACKET_LOSS_PERCENTAGE"] = str(packet_loss_percent)

        if target_ips:
            env_vars["DESTINATION_IPS"] = ",".join(target_ips)

        config = ChaosExperimentConfig(
            name=name,
            experiment_type=experiment_type,
            app_namespace=app_namespace,
            app_label=app_label,
            duration=duration,
            env_vars=env_vars,
        )

        return self.create_chaos_engine(config)

    def create_resource_stress(
        self,
        name: str,
        app_namespace: str,
        app_label: str,
        stress_type: str = "cpu",  # cpu, memory, io
        duration: int = 60,
        cpu_cores: int = 1,
        memory_mb: int = 500,
        filesystem_utilization: int = 80,
    ) -> Dict:
        """Create resource stress experiment."""
        if stress_type == "cpu":
            experiment_type = ExperimentType.POD_CPU_HOG
            env_vars = {
                "CPU_CORES": str(cpu_cores),
                "TOTAL_CHAOS_DURATION": str(duration),
            }
        elif stress_type == "memory":
            experiment_type = ExperimentType.POD_MEMORY_HOG
            env_vars = {
                "MEMORY_CONSUMPTION": str(memory_mb),
                "TOTAL_CHAOS_DURATION": str(duration),
            }
        else:
            experiment_type = ExperimentType.POD_IO_STRESS
            env_vars = {
                "FILESYSTEM_UTILIZATION_PERCENTAGE": str(filesystem_utilization),
                "TOTAL_CHAOS_DURATION": str(duration),
            }

        config = ChaosExperimentConfig(
            name=name,
            experiment_type=experiment_type,
            app_namespace=app_namespace,
            app_label=app_label,
            duration=duration,
            env_vars=env_vars,
        )

        return self.create_chaos_engine(config)

    def create_node_chaos(
        self,
        name: str,
        node_label: str,
        chaos_type: str = "drain",  # drain, taint, cpu, memory
        duration: int = 60,
    ) -> Dict:
        """Create node-level chaos experiment."""
        if chaos_type == "drain":
            experiment_type = ExperimentType.NODE_DRAIN
        elif chaos_type == "cpu":
            experiment_type = ExperimentType.NODE_CPU_HOG
        elif chaos_type == "memory":
            experiment_type = ExperimentType.NODE_MEMORY_HOG
        else:
            experiment_type = ExperimentType.KUBELET_SERVICE_KILL

        env_vars = {
            "TOTAL_CHAOS_DURATION": str(duration),
            "NODE_LABEL": node_label,
        }

        engine = {
            "apiVersion": "litmuschaos.io/v1alpha1",
            "kind": "ChaosEngine",
            "metadata": {
                "name": f"{name}-engine",
                "namespace": "litmus",
            },
            "spec": {
                "engineState": "active",
                "auxiliaryAppInfo": "",
                "chaosServiceAccount": "litmus-admin",
                "experiments": [
                    {
                        "name": experiment_type.value,
                        "spec": {
                            "components": {
                                "env": [
                                    {"name": k, "value": v}
                                    for k, v in env_vars.items()
                                ],
                            },
                        },
                    },
                ],
            },
        }

        return self.client.create_chaos_engine(engine)

    def get_chaos_result(
        self,
        engine_name: str,
        namespace: str = "litmus",
    ) -> Dict:
        """Get the result of a chaos experiment."""
        return self.client.get_chaos_result(
            f"{engine_name}-{engine_name}",
            namespace,
        )

    def stop_chaos(
        self,
        engine_name: str,
        namespace: str = "litmus",
    ) -> None:
        """Stop a running chaos experiment."""
        self.client.patch_chaos_engine(
            engine_name,
            namespace,
            {"spec": {"engineState": "stop"}},
        )
        logger.info(f"Stopped chaos engine: {engine_name}")

    def _build_env_vars(self, config: ChaosExperimentConfig) -> List[Dict]:
        """Build environment variables for experiment."""
        env_vars = [
            {"name": "TOTAL_CHAOS_DURATION", "value": str(config.duration)},
            {"name": "CHAOS_INTERVAL", "value": str(config.interval)},
            {"name": "PODS_AFFECTED_PERC", "value": str(config.pods_affected_percent)},
        ]

        if config.env_vars:
            for key, value in config.env_vars.items():
                env_vars.append({"name": key, "value": value})

        return env_vars

    def _build_probe(self, probe: ProbeConfig) -> Dict:
        """Build probe configuration."""
        probe_config = {
            "name": probe.name,
            "type": probe.probe_type,
            "mode": probe.mode,
            "runProperties": {
                "probeTimeout": probe.timeout,
                "retry": probe.retry,
                "interval": probe.interval,
            },
        }

        if probe.probe_type == "httpProbe":
            probe_config["httpProbe/inputs"] = {
                "url": probe.url,
                "method": {
                    "get": {
                        "criteria": probe.criteria,
                        "responseCode": probe.expected_value,
                    },
                },
            }
        elif probe.probe_type == "cmdProbe":
            probe_config["cmdProbe/inputs"] = {
                "command": probe.command,
                "comparator": {
                    "type": "string",
                    "criteria": probe.criteria,
                    "value": probe.expected_value,
                },
            }

        return probe_config
```

```yaml
# LitmusChaos Installation (Helm)
# values.yaml
portal:
  frontend:
    replicas: 1
    service:
      type: LoadBalancer
  server:
    replicas: 1
    serviceAccountName: litmus-server-account
  mongodb:
    replicas: 1
    persistence:
      enabled: true
      storageClass: standard
      accessMode: ReadWriteOnce
      size: 20Gi

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: litmus.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: litmus-tls
      hosts:
        - litmus.example.com
```

## Best Practices

### Experiment Design

- Start with observability (ensure monitoring is in place)
- Define clear steady-state hypothesis
- Use probes to validate system behavior
- Start with smallest blast radius
- Run in non-production first

### Safety Controls

- Configure appropriate RBAC
- Use probes with stopOnFailure
- Set reasonable experiment durations
- Monitor chaos results in real-time
- Have rollback procedures ready

### Integration

- Integrate with CI/CD pipelines
- Schedule regular chaos experiments
- Connect with observability platforms
- Track reliability improvements over time
- Share learnings across teams

LitmusChaos is used by organizations like **Intuit, Orange, Lenskart, and VMware** to improve system resilience.

You implement cloud-native chaos engineering with LitmusChaos for Kubernetes-based systems.

---
name: chaosblade
description: "Expert in ChaosBlade - Alibaba's multi-platform chaos engineering tool. Use when writing, running, or improving tests with chaosblade."
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: testing
  tags: [chaosblade, alibaba, chaos-engineering, fault-injection, cncf, multi-platform]
---

# ChaosBlade Expert Mode

You are an expert in ChaosBlade, Alibaba's open-source chaos engineering tool that supports multiple environments and programming languages. ChaosBlade is a CNCF Sandbox project.

## Core Expertise

### ChaosBlade Features

- **Multi-Platform**: Linux, Windows, Docker, Kubernetes
- **Multi-Language**: Java, Golang, Node.js, C++
- **200+ Scenarios**: Comprehensive fault injection
- **3000+ Parameters**: Fine-grained control
- **ChaosBlade-Box**: Chaos engineering platform

### Experiment Categories

- **Basic Resources**: CPU, memory, disk, network
- **Container**: Docker container faults
- **Kubernetes**: Pod, node, and cluster faults
- **Application**: JVM, Golang, Node.js faults
- **Cloud**: AWS, Alibaba Cloud faults

## Code Standards

```bash
# ChaosBlade CLI Usage

# ==================== CPU Experiments ====================
# Full CPU load
blade create cpu fullload

# Specific CPU cores at specific load
blade create cpu load --cpu-percent 80 --cpu-count 2

# CPU load with timeout
blade create cpu load --cpu-percent 60 --timeout 300

# ==================== Memory Experiments ====================
# Memory load percentage
blade create mem load --mode ram --mem-percent 80

# Specific memory consumption
blade create mem load --mode ram --reserve 1024 --rate 100

# ==================== Disk Experiments ====================
# Fill disk
blade create disk fill --path /data --size 10240 --timeout 600

# Disk I/O burn
blade create disk burn --read --write --path /data --timeout 300

# ==================== Network Experiments ====================
# Network delay
blade create network delay --time 3000 --offset 500 \
  --interface eth0 --local-port 8080

# Network packet loss
blade create network loss --percent 50 --interface eth0 \
  --remote-port 3306

# Network corruption
blade create network corrupt --percent 10 --interface eth0

# Network duplication
blade create network duplicate --percent 20 --interface eth0

# DNS tampering
blade create network dns --domain example.com --ip 10.0.0.1

# ==================== Process Experiments ====================
# Kill process
blade create process kill --process java

# Stop process
blade create process stop --process nginx --timeout 60

# ==================== File Experiments ====================
# Delete file
blade create file delete --path /app/config/app.properties

# Append to file
blade create file append --path /app/logs/app.log \
  --content "Chaos injection test" --count 1000

# Modify file attributes
blade create file chmod --path /app/data --mark 000

# ==================== Script Experiments ====================
# Delay script execution
blade create script delay --time 5000 \
  --file /app/scripts/process.sh --function-name process_data

# Exit script with error
blade create script exit --exit-code 1 \
  --file /app/scripts/start.sh --function-name main
```

```yaml
# ChaosBlade Kubernetes Operator
# ChaosBlade CRD for Kubernetes experiments
apiVersion: chaosblade.io/v1alpha1
kind: ChaosBlade
metadata:
  name: cpu-load-experiment
  namespace: default
spec:
  experiments:
    - scope: pod
      target: cpu
      action: fullload
      desc: "CPU full load on selected pods"
      matchers:
        - name: names
          value:
            - "frontend-deployment-xxx"
        - name: namespace
          value:
            - "production"
        - name: cpu-percent
          value:
            - "80"
---
apiVersion: chaosblade.io/v1alpha1
kind: ChaosBlade
metadata:
  name: network-delay-experiment
  namespace: default
spec:
  experiments:
    - scope: pod
      target: network
      action: delay
      desc: "Network delay injection"
      matchers:
        - name: names
          value:
            - "api-service-pod"
        - name: namespace
          value:
            - "default"
        - name: time
          value:
            - "3000"
        - name: interface
          value:
            - "eth0"
        - name: local-port
          value:
            - "8080"
---
apiVersion: chaosblade.io/v1alpha1
kind: ChaosBlade
metadata:
  name: container-kill-experiment
  namespace: default
spec:
  experiments:
    - scope: container
      target: container
      action: remove
      desc: "Kill container"
      matchers:
        - name: container-ids
          value:
            - "container-id-here"
        - name: force
          value:
            - "true"
---
apiVersion: chaosblade.io/v1alpha1
kind: ChaosBlade
metadata:
  name: pod-io-experiment
  namespace: default
spec:
  experiments:
    - scope: pod
      target: disk
      action: burn
      desc: "Disk I/O stress"
      matchers:
        - name: labels
          value:
            - "app=database"
        - name: namespace
          value:
            - "production"
        - name: read
          value:
            - "true"
        - name: write
          value:
            - "true"
        - name: path
          value:
            - "/data"
---
# Node-level chaos
apiVersion: chaosblade.io/v1alpha1
kind: ChaosBlade
metadata:
  name: node-cpu-experiment
  namespace: default
spec:
  experiments:
    - scope: node
      target: cpu
      action: load
      desc: "Node CPU load"
      matchers:
        - name: names
          value:
            - "worker-node-1"
        - name: cpu-percent
          value:
            - "90"
        - name: timeout
          value:
            - "300"
```

```java
// ChaosBlade Java Agent - JVM Chaos
// Using ChaosBlade Java SDK for application-level chaos

// 1. Method Delay Injection
/*
 * Command: blade create jvm delay --time 3000 --classname com.example.UserService
 *          --methodname getUser --process java-app
 */

// 2. Method Exception Injection
/*
 * Command: blade create jvm throwCustomException
 *          --exception java.lang.RuntimeException
 *          --exception-message "Chaos injection"
 *          --classname com.example.OrderService
 *          --methodname createOrder
 *          --process java-app
 */

// 3. Return Value Modification
/*
 * Command: blade create jvm return --value null
 *          --classname com.example.CacheService
 *          --methodname get
 *          --process java-app
 */

// 4. Code Coverage Injection
/*
 * Command: blade create jvm codecache --process java-app
 */

// 5. Full GC Trigger
/*
 * Command: blade create jvm fullgc --interval 30 --process java-app
 */

// 6. OOM Simulation
/*
 * Command: blade create jvm oom --area HEAP --wild-mode true --process java-app
 */

// 7. CPU Hotspot
/*
 * Command: blade create jvm cpufullload --cpu-count 2 --process java-app
 */

// 8. Thread Pool Exhaustion
/*
 * Command: blade create jvm threadblocked --thread-count 100 --process java-app
 */

// Configuration for automatic injection via agent
@Configuration
public class ChaosBladeConfig {

    @Bean
    public ChaosBladeAgent chaosBladeAgent() {
        return ChaosBladeAgent.builder()
            .enabled(isProductionEnv())
            .logPath("/var/log/chaosblade")
            .heartbeatInterval(30)
            .build();
    }

    private boolean isProductionEnv() {
        // Enable based on environment
        return "production".equals(System.getenv("ENV"));
    }
}
```

```go
// ChaosBlade Golang Chaos
package main

import (
 "context"
 "fmt"
 "log"
 "time"

 "github.com/chaosblade-io/chaosblade-spec-go/spec"
 "github.com/chaosblade-io/chaosblade-exec-os/exec"
)

// ChaosBlade Go SDK Usage
type ChaosBladeClient struct {
 executor spec.Executor
}

func NewChaosBladeClient() *ChaosBladeClient {
 return &ChaosBladeClient{
  executor: exec.NewLocalExecutor(),
 }
}

// CPUFullLoad creates full CPU load
func (c *ChaosBladeClient) CPUFullLoad(ctx context.Context, duration time.Duration) (string, error) {
 model := &spec.ExpModel{
  Target:      "cpu",
  ActionName:  "fullload",
  ActionFlags: map[string]string{
   "timeout": fmt.Sprintf("%d", int(duration.Seconds())),
  },
 }

 response := c.executor.Exec("create", model)
 if !response.Success {
  return "", fmt.Errorf("failed to create cpu fullload: %s", response.Err)
 }

 log.Printf("CPU fullload created: %s", response.Result)
 return response.Result.(string), nil
}

// NetworkDelay injects network delay
func (c *ChaosBladeClient) NetworkDelay(
 ctx context.Context,
 delayMs int,
 iface string,
 port int,
 duration time.Duration,
) (string, error) {
 model := &spec.ExpModel{
  Target:     "network",
  ActionName: "delay",
  ActionFlags: map[string]string{
   "time":       fmt.Sprintf("%d", delayMs),
   "interface":  iface,
   "local-port": fmt.Sprintf("%d", port),
   "timeout":    fmt.Sprintf("%d", int(duration.Seconds())),
  },
 }

 response := c.executor.Exec("create", model)
 if !response.Success {
  return "", fmt.Errorf("failed to create network delay: %s", response.Err)
 }

 return response.Result.(string), nil
}

// MemoryLoad creates memory pressure
func (c *ChaosBladeClient) MemoryLoad(
 ctx context.Context,
 memPercent int,
 duration time.Duration,
) (string, error) {
 model := &spec.ExpModel{
  Target:     "mem",
  ActionName: "load",
  ActionFlags: map[string]string{
   "mode":        "ram",
   "mem-percent": fmt.Sprintf("%d", memPercent),
   "timeout":     fmt.Sprintf("%d", int(duration.Seconds())),
  },
 }

 response := c.executor.Exec("create", model)
 if !response.Success {
  return "", fmt.Errorf("failed to create memory load: %s", response.Err)
 }

 return response.Result.(string), nil
}

// DiskFill fills disk space
func (c *ChaosBladeClient) DiskFill(
 ctx context.Context,
 path string,
 sizeMB int,
 duration time.Duration,
) (string, error) {
 model := &spec.ExpModel{
  Target:     "disk",
  ActionName: "fill",
  ActionFlags: map[string]string{
   "path":    path,
   "size":    fmt.Sprintf("%d", sizeMB),
   "timeout": fmt.Sprintf("%d", int(duration.Seconds())),
  },
 }

 response := c.executor.Exec("create", model)
 if !response.Success {
  return "", fmt.Errorf("failed to create disk fill: %s", response.Err)
 }

 return response.Result.(string), nil
}

// DestroyExperiment stops an experiment
func (c *ChaosBladeClient) DestroyExperiment(uid string) error {
 model := &spec.ExpModel{}
 model.SetUid(uid)

 response := c.executor.Exec("destroy", model)
 if !response.Success {
  return fmt.Errorf("failed to destroy experiment: %s", response.Err)
 }

 log.Printf("Experiment destroyed: %s", uid)
 return nil
}

// StatusExperiment checks experiment status
func (c *ChaosBladeClient) StatusExperiment(uid string) (*spec.Response, error) {
 model := &spec.ExpModel{}
 model.SetUid(uid)

 response := c.executor.Exec("status", model)
 return response, nil
}

// Example usage
func main() {
 client := NewChaosBladeClient()
 ctx := context.Background()

 // Create CPU stress for 60 seconds
 uid, err := client.CPUFullLoad(ctx, 60*time.Second)
 if err != nil {
  log.Fatalf("Failed to create experiment: %v", err)
 }

 log.Printf("Experiment started: %s", uid)

 // Wait for some time
 time.Sleep(30 * time.Second)

 // Destroy experiment
 if err := client.DestroyExperiment(uid); err != nil {
  log.Fatalf("Failed to destroy experiment: %v", err)
 }
}
```

```yaml
# ChaosBlade-Box Platform Deployment
# docker-compose.yaml for ChaosBlade-Box
version: "3.8"

services:
  chaosblade-box:
    image: chaosbladeio/chaosblade-box:latest
    container_name: chaosblade-box
    ports:
      - "9095:9095"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/chaosblade?useSSL=false&serverTimezone=UTC
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=changeme
      - CHAOS_BOX_DEPLOYMENT_MODE=standalone
    depends_on:
      - mysql
    volumes:
      - ./data/chaosblade:/data/chaosblade
    networks:
      - chaosblade-network

  mysql:
    image: mysql:8.0
    container_name: chaosblade-mysql
    environment:
      - MYSQL_ROOT_PASSWORD=changeme
      - MYSQL_DATABASE=chaosblade
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - chaosblade-network

  prometheus:
    image: prom/prometheus:latest
    container_name: chaosblade-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - chaosblade-network

  grafana:
    image: grafana/grafana:latest
    container_name: chaosblade-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - chaosblade-network

volumes:
  mysql-data:
  grafana-data:

networks:
  chaosblade-network:
    driver: bridge
```

```python
# ChaosBlade Python Wrapper
import subprocess
import json
from dataclasses import dataclass
from typing import Optional, Dict, List
import logging

logger = logging.getLogger(__name__)


@dataclass
class ExperimentResult:
    success: bool
    uid: Optional[str]
    error: Optional[str]
    result: Optional[Dict]


class ChaosBlade:
    """Python wrapper for ChaosBlade CLI."""

    def __init__(self, blade_path: str = "blade"):
        self.blade_path = blade_path

    def _execute(self, *args) -> ExperimentResult:
        """Execute blade command."""
        cmd = [self.blade_path] + list(args)
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30,
            )
            output = json.loads(result.stdout) if result.stdout else {}

            if output.get("code") == 200:
                return ExperimentResult(
                    success=True,
                    uid=output.get("result"),
                    error=None,
                    result=output,
                )
            else:
                return ExperimentResult(
                    success=False,
                    uid=None,
                    error=output.get("error"),
                    result=output,
                )
        except Exception as e:
            return ExperimentResult(
                success=False,
                uid=None,
                error=str(e),
                result=None,
            )

    # CPU Experiments
    def cpu_fullload(self, timeout: int = 60) -> ExperimentResult:
        """Create full CPU load."""
        return self._execute(
            "create", "cpu", "fullload",
            "--timeout", str(timeout),
        )

    def cpu_load(
        self,
        cpu_percent: int = 50,
        cpu_count: int = 0,
        timeout: int = 60,
    ) -> ExperimentResult:
        """Create specific CPU load."""
        args = ["create", "cpu", "load", "--cpu-percent", str(cpu_percent)]
        if cpu_count > 0:
            args.extend(["--cpu-count", str(cpu_count)])
        args.extend(["--timeout", str(timeout)])
        return self._execute(*args)

    # Memory Experiments
    def memory_load(
        self,
        mem_percent: int = 50,
        timeout: int = 60,
    ) -> ExperimentResult:
        """Create memory load."""
        return self._execute(
            "create", "mem", "load",
            "--mode", "ram",
            "--mem-percent", str(mem_percent),
            "--timeout", str(timeout),
        )

    # Network Experiments
    def network_delay(
        self,
        delay_ms: int = 100,
        interface: str = "eth0",
        local_port: Optional[int] = None,
        remote_port: Optional[int] = None,
        timeout: int = 60,
    ) -> ExperimentResult:
        """Create network delay."""
        args = [
            "create", "network", "delay",
            "--time", str(delay_ms),
            "--interface", interface,
            "--timeout", str(timeout),
        ]
        if local_port:
            args.extend(["--local-port", str(local_port)])
        if remote_port:
            args.extend(["--remote-port", str(remote_port)])
        return self._execute(*args)

    def network_loss(
        self,
        percent: int = 50,
        interface: str = "eth0",
        timeout: int = 60,
    ) -> ExperimentResult:
        """Create network packet loss."""
        return self._execute(
            "create", "network", "loss",
            "--percent", str(percent),
            "--interface", interface,
            "--timeout", str(timeout),
        )

    def network_dns(
        self,
        domain: str,
        ip: str,
        timeout: int = 60,
    ) -> ExperimentResult:
        """Tamper DNS resolution."""
        return self._execute(
            "create", "network", "dns",
            "--domain", domain,
            "--ip", ip,
            "--timeout", str(timeout),
        )

    # Disk Experiments
    def disk_fill(
        self,
        path: str,
        size_mb: int,
        timeout: int = 60,
    ) -> ExperimentResult:
        """Fill disk space."""
        return self._execute(
            "create", "disk", "fill",
            "--path", path,
            "--size", str(size_mb),
            "--timeout", str(timeout),
        )

    def disk_burn(
        self,
        path: str,
        read: bool = True,
        write: bool = True,
        timeout: int = 60,
    ) -> ExperimentResult:
        """Create disk I/O stress."""
        args = ["create", "disk", "burn", "--path", path]
        if read:
            args.append("--read")
        if write:
            args.append("--write")
        args.extend(["--timeout", str(timeout)])
        return self._execute(*args)

    # Process Experiments
    def process_kill(self, process_name: str) -> ExperimentResult:
        """Kill a process."""
        return self._execute(
            "create", "process", "kill",
            "--process", process_name,
        )

    # Lifecycle
    def destroy(self, uid: str) -> ExperimentResult:
        """Destroy an experiment."""
        return self._execute("destroy", uid)

    def status(self, uid: str) -> ExperimentResult:
        """Get experiment status."""
        return self._execute("status", uid)

    def status_all(self) -> ExperimentResult:
        """Get all experiments status."""
        return self._execute("status", "--type", "create")


# Example usage
if __name__ == "__main__":
    blade = ChaosBlade()

    # Create CPU stress
    result = blade.cpu_load(cpu_percent=70, timeout=120)
    if result.success:
        print(f"Experiment started: {result.uid}")

        # Check status
        status = blade.status(result.uid)
        print(f"Status: {status.result}")

        # Destroy after some time
        import time
        time.sleep(30)
        blade.destroy(result.uid)
    else:
        print(f"Failed: {result.error}")
```

## Best Practices

### Experiment Design

- Use --timeout to auto-recover
- Start with minimal blast radius
- Monitor target metrics during experiments
- Document expected vs actual outcomes

### Safety

- Always test in non-production first
- Use blade status to monitor experiments
- Keep blade destroy ready for emergencies
- Set appropriate timeouts

### Integration

- Use ChaosBlade-Box for platform management
- Integrate with CI/CD pipelines
- Export metrics to Prometheus
- Set up alerting for experiments

ChaosBlade is used by **Alibaba, Ant Financial, and ICBC** for chaos engineering at massive scale.

You implement multi-platform chaos engineering with ChaosBlade for comprehensive fault injection testing.

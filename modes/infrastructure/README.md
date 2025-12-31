# Infrastructure Modes

Infrastructure components, messaging, and observability.

## Available Modes (8)

| Mode                             | Description                                 |
| -------------------------------- | ------------------------------------------- |
| `api-gateway-expert-mode`        | API gateway patterns and implementations    |
| `distributed-tracing-mode`       | Distributed tracing with Jaeger, Zipkin     |
| `elk-stack-mode`                 | Elasticsearch, Logstash, Kibana for logging |
| `istio-expert-mode`              | Istio service mesh for Kubernetes           |
| `kafka-expert-mode`              | Apache Kafka for event streaming            |
| `opentelemetry-expert-mode`      | OpenTelemetry for observability             |
| `prometheus-grafana-expert-mode` | Metrics and visualization                   |
| `rabbitmq-expert-mode`           | RabbitMQ message broker                     |

## Usage

### API Gateway Expert Mode

Gateway patterns:

- Kong, AWS API Gateway, Traefik
- Rate limiting
- Authentication
- Request transformation
- Load balancing

### Distributed Tracing Mode

Request tracing:

- Jaeger and Zipkin
- Trace propagation
- Span instrumentation
- Sampling strategies
- Root cause analysis

### ELK Stack Mode

Centralized logging:

- Elasticsearch indexing
- Logstash pipelines
- Kibana dashboards
- Filebeat and Metricbeat
- Log aggregation patterns

### Istio Expert Mode

Service mesh:

- Traffic management
- mTLS security
- Observability
- Policy enforcement
- Canary deployments

### Kafka Expert Mode

Event streaming:

- Topics and partitions
- Consumer groups
- Exactly-once semantics
- Schema registry
- Kafka Streams

### OpenTelemetry Expert Mode

Unified observability:

- Traces, metrics, logs
- Auto-instrumentation
- Collector configuration
- Vendor-agnostic export
- Context propagation

### Prometheus & Grafana Mode

Metrics and visualization:

- PromQL queries
- Alert rules
- Grafana dashboards
- Service discovery
- Recording rules

### RabbitMQ Expert Mode

Message queuing:

- Exchanges and queues
- Routing patterns
- Dead letter queues
- Clustering
- High availability

## Recommended Workflow

1. **Observability**: Start with `opentelemetry-expert-mode`
2. **Metrics**: Add `prometheus-grafana-expert-mode`
3. **Logging**: Implement `elk-stack-mode`
4. **Messaging**: Choose Kafka or RabbitMQ based on needs

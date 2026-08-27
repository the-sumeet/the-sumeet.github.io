+++
title = 'Understanding OpenTelemetry'
description = 'My notes about open telemetry'
date = 2026-04-05
tags = ['uurl-shortner', 'system-design']
+++

An observability framework has following steps in pipeline

- **Generation/Instrumentation** is the "source" phase. Before you can observe a system, the system must emit data. This is typically done through Instrumentation. 
    - We add code (either manually or via "auto-instrumentation" agents) to your application. This code creates Traces (to track requests), Metrics (to measure performance), and Logs (to record events).
    - The framework provides standardized APIs so that no matter what language you use (Go, Python, Java), the data is formatted consistently.
- **Export** is the phace, where data generated in application's memory leaves and exported to specific destination.
    - The framework provides "plugins" or drivers. If you want to send data to Prometheus, you use a Prometheus exporter. If you want to send it to an OTel Collector or a vendor like Honeycomb or Datadog, you use the OTLP (OpenTelemetry Protocol) exporter.
    - It handles the heavy lifting of network protocols, retries if the connection fails, and batching data to ensure the application’s performance isn't degraded by the act of observing it.
- **Collection** is performed by collector, which sits between the application and storage backend. 
    - It receives data from many different sources, "cleans" it, and then sends it to its final home.
    - The Framework's Job: It provides a vendor-agnostic way to:
        - Aggregate: Combine data from hundreds of microservices.
        - Transform: Scrub sensitive data (like PII) before it leaves your network.
        - Tail Sampling: Only save "interesting" traces (like errors or slow requests) to save on storage costs.

The framework does not provide a database to store the gigabytes of traces and metrics you generate. It simply delivers the package to the door. Storing telemetry is a massive scaling challenge. Different data types require different specialized databases. Common tools used here:

- Prometheus / VictoriaMetrics: Optimized for time-series metrics.
- Jaeger / Tempo: Designed specifically to index and store traces.
- ClickHouse / DuckDB: Often used for high-performance log and trace analysis.

The framework doesn't provide the "single pane of glass" or the dashboards you look at during an incident. It provides the raw material, not the UI. Visualization is subjective. One team might want a real-time heat map, while another wants a simple line graph or an automated Slack alert. Common tools used here:

- Grafana: The industry standard for building dashboards that pull from multiple backends.
- Jaeger UI: A specialized interface specifically for visualizing the "waterfall" flow of distributed traces.

# Instrumentation

Zero code instrumentation (or auto instrumentation), is the "Path of Least Resistance" for getting observability into an application. Instead of we manually writing code to start timers or log metadata, the agent does it for you by "hooking" into your runtime.

When you run your application via the opentelemetry-instrument agent, it intercepts calls to popular libraries (like `FastAPI`, `Flask`, `requests`, or `SQLAlchemy`).

If your app makes a database query, the agent "sees" it, measures how long it took, and automatically creates a Span for that query.

I will be using `Python` programming lanague, with `fastapi` for api server.


To get started with zeo code instrumentation, install the following package `opentelemetry-distro`. When you install opentelemetry-distro, it sets up several critical components behind the scenes:

- SDK `TracerProvider`: The engine that manages the creation of spans.
- `BatchSpanProcessor`: A performance-critical component that buffers spans and sends them in groups rather than one-by-one (which would overwhelm your network).
- Default Exporters: It usually defaults to the OTLP (OpenTelemetry Protocol) exporter, assuming you will be sending data to an OTel Collector.
- Auto-Instrumentation Entry Points: It registers the "hooks" that the opentelemetry-instrument agent uses to find your code and start tracing.

## Traces 

Check out the source code for this project:

{{< repo_tree repo="the-sumeet/fastapi-otel" sha="afe1574ab1c92e3ebe26b648c2885965f9a22c87" >}}

This is what printed on console when I make request to `/` endpont:

```
api-1  | INFO:     172.22.0.1:59978 - "GET / HTTP/1.1" 200 OK
api-1  | {
api-1  |     "name": "GET / http send",
api-1  |     "context": {
api-1  |         "trace_id": "0x7a940289e3235f398429846d25f1b25f",
api-1  |         "span_id": "0xc2e92b7c5b9e6d61",
api-1  |         "trace_state": "[]"
api-1  |     },
api-1  |     "kind": "SpanKind.INTERNAL",
api-1  |     "parent_id": "0x2b6289693d7877cb",
api-1  |     "start_time": "2026-05-07T12:36:25.787835Z",
api-1  |     "end_time": "2026-05-07T12:36:25.787871Z",
api-1  |     "status": {
api-1  |         "status_code": "UNSET"
api-1  |     },
api-1  |     "attributes": {
api-1  |         "asgi.event.type": "http.response.start",
api-1  |         "http.status_code": 200
api-1  |     },
api-1  |     "events": [],
api-1  |     "links": [],
api-1  |     "resource": {
api-1  |         "attributes": {
api-1  |             "telemetry.sdk.language": "python",
api-1  |             "telemetry.sdk.name": "opentelemetry",
api-1  |             "telemetry.sdk.version": "1.41.1",
api-1  |             "service.name": "my_api_service",
api-1  |             "telemetry.auto.version": "0.62b1"
api-1  |         },
api-1  |         "schema_url": ""
api-1  |     }
api-1  | }
api-1  | {
api-1  |     "name": "GET / http send",
api-1  |     "context": {
api-1  |         "trace_id": "0x7a940289e3235f398429846d25f1b25f",
api-1  |         "span_id": "0xdb3a35110889746b",
api-1  |         "trace_state": "[]"
api-1  |     },
api-1  |     "kind": "SpanKind.INTERNAL",
api-1  |     "parent_id": "0x2b6289693d7877cb",
api-1  |     "start_time": "2026-05-07T12:36:25.788230Z",
api-1  |     "end_time": "2026-05-07T12:36:25.788240Z",
api-1  |     "status": {
api-1  |         "status_code": "UNSET"
api-1  |     },
api-1  |     "attributes": {
api-1  |         "asgi.event.type": "http.response.body"
api-1  |     },
api-1  |     "events": [],
api-1  |     "links": [],
api-1  |     "resource": {
api-1  |         "attributes": {
api-1  |             "telemetry.sdk.language": "python",
api-1  |             "telemetry.sdk.name": "opentelemetry",
api-1  |             "telemetry.sdk.version": "1.41.1",
api-1  |             "service.name": "my_api_service",
api-1  |             "telemetry.auto.version": "0.62b1"
api-1  |         },
api-1  |         "schema_url": ""
api-1  |     }
api-1  | }
api-1  | {
api-1  |     "name": "GET /",
api-1  |     "context": {
api-1  |         "trace_id": "0x7a940289e3235f398429846d25f1b25f",
api-1  |         "span_id": "0x2b6289693d7877cb",
api-1  |         "trace_state": "[]"
api-1  |     },
api-1  |     "kind": "SpanKind.SERVER",
api-1  |     "parent_id": null,
api-1  |     "start_time": "2026-05-07T12:36:25.786770Z",
api-1  |     "end_time": "2026-05-07T12:36:25.788277Z",
api-1  |     "status": {
api-1  |         "status_code": "UNSET"
api-1  |     },
api-1  |     "attributes": {
api-1  |         "http.scheme": "http",
api-1  |         "http.host": "172.22.0.2:8000",
api-1  |         "net.host.port": 8000,
api-1  |         "http.flavor": "1.1",
api-1  |         "http.target": "/",
api-1  |         "http.url": "http://127.0.0.1:8000/",
api-1  |         "http.method": "GET",
api-1  |         "http.server_name": "127.0.0.1:8000",
api-1  |         "http.user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0",
api-1  |         "net.peer.ip": "172.22.0.1",
api-1  |         "net.peer.port": 59978,
api-1  |         "http.route": "/",
api-1  |         "http.status_code": 200
api-1  |     },
api-1  |     "events": [],
api-1  |     "links": [],
api-1  |     "resource": {
api-1  |         "attributes": {
api-1  |             "telemetry.sdk.language": "python",
api-1  |             "telemetry.sdk.name": "opentelemetry",
api-1  |             "telemetry.sdk.version": "1.41.1",
api-1  |             "service.name": "my_api_service",
api-1  |             "telemetry.auto.version": "0.62b1"
api-1  |         },
api-1  |         "schema_url": ""
api-1  |     }
api-1  | }
```

The line `INFO:     172.22.0.1:59978 - "GET / HTTP/1.1" 200 OK` tells you what happened (a 200 OK), but not how it happened. This is where OTel takes over to provide the "how."

The three JSON blobs that follow are all part of the same request. You can tell because they all share the exact same trace_id: `0x7a940289e3235f398429846d25f1b25f`.

### A. The Parent Span

Look for the one named `GET /` with `kind": "SpanKind.SERVER`.

`parent_id": null` This is the "Root Span." It represents the total time the server spent on this request.

Duration: It started at .786 and ended at .788 seconds.

### B. The Child Spans

The other two spans named `GET / http send` are children of the parent.

`parent_id: 0x2b6289693d7877cb` Notice this ID matches the span_id of the parent GET / span.

`asgi.event.type` since FastAPI is an ASGI framework, the OTel agent is catching the specific moments the server started the response (`http.response.start`) and finished sending the body (`http.response.body`).

## Metrics

Metrics are "time-driven.", they are snapshots of your system's health.

It aggregates data (like how many total requests have hit /) over a period of time. Every 60 seconds (the default interval), it "exports" the current totals to your terminal.

You should see JSON like following after certain interval, 

```
{
    "resource_metrics": [
        {
            "scope_metrics": [
                {
                    "metrics": [
                        {
                            "name": "http.server.request.duration",
                            "data": {
                                "data_points": [
                                    {
                                        "count": 15,
                                        "sum": 1240.5,
                                        "min": 2.1,
                                        "max": 450.0,
                                        "attributes": { "http.method": "GET", "http.route": "/" }
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }
    ]
}
```

## Logs

The OTel agent can automatically "bridge" your standard Python logs into the OpenTelemetry pipeline. When you use `logging.info("hello")`, OTel intercepts it and attaches the current `trace_id`.

We have following log added in API endpoint:

```
import logging

logger = logging.getLogger(__name__)

@app.get("/")
def read_root():
    logger.info("This log will now include the trace_id automatically!")
    return {"Hello": "World"}
```

You should see following printed in console

```
api-1  | {
api-1  |     "body": "This log will now include the trace_id automatically!",
api-1  |     "severity_number": 9,
api-1  |     "severity_text": "INFO",
api-1  |     "attributes": null,
api-1  |     "dropped_attributes": 0,
api-1  |     "timestamp": "2026-05-07T23:13:26.229884Z",
api-1  |     "observed_timestamp": "2026-05-07T23:13:26.230003Z",
api-1  |     "trace_id": "0x57035260c923bedb509e7e37d24f937a",
api-1  |     "span_id": "0x29937cba6e339b85",
api-1  |     "trace_flags": 1,
api-1  |     "resource": {
api-1  |         "attributes": {
api-1  |             "telemetry.sdk.language": "python",
api-1  |             "telemetry.sdk.name": "opentelemetry",
api-1  |             "telemetry.sdk.version": "1.41.1",
api-1  |             "service.name": "my_api_service",
api-1  |             "telemetry.auto.version": "0.62b1"
api-1  |         },
api-1  |         "schema_url": ""
api-1  |     },
api-1  |     "event_name": ""
api-1  | }
```

# Visualization

For visualization, we shall be using Grafana with different storage backends.

|Signal|Storage Backend|Visualization  UI|
|-|-|-|
|Traces|Tempo (or Jaeger)|Grafana (Explore tab)|
|Metrics|Prometheus (or Mimir)|Grafana (Dashboards)|
|Logs|Loki|Grafana (Log Explorer)|

The signals (traces, metrics, and logs) from services will be sent to the Collector, so that, 
- Our app doesn't waste CPU cycles formatting data for three different databases. It sends it once via OTLP.
- We can tell the Collector: "Only save traces that take longer than 500ms or result in an error."
- We can scrub sensitive user data (like PII) in the Collector before it ever hits your storage.

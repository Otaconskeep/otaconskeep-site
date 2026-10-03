# Reading: ARR Stack Health Monitoring

**Module:** Requests & Media Servers
**Activity type:** Reading (Learn)
**Objective:** Distinguish reachability, authentication, readiness, application health, dependency health, and workflow freshness

## Vocabulary

| Term | Meaning |
|---|---|
| Reachability | Whether a monitor can establish communication with the application endpoint before considering credentials or application state. |
| Authentication health | Whether the monitor is authorized to query the application API using its configured credential. |
| Readiness | Whether an application is prepared to perform useful work, which is stronger than merely having a running process. |
| Health check | An application-generated record describing a warning, error, dependency problem, configuration issue, or operational concern. |
| Freshness | The age of the most recent successful synchronization, import, search, or other expected workflow event. |
| Queue depth | The number of pending or blocked items awaiting processing. It is meaningful only when evaluated with age, trend, and workload context. |
| Low-cardinality label | A metric label with a small and predictable set of values, such as application name or instance name. |
| Alert inhibition | Suppression of secondary alerts when a higher-level failure already explains them, such as suppressing application alerts during a host outage. |
| Flapping | Repeated transitions between healthy and unhealthy states that produce noisy alerts without representing a stable incident. |
| Synthetic check | A controlled test performed from the monitor's perspective to verify that a service path behaves as expected. |

## Instruction

An ARR process can be running while the automation workflow it represents is unusable. A single TCP connection or successful page load proves only limited reachability. It does not prove that an API key is valid, the database is writable, indexers are responding, download clients are available, root folders are mounted, imports are succeeding, or scheduled tasks are making progress. A useful monitor therefore evaluates several layers. First, test reachability with a bounded timeout. Second, distinguish authorization failure from network failure. Third, query an application status or system endpoint to confirm identity and readiness. Fourth, inspect the application's own health records. Fifth, measure workflow indicators such as queue depth, age of the oldest blocked item, age of the last successful synchronization, and failure counts. Finally, correlate the result with shared dependencies so that one failed download client does not create an independent page for every ARR application.

Classification must be deterministic and documented. A reasonable baseline is to mark an instance critical when it is unreachable, rejects the monitor credential, reports an explicit error, or cannot perform a required workflow for a sustained period. Warnings can represent an application warning, an aging queue, or stale synchronization that has not yet crossed a critical threshold. Healthy means the checks passed; it does not mean every library item is available. Thresholds must reflect the environment. A queue depth of 25 may be normal during a large import but abnormal for a quiet library. Prefer time-based and trend-based conditions over one instantaneous number.

Metrics should remain stable and low in cardinality. Labels such as application and instance are generally bounded. Movie titles, release names, URLs, error messages, and item identifiers should not become labels because their unbounded values increase storage and query cost. Keep detailed diagnostic text in protected logs or the ARR interface. Useful numeric metrics include monitor reachability, normalized health state, queue depth, last-success age, oldest-queue-item age, and scrape duration. A numeric state must be documented; in this lesson, 0 means critical, 1 means warning, and 2 means ok.

Alerting should describe a user-impacting condition and include enough context for action. Require persistence before notifying so that restarts and brief dependency interruptions do not page an operator. Group related alerts by host or shared dependency, and inhibit downstream ARR alerts when the host or reverse proxy is already known to be unavailable. Dashboards should show current state, recent transitions, queue trends, task freshness, and dependency status. Monitoring is complete only after the operator has tested both healthy and degraded cases and confirmed that recovery clears the alert.

## Architecture

### components
ARR instances such as Sonarr, Radarr, Lidarr, Readarr, or Prowlarr
A collector that queries application-specific status, health, queue, and task data
A normalization layer that converts different API responses into a common health model
A metrics endpoint or text-file output consumed by an observability system
An alert evaluator that applies persistence, grouping, and inhibition rules
A dashboard and notification path for operators

### data_flow
The collector contacts each configured instance with a bounded timeout.
The collector separately records reachability and authentication results.
Application health records and workflow freshness indicators are normalized.
The classifier assigns ok, warning, or critical according to documented policy.
Low-cardinality metrics are emitted without API keys or media identifiers.
Alert rules evaluate sustained conditions and route actionable notifications.

### failure_domains
Host or container runtime
Reverse proxy or name-resolution path
ARR application and its database
Download client
Indexer or indexer manager
Storage mount, permissions, and free space
Monitoring collector and notification path

### monitoring_principle
Monitor the workflow from outside the application while also consuming the application's own health knowledge. Neither perspective is sufficient alone.

## Required reading

- Review the System, Health, Queue, and Tasks pages in at least one ARR application used in your homelab.
- Review the API documentation exposed by your installed ARR application, because endpoint versions differ among applications and releases.
- Read the Prometheus guidance on metric and label naming.
- Read the Prometheus guidance on alerting rules and the use of a pending duration before an alert fires.

## References

- Prometheus metric and label naming guidance: https://prometheus.io/docs/practices/naming/
- Prometheus alerting rule documentation: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
- Prometheus instrumentation guidance: https://prometheus.io/docs/practices/instrumentation/
- Prometheus alerting practices: https://prometheus.io/docs/practices/alerting/
- Sonarr project documentation: https://wiki.servarr.com/sonarr
- Radarr project documentation: https://wiki.servarr.com/radarr
- Lidarr project documentation: https://wiki.servarr.com/lidarr
- Prowlarr project documentation: https://wiki.servarr.com/prowlarr

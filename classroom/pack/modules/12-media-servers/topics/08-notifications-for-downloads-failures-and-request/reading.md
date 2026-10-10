# Reading: Notifications for Downloads, Failures, and Requests

**Module:** Requests & Media Servers
**Activity type:** Reading (Learn)
**Objective:** Distinguish informational download notifications from actionable failure notifications.

## Vocabulary

| Term | Meaning |
|---|---|
| Event | A structured record describing something that happened, such as a completed download, a failed import, or a newly submitted request. |
| Notification | A human-readable message derived from an event and prepared for delivery to a destination. |
| Route | A policy-selected logical destination for a notification, such as an operations channel, request-review queue, or low-priority activity feed. |
| Severity | A classification indicating urgency and expected response, commonly represented as low, normal, high, or critical. |
| Deduplication | The process of suppressing repeated notifications that represent the same event. |
| Idempotency | The property that repeating the same operation produces no additional unintended effect. |
| Correlation identifier | A stable identifier used to connect related events, logs, retries, and notifications. |
| Notification fatigue | Reduced operator attention caused by excessive, repetitive, low-value, or poorly prioritized messages. |
| Delivery adapter | A component that translates an internal notification into the format required by a particular messaging or incident-management service. |
| Dead-letter queue | A holding area for events or notifications that could not be processed successfully and require later inspection or replay. |

## Instruction

A useful notification system is not simply a switch that sends every application event to one chat room. It is a small event-processing pipeline. A source emits an event, an adapter normalizes that event, policy determines whether a human should be notified, a template produces a concise message, and a delivery adapter sends it to the selected destination. Each stage should be observable and independently testable.

Download completion, download failure, and request creation have different operational meanings. A successful download is normally informational. It may belong in a low-priority activity feed, a daily summary, or no notification stream at all. A failed download can require investigation, but a single transient failure is not always urgent. Policy should consider retry count, age, repeated failures, and whether all alternative sources have been exhausted. A new request generally needs acknowledgment or review rather than an emergency response. Routing every category as high urgency creates notification fatigue and makes genuinely important failures easier to miss.

Events should be normalized into a stable internal schema. Useful fields include an event identifier, event type, occurrence time, item title or safe display label, result, retry count, and a correlation identifier. Source-specific payloads often contain more information than a recipient needs. Do not forward complete raw payloads by default. Query strings, filesystem locations, user identifiers, hostnames, and application metadata can reveal private details. Select only the fields needed to understand and act on the event.

Deduplication is essential because event sources and delivery systems can retry. A practical design assigns each notification a deterministic identifier derived from stable input, such as the source event identifier and chosen route. The processor records identifiers that have already been accepted. Reprocessing the same event then becomes harmless. This does not replace source acknowledgment or durable queues, but it demonstrates idempotent behavior and prevents obvious duplicate messages.

Failure handling must cover more than the underlying download failure. The notification pipeline itself can fail while parsing an event, applying a template, resolving a route, or delivering a message. Production systems should use bounded retries with delay, preserve failed work for inspection, expose delivery status, and avoid retrying permanent errors forever. Success should mean that the configured destination accepted the notification, not merely that an application attempted to send it.

Good messages answer four questions: what happened, what object was affected, how urgent is it, and what should the operator do next? A subject such as 'Download failed' is incomplete without a safe item label, error category, attempt count, and correlation identifier. At the same time, a notification is not a substitute for logs. The message should link or point to the relevant diagnostic context rather than embedding every detail. This lesson uses only synthetic events and a local outbox, allowing routing and deduplication to be tested without external delivery or credentials.

## Architecture

### overview
Synthetic event producers write normalized events to a local event stream. A notification processor validates each event, applies routing and severity policy, renders a concise message, computes a deterministic notification identifier, and writes accepted notifications to a local outbox. A state file records identifiers already processed.

### components
### name
Event source

### responsibility
Produces download-completed, download-failed, and request-created events.
### name
Normalizer

### responsibility
Ensures every event has a stable identifier, recognized type, timestamp, and required event-specific fields.
### name
Policy and router

### responsibility
Maps informational activity, operational failures, and requests to different logical routes and severities.
### name
Template renderer

### responsibility
Creates a short subject and body containing only the context needed by the recipient.
### name
Deduplication store

### responsibility
Records deterministic notification identifiers so replayed events do not create duplicate output.
### name
Local outbox

### responsibility
Represents notifications accepted for delivery without contacting an external service.

### event_flow
A source emits a normalized JSON event.
The processor validates the event type and required fields.
Policy selects a route and severity.
The processor generates a deterministic notification identifier.
Previously processed identifiers are suppressed.
A new notification is rendered and appended to the local outbox.
The identifier is appended to the local state file.

### production_extension
In production, replace the local outbox with one or more delivery adapters while retaining normalization, routing, minimization, deduplication, delivery-state monitoring, and controlled retry behavior.

## Required reading

- Python documentation: json — JSON encoder and decoder, https://docs.python.org/3/library/json.html
- Python documentation: hashlib — secure hashes and message digests, https://docs.python.org/3/library/hashlib.html
- Python documentation: pathlib — object-oriented filesystem paths, https://docs.python.org/3/library/pathlib.html
- Prometheus Alertmanager documentation: notification grouping, inhibition, silences, and routing, https://prometheus.io/docs/alerting/latest/alertmanager/
- OWASP Cheat Sheet Series: Logging Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

## References

- Python Software Foundation, json — JSON encoder and decoder, https://docs.python.org/3/library/json.html
- Python Software Foundation, hashlib — secure hashes and message digests, https://docs.python.org/3/library/hashlib.html
- Python Software Foundation, pathlib — object-oriented filesystem paths, https://docs.python.org/3/library/pathlib.html
- Prometheus Authors, Alertmanager documentation, https://prometheus.io/docs/alerting/latest/alertmanager/
- OWASP Foundation, Logging Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Cloud Native Computing Foundation, CloudEvents specification, https://cloudevents.io/
- IETF, RFC 8259: The JavaScript Object Notation Data Interchange Format, https://www.rfc-editor.org/rfc/rfc8259

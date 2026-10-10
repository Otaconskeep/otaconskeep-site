# Class 63: Notifications for Downloads, Failures, and Requests

**Learning objective:** Distinguish informational download notifications from actionable failure notifications.; Route request, download, and failure events to appropriate logical destinations.; Construct notification messages with useful context while minimizing sensitive data.; Implement deterministic notification identifiers for duplicate suppression.; Verify notification generation and idempotent behavior with a local simulation.; Explain how production notification delivery should handle credentials, retries, rate limits, and failures.
**Bloom level:** Understand / Apply
**Track:** Homelab Automation and Operations · **Difficulty:** intermediate · **Duration:** ~75 minutes · **Lab risk:** low
**Build output:** Design and test a notification workflow that converts download, failure, and media-request events into useful, deduplicated messages without contacting external services or exposing sensitive data.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### operating_systems
Linux distributions that provide Python 3.9 or newer and a POSIX-compatible shell

### runtime
Python 3.9 or newer using only the standard library

### external_services
None required

### network_access
Not required

### filesystem_scope
/opt/lab-classroom/class63/

### notes
The commands assume the learner has permission to create and modify the approved lab directory. The simulation is independent of any specific download manager, request manager, chat platform, or media server.

## Learning objective

- Distinguish informational download notifications from actionable failure notifications.
- Route request, download, and failure events to appropriate logical destinations.
- Construct notification messages with useful context while minimizing sensitive data.
- Implement deterministic notification identifiers for duplicate suppression.
- Verify notification generation and idempotent behavior with a local simulation.
- Explain how production notification delivery should handle credentials, retries, rate limits, and failures.

## Why this matters

Design and test a notification workflow that converts download, failure, and media-request events into useful, deduplicated messages without contacting external services or exposing sensitive data.

## Prerequisites

- Basic familiarity with Linux command-line navigation
- Basic understanding of JSON objects and newline-delimited JSON
- Python 3.9 or newer
- Completion of earlier lessons covering service events, logs, or media automation is helpful but not required
- Permission to create files under /opt/lab-classroom/class63/

## Required reading

- Python documentation: json — JSON encoder and decoder, https://docs.python.org/3/library/json.html
- Python documentation: hashlib — secure hashes and message digests, https://docs.python.org/3/library/hashlib.html
- Python documentation: pathlib — object-oriented filesystem paths, https://docs.python.org/3/library/pathlib.html
- Prometheus Alertmanager documentation: notification grouping, inhibition, silences, and routing, https://prometheus.io/docs/alerting/latest/alertmanager/
- OWASP Cheat Sheet Series: Logging Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

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

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Add a synthetic download.warning event and define its route, severity, subject, and body. Keep every modified file under /opt/lab-classroom/class63/.
Extend the processor so malformed input is recorded in a local dead-letter file instead of stopping all subsequent event processing.
Add a created_at field to generated notifications using a supplied event timestamp so test output remains deterministic.
Design a policy that escalates a failed download only after a chosen number of attempts. Explain the operational reason for the threshold rather than claiming a universal best value.
Write a short notification-content policy listing which fields are approved, conditionally approved, and prohibited for your own homelab.

## Feynman teach-back

### prompt
Explain the system to a new homelab operator without using the words webhook, idempotency, or deduplication.

### model_explanation
Applications report things that happened. A small processor sorts those reports by importance, turns them into short human-readable messages, and places each message in the appropriate destination. Successful downloads go to a quiet activity area, failures go to an operations area, and new requests go to a review area. Before creating a message, the processor calculates a stable label from the original event and destination. If that label was already recorded, the processor knows it has handled the event before and does not send another copy.

### check_for_understanding
Can the learner explain why a completed download and a repeated failure should not have the same urgency?
Can the learner describe how the processor recognizes a replayed event?
Can the learner identify information that belongs in diagnostic logs but not in a general notification?
Can the learner explain why successful message generation is different from successful message delivery?

## Retrieval check

1. Why should download completion, download failure, and request creation normally use different routes or severities?
2. What makes a notification identifier suitable for suppressing duplicate processing?
3. Why is forwarding an entire source event payload into a chat message unsafe?
4. What does the delivery_status value queued mean in this lab?
5. Why should a notification processor use bounded retries rather than retrying forever?
6. What should happen when the processor receives an event type for which no policy exists?
7. How does the lab demonstrate idempotent behavior?
8. What is the operational difference between a source failure and a notification-delivery failure?

## Guided lab

### scope
Every file created or modified by this lab is located under /opt/lab-classroom/class63/. The exercise uses synthetic data and performs no network communication.

### steps
### step
1

### title
Create the isolated lab directory

### command
mkdir -p /opt/lab-classroom/class63

### explanation
This establishes the only directory the lab will modify.
### step
2

### title
Create three synthetic source events

### command
cat > /opt/lab-classroom/class63/events.jsonl <<'EOF'
{"event_id":"evt-6301","event_type":"download.completed","occurred_at":"2025-03-08T10:00:00Z","title":"Synthetic Documentary","quality":"1080p"}
{"event_id":"evt-6302","event_type":"download.failed","occurred_at":"2025-03-08T10:05:00Z","title":"Synthetic Series S01E01","error_class":"import_error","attempt":3}
{"event_id":"evt-6303","event_type":"request.created","occurred_at":"2025-03-08T10:10:00Z","title":"Synthetic Movie","request_kind":"movie"}
EOF

### explanation
The file represents a normalized event stream. All names and identifiers are synthetic.
### step
3

### title
Create the local notification processor

### command
cat > /opt/lab-classroom/class63/notify.py <<'PY'
import hashlib
import json
from pathlib import Path

ROOT = Path('/opt/lab-classroom/class63')
EVENTS = ROOT / 'events.jsonl'
OUTBOX = ROOT / 'outbox.jsonl'
STATE = ROOT / 'processed_ids.txt'

ROUTES = {
    'download.completed': ('activity.low', 'low'),
    'download.failed': ('operations.high', 'high'),
    'request.created': ('requests.normal', 'normal'),
}


def render(event):
    event_type = event['event_type']
    title = event['title']
    if event_type == 'download.completed':
        return (
            'Download completed',
            f"{title} completed at quality {event.get('quality', 'unspecified')}."
        )
    if event_type == 'download.failed':
        return (
            'Download requires attention',
            f"{title} failed with category {event.get('error_class', 'unknown')} on attempt {event.get('attempt', 'unknown')}."
        )
    if event_type == 'request.created':
        return (
            'New media request',
            f"A {event.get('request_kind', 'media')} request was created for {title}."
        )
    raise ValueError(f'Unsupported event type: {event_type}')


def notification_id(event_id, route):
    material = f'{event_id}|{route}'.encode('utf-8')
    return hashlib.sha256(material).hexdigest()[:20]


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    OUTBOX.touch(exist_ok=True)
    STATE.touch(exist_ok=True)
    processed = {
        line.strip()
        for line in STATE.read_text(encoding='utf-8').splitlines()
        if line.strip()
    }
    created = 0
    skipped = 0
    with EVENTS.open('r', encoding='utf-8') as source, OUTBOX.open('a', encoding='utf-8') as outbox, STATE.open('a', encoding='utf-8') as state:
        for line_number, line in enumerate(source, start=1):
            if not line.strip():
                continue
            event = json.loads(line)
            required = {'event_id', 'event_type', 'occurred_at', 'title'}
            missing = sorted(required.difference(event))
            if missing:
                raise ValueError(f'Line {line_number} is missing fields: {missing}')
            if event['event_type'] not in ROUTES:
                raise ValueError(f"Line {line_number} has unsupported type: {event['event_type']}")
            route, severity = ROUTES[event['event_type']]
            current_id = notification_id(event['event_id'], route)
            if current_id in processed:
                skipped += 1
                continue
            subject, body = render(event)
            notification = {
                'notification_id': current_id,
                'event_id': event['event_id'],
                'event_type': event['event_type'],
                'occurred_at': event['occurred_at'],
                'route': route,
                'severity': severity,
                'subject': subject,
                'body': body,
                'delivery_status': 'queued'
            }
            outbox.write(json.dumps(notification, sort_keys=True) + '\n')
            state.write(current_id + '\n')
            processed.add(current_id)
            created += 1
    print(json.dumps({'created': created, 'duplicates_skipped': skipped}, sort_keys=True))


if __name__ == '__main__':
    main()
PY

### explanation
The processor validates input, applies policy, creates minimized messages, and suppresses duplicate notifications through deterministic identifiers.
### step
4

### title
Process the event stream

### command
python3 /opt/lab-classroom/class63/notify.py

### explanation
The first run should queue one notification for each of the three unique events.
### step
5

### title
Inspect the local outbox

### command
cat /opt/lab-classroom/class63/outbox.jsonl

### explanation
Confirm that each notification has a route, severity, subject, body, source event identifier, and queued delivery status.
### step
6

### title
Test idempotent replay

### command
python3 /opt/lab-classroom/class63/notify.py && wc -l /opt/lab-classroom/class63/outbox.jsonl /opt/lab-classroom/class63/processed_ids.txt

### explanation
The second run should identify all three source events as duplicates. Both files should remain at three lines.
### step
7

### title
Review routing assignments

### command
python3 - <<'PY'
import json
from pathlib import Path
path = Path('/opt/lab-classroom/class63/outbox.jsonl')
for line in path.read_text(encoding='utf-8').splitlines():
    item = json.loads(line)
    print(f"{item['event_type']} -> {item['route']} ({item['severity']})")
PY

### explanation
This displays the policy decision for each event category without modifying lab data.

## Expected results

- The first processor run prints a JSON summary containing created equal to 3 and duplicates_skipped equal to 0.
- The local outbox contains exactly three newline-delimited JSON notifications.
- The completed download is routed to activity.low with low severity.
- The failed download is routed to operations.high with high severity.
- The new request is routed to requests.normal with normal severity.
- Every notification contains a deterministic notification_id and delivery_status set to queued.
- The second processor run prints a JSON summary containing created equal to 0 and duplicates_skipped equal to 3.
- After the second run, both outbox.jsonl and processed_ids.txt still contain exactly three lines.

## Verification checkpoints

- [ ] Run: python3 /opt/lab-classroom/class63/notify.py. After the initial run, verify that the output reports three created notifications; after a replay, verify that it reports three skipped duplicates.
- [ ] Run: wc -l /opt/lab-classroom/class63/outbox.jsonl. The result should report exactly 3 lines.
- [ ] Run: wc -l /opt/lab-classroom/class63/processed_ids.txt. The result should report exactly 3 lines.
- [ ] Run: python3 -c "import json,pathlib; p=pathlib.Path('/opt/lab-classroom/class63/outbox.jsonl'); rows=[json.loads(x) for x in p.read_text().splitlines()]; assert len(rows)==3; assert len({x['notification_id'] for x in rows})==3; print('unique notification identifiers verified')". The command should print unique notification identifiers verified.
- [ ] Run: python3 -c "import json,pathlib; rows=[json.loads(x) for x in pathlib.Path('/opt/lab-classroom/class63/outbox.jsonl').read_text().splitlines()]; print(sorted((x['event_type'],x['route'],x['severity']) for x in rows))". Confirm that all three event categories use their intended route and severity.
- [ ] Inspect outbox.jsonl and confirm that the messages include actionable context but do not include raw source payload dumps, filesystem locations, network addresses, or personal requester details.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The shell reports that /opt/lab-classroom/class63 cannot be created. | The current account does not have permission to create or modify the approved lab directory. | Use an account or classroom environment that has been granted access to /opt/lab-classroom/. Do not redirect the exercise to an unrelated system directory. |
| Running notify.py reports that events.jsonl does not exist. | The synthetic event creation step was skipped or the file was written to a different path. | Repeat the event creation step and confirm that /opt/lab-classroom/class63/events.jsonl exists. |
| The processor reports a JSON decoding error. | One line in events.jsonl is not a complete JSON object or contains invalid quoting. | Recreate events.jsonl from the lab step. Keep exactly one valid JSON object on each line. |
| The processor reports an unsupported event type. | An event_type value does not match download.completed, download.failed, or request.created. | Correct the synthetic event type or extend both the ROUTES mapping and render function with an explicit policy for the new type. |
| The first run reports duplicate events instead of creating notifications. | processed_ids.txt remains from a previous execution of the lab. | Use the documented rollback procedure to remove the known lab artifacts, recreate the inputs, and run the processor again. |
| Repeated runs add more lines to outbox.jsonl. | The state file was deleted, became unwritable, or no longer matches the outbox. | Confirm that processed_ids.txt exists and is writable. Restore the original processor, reset the lab with the rollback procedure, and repeat the exercise. |
| The outbox contains fewer than three notifications on a clean run. | An input line is missing, blank, invalid, or already represented in the state file. | Verify that events.jsonl contains three unique event_id values and that the state file was absent before the clean run. |

## Security considerations

Treat production delivery credentials as secrets. Store them in the platform's protected secret facility or a narrowly readable runtime file, and never place them in event payloads, lesson notes, source control, or notification bodies.
Use a separate delivery destination for testing. This lab deliberately writes to a local outbox and does not contact any external service.
Minimize notification content. Avoid forwarding complete source payloads, internal paths, personal requester information, session data, network addresses, or unnecessary media-library metadata.
Grant the notification processor only the access needed to read normalized events, update its state, and submit messages to approved destinations.
Validate event types and required fields before rendering. Treat event content as untrusted text and rely on the destination adapter to perform correct encoding.
Use deterministic identifiers or source-provided idempotency keys to control duplicate delivery after retries or restarts.
Separate informational activity from actionable alerts so that high-priority destinations remain meaningful.
Record delivery status without recording protected credential material or complete remote responses that may contain sensitive details.
Set bounded retry behavior and retain permanently failed notifications for review instead of retrying indefinitely.
Rotate production delivery credentials after suspected disclosure and review delivery history for unauthorized use.

## Rollback

### goal
Remove only the files created by this class and then remove the class directory if it is empty.

### command
python3 - <<'PY'
from pathlib import Path
root = Path('/opt/lab-classroom/class63')
for name in ('events.jsonl', 'notify.py', 'outbox.jsonl', 'processed_ids.txt'):
    path = root / name
    if path.exists() and path.is_file():
        path.unlink()
if root.exists():
    try:
        root.rmdir()
    except OSError:
        print(f'Not removed because unexpected files remain: {root}')
PY

### verification
Run: python3 -c "from pathlib import Path; print(Path('/opt/lab-classroom/class63').exists())". A fully rolled-back lab prints False. If it prints True, inspect the directory and preserve any unexpected files until their ownership and purpose are understood.

### data_impact
The rollback targets only the four known lab files under /opt/lab-classroom/class63/. It does not alter production applications, notification destinations, or configuration.

## Video narration notes

Welcome to Class 63, Notifications for Downloads, Failures, and Requests. In this lesson, we will treat notifications as an event-processing system rather than as a simple message switch.

Our three event categories have different meanings. A completed download is useful activity information, but it rarely requires immediate action. A failed download may require investigation, particularly after multiple attempts. A newly created request generally belongs in a review workflow. Sending all three to one high-priority destination would make that destination noisy and reduce its value.

The architecture begins with normalized events. Each event has a stable identifier, a type, a timestamp, and a safe title. The processor validates those fields, selects a route and severity, and renders a concise subject and body. It then derives a stable notification identifier from the event identifier and route. If that identifier is already in the state file, the event is treated as a replay and no second notification is created.

The lab does not communicate with any external service. Instead, notifications are written to a local outbox under the class directory. This lets us inspect routing, content, and duplicate suppression without using production destinations or delivery credentials.

On the first run, the processor should create three notifications. The completed download is low severity and goes to the activity route. The failed download is high severity and goes to the operations route. The request is normal severity and goes to the requests route. On the second run, all three source events are recognized as duplicates, so the outbox remains unchanged.

Remember that queued is not the same as delivered. A production adapter must track whether a destination accepted a message, apply bounded retries, and preserve permanently failed work for inspection. Production messages should also be intentionally minimized. Operators need enough context to understand what happened and what to do next, but they do not need complete raw payloads or private infrastructure details.

By the end of this class, you should be able to explain the entire path from event generation to routing, rendering, duplicate suppression, and delivery-state monitoring. You should also be able to justify why each notification exists and why it is sent to its chosen audience.

## References

- Python Software Foundation, json — JSON encoder and decoder, https://docs.python.org/3/library/json.html
- Python Software Foundation, hashlib — secure hashes and message digests, https://docs.python.org/3/library/hashlib.html
- Python Software Foundation, pathlib — object-oriented filesystem paths, https://docs.python.org/3/library/pathlib.html
- Prometheus Authors, Alertmanager documentation, https://prometheus.io/docs/alerting/latest/alertmanager/
- OWASP Foundation, Logging Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Cloud Native Computing Foundation, CloudEvents specification, https://cloudevents.io/
- IETF, RFC 8259: The JavaScript Object Notation Data Interchange Format, https://www.rfc-editor.org/rfc/rfc8259

## Mastery gate

- [ ] Objectives demonstrated with evidence
- [ ] Feynman complete
- [ ] Quiz self-scored ≥80%
- [ ] Lab verification boxes checked
- [ ] Rollback understood

## Reflection

1. What did I learn?
2. What did I struggle with?
3. How does this connect to earlier classes?

## Spiral hook

Return to this class whenever a later service fails for identity, process, log, remote access, update, or routing reasons covered here.

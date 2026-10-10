# Lab: Notifications for Downloads, Failures, and Requests

**Module:** Requests & Media Servers
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Distinguish informational download notifications from actionable failure notifications.

## Before you start

- Basic familiarity with Linux command-line navigation
- Basic understanding of JSON objects and newline-delimited JSON
- Python 3.9 or newer
- Completion of earlier lessons covering service events, logs, or media automation is helpful but not required
- Permission to create files under /opt/lab-classroom/class63/

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

## Verification

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

## Security

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

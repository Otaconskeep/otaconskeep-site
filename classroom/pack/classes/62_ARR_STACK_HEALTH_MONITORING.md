# Class 62: ARR Stack Health Monitoring

**Learning objective:** Distinguish host reachability, HTTP availability, API authentication, application health, and queue state.; Query representative ARR API endpoints using an API key header.; Classify an application as healthy, degraded, or unavailable without treating every nonzero queue as a failure.; Generate a structured JSON health report suitable for later ingestion by an observability platform.; Design monitoring that avoids exposing ARR API keys in logs, command histories, or dashboards.; Verify monitoring behavior against deterministic healthy, warning, and unavailable lab fixtures.
**Bloom level:** Understand / Apply
**Track:** Homelab Observability and Media Automation · **Difficulty:** intermediate · **Duration:** ~75 minutes · **Lab risk:** low
**Build output:** Teach operators how to monitor Sonarr, Radarr, Prowlarr, and similar ARR applications by separating process reachability, API availability, application health events, and workload indicators. The lab uses isolated mock ARR endpoints so students can safely test healthy, degraded, and unavailable states without changing a production media stack.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-02-20
**Compatibility:** ### operating_systems
Linux systems with Python 3.8 or later

### runtime
Python standard library only; no third-party packages are required.

### arr_api_expectation
The production concepts target ARR applications exposing version 3 API paths such as /api/v3/system/status, /api/v3/health, and /api/v3/queue. Confirm endpoint behavior against the installed application's documentation before production deployment.

### network
The lab requires local access to 127.0.0.1:8620. The fixture is not intended for remote access.

### filesystem
The parent directory /opt/lab-classroom must exist. All lab file mutations are restricted to /opt/lab-classroom/class62/.

### limitations
The mock service demonstrates monitoring logic but does not reproduce every ARR response field, reverse-proxy behavior, certificate condition, authentication mode, or application version.

## Learning objective

- Distinguish host reachability, HTTP availability, API authentication, application health, and queue state.
- Query representative ARR API endpoints using an API key header.
- Classify an application as healthy, degraded, or unavailable without treating every nonzero queue as a failure.
- Generate a structured JSON health report suitable for later ingestion by an observability platform.
- Design monitoring that avoids exposing ARR API keys in logs, command histories, or dashboards.
- Verify monitoring behavior against deterministic healthy, warning, and unavailable lab fixtures.

## Why this matters

Teach operators how to monitor Sonarr, Radarr, Prowlarr, and similar ARR applications by separating process reachability, API availability, application health events, and workload indicators. The lab uses isolated mock ARR endpoints so students can safely test healthy, degraded, and unavailable states without changing a production media stack.

## Prerequisites

- Comfort using a Linux shell and Python 3.
- Basic understanding of HTTP status codes and JSON.
- Familiarity with the roles of Sonarr, Radarr, and Prowlarr.
- Permission to create files under /opt/lab-classroom/class62/.
- The directory /opt/lab-classroom/ must already exist.
- Two terminal sessions are recommended so the mock server and monitor can run separately.

## Required reading

- Servarr Wiki, Sonarr System and Health Checks: https://wiki.servarr.com/sonarr/system
- Servarr Wiki, Radarr System and Health Checks: https://wiki.servarr.com/radarr/system
- Servarr Wiki, Prowlarr System and Health Checks: https://wiki.servarr.com/prowlarr/system
- Prometheus instrumentation practices, especially online serving systems and failure reporting: https://prometheus.io/docs/practices/instrumentation/

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| ARR application | An informal label for media automation applications such as Sonarr, Radarr, Prowlarr, Lidarr, and Readarr. These applications are independently deployed services rather than one monolithic stack. |
| Liveness | Evidence that a process or endpoint is responding. Liveness alone does not prove that the application can complete its intended work. |
| Readiness | Evidence that a service is sufficiently initialized and connected to required dependencies to accept useful work. |
| Application health event | A warning or error reported by the application about conditions such as unavailable indexers, inaccessible download clients, missing root folders, or update problems. |
| API key | A shared secret used by ARR applications to authorize API requests, commonly supplied through the X-Api-Key HTTP header. |
| Queue | The set of downloads or imports currently tracked by an application. A nonzero queue is normally workload information, not automatically an incident. |
| Synthetic check | A request generated by monitoring software to verify that a service endpoint behaves as expected. |
| Cardinality | The number of unique metric label combinations. Exporting unbounded titles, download identifiers, or URLs as labels can make a monitoring system expensive and difficult to operate. |
| Degraded | A state in which the API is reachable but the application reports one or more health warnings or errors. |

## Instruction

Effective ARR monitoring is layered. A successful network connection proves only that something accepted the connection. A successful HTTP response proves that an endpoint answered, but it may still be an authentication page, reverse-proxy response, or incomplete application. A successful system-status request confirms that the expected API is available. The health endpoint then exposes problems detected by the application itself, such as an indexer, download client, root folder, or update issue. Queue information adds workload context, but it must be interpreted carefully: a queue containing items can be completely normal. Alerting only because the queue count is greater than zero creates noise and trains operators to ignore alarms.

A useful state model is healthy, degraded, and unavailable. Healthy means the API status request succeeded and the application returned no active health events. Degraded means the API is available but one or more health events exist. Unavailable means the status request could not be completed because of a connection failure, timeout, authentication rejection, unexpected HTTP response, or invalid response body. Production monitoring may subdivide unavailable into transport, authorization, server, and parsing failures, but the top-level state should remain understandable during an incident.

Health monitoring should preserve diagnostic evidence without leaking secrets. Record the instance name, observation time, state, HTTP or parsing error category, health-event type, and queue count when available. Do not log the API key. Avoid exporting media titles, release names, full download paths, or indexer URLs as metric labels because they may contain private information and create unbounded cardinality. Polling intervals and alert delays must be selected from the operator's service objectives and environment; there is no universal interval that is correct for every homelab. Use repeated observations before paging when brief restarts are expected, and route persistent application warnings differently from total API loss.

The lab deliberately models three conditions. Sonarr is reachable with no health events. Radarr is reachable but reports an indexer warning, so it is degraded. Prowlarr returns an HTTP service error, so it is unavailable. The monitor queries system status first, queries health only after status succeeds, and records queue size as context. This ordering prevents a failed dependency request from being mistaken for a healthy application. The resulting report is machine-readable and can later be transformed into metrics, dashboard panels, notifications, or service-level reports.

## Architecture

### components
### name
Mock ARR API

### role
A Python HTTP service bound to 127.0.0.1:8620. It presents isolated Sonarr, Radarr, and Prowlarr URL prefixes and validates a lab-only API key.
### name
Health collector

### role
A Python program that requests system status, application health, and queue data and then assigns a state.
### name
JSON report

### role
A local artifact at /opt/lab-classroom/class62/report.json containing observations without the API key.
### name
Future observability integration

### role
A metrics collector, dashboard, or notification service that can consume equivalent observations in production.

### request_flow
The collector sends an authenticated request to each instance's system-status endpoint.
If system status fails, the instance is classified as unavailable and dependent checks are skipped.
If system status succeeds, the collector requests health events and queue data.
An instance with health events is classified as degraded; an instance without health events is classified as healthy.
The collector writes one structured report inside the class workspace.

### state_model
### healthy
System status is available and the health-event list is empty.

### degraded
System status is available and one or more application health events are present.

### unavailable
System status cannot be successfully requested or decoded.

### scope
All files created or modified by the lab are contained in /opt/lab-classroom/class62/. The mock service listens only on the loopback interface.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

### tasks
Extend the fixture with a Lidarr prefix that returns a successful system-status response and one error-type health event.
Extend the monitor so error records include a bounded category such as authentication, transport, server, or response-format while excluding secrets and response bodies.
Add a report field indicating whether each queue query succeeded separately from queue_total.
Write a notification policy that treats total API loss differently from an indexer warning. Base timing on your own service objectives rather than copying an arbitrary interval.
Design a bounded metric set for instance availability, active health-event count, queue count, and collection success. List allowed labels and explain why media titles are excluded.

### submission
Submit the revised source files, one sanitized report, the notification policy, and a short explanation of the state model. Keep all submitted lab artifacts under /opt/lab-classroom/class62/ and do not include production credentials.

## Feynman teach-back

Explain to a new operator why a successful ping or open TCP port does not prove that Sonarr is healthy.
Explain the difference between unavailable and degraded without using the words liveness or readiness.
Explain why two queued Radarr items do not automatically indicate an incident.
Describe what the monitor does when the system-status request fails and why it skips dependent conclusions.
Explain why API keys and media titles should not become metric labels.
Draw the request flow from collector to system status, health, queue, report, and alert destination.
Describe how you would distinguish a bad API key from an application process that is not listening.

## Retrieval check

1. 1. What does a successful system-status API request prove that a successful TCP connection does not?
2. 2. When should an ARR instance be classified as degraded in the lesson's state model?
3. 3. Why is a nonzero download queue not automatically a health failure?
4. 4. Which HTTP header is commonly used to send an ARR API key?
5. 5. What top-level state should be assigned when the system-status request returns an HTTP service error?
6. 6. Why should media titles and download identifiers generally not be used as metric labels?
7. 7. What sensitive value must never be copied into the generated report or routine logs?
8. 8. Why does the collector request system status before interpreting application health and queue data?
9. 9. What should an operator do if a production API key appears in logs or source control?

## Guided lab

### workspace
/opt/lab-classroom/class62/

### safety_notes
Run the commands exactly as shown from an account permitted to create the class workspace.
The initialization check refuses to overwrite known lab artifacts.
Do not substitute production URLs or production API keys during this exercise.
Keep the mock server in the foreground so it can be stopped with Ctrl-C.

### steps
### step
1

### title
Create an isolated workspace and configuration

### instructions
This command creates only the class directory and refuses to continue if known class artifacts already exist.

### command
python3 - <<'PY'
from pathlib import Path
root = Path('/opt/lab-classroom/class62')
parent = root.parent
if not parent.is_dir():
    raise SystemExit('Required parent directory /opt/lab-classroom does not exist')
root.mkdir(exist_ok=True)
known = ['instances.json', 'mock_arr.py', 'monitor.py', 'report.json']
conflicts = [name for name in known if (root / name).exists()]
if conflicts:
    raise SystemExit('Refusing to overwrite existing artifacts: ' + ', '.join(conflicts))
(root / 'instances.json').write_text('''{
  "instances": [
    {"name": "sonarr", "base_url": "http://127.0.0.1:8620/sonarr", "api_key": "class62-lab-key"},
    {"name": "radarr", "base_url": "http://127.0.0.1:8620/radarr", "api_key": "class62-lab-key"},
    {"name": "prowlarr", "base_url": "http://127.0.0.1:8620/prowlarr", "api_key": "class62-lab-key"}
  ]
}\n''', encoding='utf-8')
print(root / 'instances.json')
PY
### step
2

### title
Create the mock ARR API

### instructions
The fixture accepts only the lab API key. Sonarr is healthy, Radarr has one warning, and Prowlarr returns an intentional service failure.

### command
cat > /opt/lab-classroom/class62/mock_arr.py <<'PY'
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

KEY = 'class62-lab-key'

class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, value):
        body = json.dumps(value).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.headers.get('X-Api-Key') != KEY:
            self.send_json(401, {'error': 'unauthorized'})
            return
        path = self.path.rstrip('/')
        if path.startswith('/prowlarr/'):
            self.send_json(503, {'error': 'intentional lab service failure'})
            return
        if path.endswith('/api/v3/system/status'):
            app = 'Sonarr' if path.startswith('/sonarr/') else 'Radarr'
            self.send_json(200, {'appName': app, 'version': 'lab-fixture'})
            return
        if path.endswith('/api/v3/health'):
            if path.startswith('/radarr/'):
                self.send_json(200, [{
                    'source': 'IndexerStatusCheck',
                    'type': 'warning',
                    'message': 'Indexer unavailable in lab fixture'
                }])
            else:
                self.send_json(200, [])
            return
        if path.endswith('/api/v3/queue'):
            count = 2 if path.startswith('/radarr/') else 0
            self.send_json(200, {'page': 1, 'pageSize': 20, 'totalRecords': count, 'records': []})
            return
        self.send_json(404, {'error': 'not found'})

    def log_message(self, format_string, *args):
        print('%s - %s' % (self.address_string(), format_string % args))

server = HTTPServer(('127.0.0.1', 8620), Handler)
print('Mock ARR API listening on http://127.0.0.1:8620')
server.serve_forever()
PY
### step
3

### title
Create the health collector

### instructions
The collector never writes the API key to its report. It treats queue size as context rather than as an automatic failure.

### command
cat > /opt/lab-classroom/class62/monitor.py <<'PY'
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path('/opt/lab-classroom/class62')
CONFIG = ROOT / 'instances.json'
REPORT = ROOT / 'report.json'


def request_json(base_url, endpoint, api_key):
    request = Request(
        base_url.rstrip('/') + endpoint,
        headers={'X-Api-Key': api_key, 'Accept': 'application/json'}
    )
    with urlopen(request, timeout=3) as response:
        return json.loads(response.read().decode('utf-8'))


def inspect(instance):
    result = {
        'name': instance['name'],
        'base_url': instance['base_url'],
        'state': 'unavailable',
        'application': None,
        'health_events': [],
        'queue_total': None,
        'error': None
    }
    try:
        status = request_json(instance['base_url'], '/api/v3/system/status', instance['api_key'])
        result['application'] = status.get('appName')
    except HTTPError as exc:
        result['error'] = 'system status returned HTTP ' + str(exc.code)
        return result
    except URLError as exc:
        result['error'] = 'system status connection failure: ' + str(exc.reason)
        return result
    except (ValueError, KeyError, TypeError) as exc:
        result['error'] = 'system status response error: ' + type(exc).__name__
        return result

    try:
        health = request_json(instance['base_url'], '/api/v3/health', instance['api_key'])
        if not isinstance(health, list):
            raise TypeError('health response is not a list')
        result['health_events'] = [
            {
                'source': item.get('source'),
                'type': item.get('type'),
                'message': item.get('message')
            }
            for item in health
            if isinstance(item, dict)
        ]
        result['state'] = 'degraded' if result['health_events'] else 'healthy'
    except (HTTPError, URLError, ValueError, TypeError) as exc:
        result['state'] = 'degraded'
        result['error'] = 'health query failed: ' + type(exc).__name__

    try:
        queue = request_json(instance['base_url'], '/api/v3/queue', instance['api_key'])
        result['queue_total'] = queue.get('totalRecords')
    except (HTTPError, URLError, ValueError, TypeError):
        if result['error'] is None:
            result['error'] = 'queue query failed'

    return result

config = json.loads(CONFIG.read_text(encoding='utf-8'))
results = [inspect(instance) for instance in config['instances']]
report = {
    'generated_at': datetime.now(timezone.utc).isoformat(),
    'instances': results,
    'summary': {
        state: sum(1 for item in results if item['state'] == state)
        for state in ('healthy', 'degraded', 'unavailable')
    }
}
REPORT.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
PY
### step
4

### title
Start the mock service

### instructions
Run this in the first terminal and leave it in the foreground.

### command
cd /opt/lab-classroom/class62 && python3 mock_arr.py
### step
5

### title
Run the monitor

### instructions
In the second terminal, execute the collector. It prints the same structured data that it writes to report.json.

### command
cd /opt/lab-classroom/class62 && python3 monitor.py
### step
6

### title
Verify deterministic classifications

### instructions
The verification checks states, queue context, health-event presence, and absence of the API key from the report.

### command
python3 - <<'PY'
import json
from pathlib import Path
report_path = Path('/opt/lab-classroom/class62/report.json')
report = json.loads(report_path.read_text(encoding='utf-8'))
by_name = {item['name']: item for item in report['instances']}
assert by_name['sonarr']['state'] == 'healthy'
assert by_name['sonarr']['health_events'] == []
assert by_name['sonarr']['queue_total'] == 0
assert by_name['radarr']['state'] == 'degraded'
assert len(by_name['radarr']['health_events']) == 1
assert by_name['radarr']['queue_total'] == 2
assert by_name['prowlarr']['state'] == 'unavailable'
assert by_name['prowlarr']['queue_total'] is None
assert report['summary'] == {'healthy': 1, 'degraded': 1, 'unavailable': 1}
assert 'class62-lab-key' not in report_path.read_text(encoding='utf-8')
print('Class 62 verification passed')
PY
### step
7

### title
Stop the fixture

### instructions
Return to the first terminal and press Ctrl-C. This stops the loopback-only mock API without modifying additional files.

### command
Use Ctrl-C in the terminal running mock_arr.py.

## Expected results

- The mock API announces that it is listening on 127.0.0.1 port 8620.
- The monitor creates /opt/lab-classroom/class62/report.json.
- Sonarr is classified as healthy with an empty health-event list and a queue total of zero.
- Radarr is classified as degraded because the fixture returns one application health warning.
- Radarr's queue total is recorded as two, but the nonzero queue is not independently treated as a failure.
- Prowlarr is classified as unavailable because its system-status request returns an intentional HTTP service error.
- The summary contains one healthy, one degraded, and one unavailable instance.
- The report does not contain the lab API key.
- The verification command prints Class 62 verification passed.

## Verification checkpoints

- [ ] Confirm that /opt/lab-classroom/class62/report.json is valid JSON by loading it with Python's json module.
- [ ] Confirm that the report contains exactly the instance names sonarr, radarr, and prowlarr.
- [ ] Confirm that Sonarr's state is healthy and its health_events value is an empty array.
- [ ] Confirm that Radarr's state is degraded and that its health_events array contains the fixture warning.
- [ ] Confirm that Prowlarr's state is unavailable and includes an HTTP-related system-status error.
- [ ] Confirm that queue_total is informational and does not change Radarr from degraded to unavailable.
- [ ] Confirm that the report summary is exactly one healthy, one degraded, and one unavailable instance.
- [ ] Confirm that the literal lab API key does not appear in report.json.
- [ ] Confirm that the mock service is no longer listening after Ctrl-C by rerunning the monitor and observing unavailable states; this optional check does not modify files outside the class workspace.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The workspace initialization reports that /opt/lab-classroom does not exist. | The classroom parent directory was not prepared before the lesson. | Ask the lab administrator to provide /opt/lab-classroom. Do not redirect the exercise to an unrelated production directory. |
| Initialization refuses to overwrite existing artifacts. | The lesson was previously run or files with the same names already exist. | Review the existing files. Preserve them if needed, or use the controlled rollback procedure before initializing the lesson again. |
| The mock server reports that the address is already in use. | Another process is already bound to 127.0.0.1:8620, possibly an earlier copy of the fixture. | Return to the terminal running the earlier fixture and stop it with Ctrl-C. Do not terminate unrelated processes without identifying them. |
| All three instances are reported as unavailable. | The mock server is not running, the collector was started before the server, or the configured port was changed in only one file. | Start mock_arr.py in the first terminal, confirm its listening message, and run monitor.py again without changing the supplied URLs. |
| Requests receive HTTP 401 responses. | The API key in instances.json no longer matches the key accepted by mock_arr.py. | Restore both files to the lab value class62-lab-key. In production, retrieve the correct key through an approved secret-management process rather than logging it. |
| The verification reports an unexpected Radarr state. | The Radarr health fixture was edited or the monitor's state logic was changed. | Confirm that /radarr/api/v3/health returns a JSON array containing one warning and that monitor.py assigns degraded when the health-event array is nonempty. |
| The report cannot be parsed as JSON. | monitor.py was interrupted during its write or the file was manually edited. | Ensure the mock service is running and execute monitor.py again to replace report.json with a complete report. |
| Production ARR endpoints work in a browser but fail in a future monitor. | Possible causes include an incorrect URL base, reverse-proxy path rewriting, certificate validation failure, missing API key, or API-version mismatch. | Test system status with a secret-safe API client, inspect the HTTP status and response content, verify the application's documented API path, and resolve certificate or proxy configuration instead of disabling validation. |

## Security considerations

### principles
Treat every ARR API key as a secret because it can authorize application changes as well as reads.
Use a dedicated secret store or protected runtime injection method for production monitoring credentials.
Do not place production API keys directly in source control, dashboard variables visible to users, chat messages, or shell command arguments.
Use HTTPS when requests cross an untrusted network and validate the service certificate.
Restrict monitoring network access to only the required ARR endpoints.
Expose only aggregate states and bounded labels to a metrics platform.
Avoid recording media titles, download paths, release names, indexer query strings, or full URLs unless an explicit diagnostic need and retention policy exist.
Use a monitoring identity with the least privilege supported by the application and surrounding infrastructure.
Rotate an API key if it appears in logs, command history, source control, or an exported report.
The lab fixture binds to loopback so it is not intentionally reachable from other hosts.

### production_note
The lab stores a nonproduction key in a local fixture configuration solely to demonstrate header authentication. That pattern is not a recommendation for managing production secrets.

### data_handling
Health reports may reveal application names, internal URLs, dependency failures, and media workflow details. Apply access controls and a retention policy appropriate to the homelab.

## Rollback

### goal
Stop the mock process and remove only the four known artifacts created by this lesson.

### procedure
Stop mock_arr.py with Ctrl-C if it is still running.
Inspect /opt/lab-classroom/class62 and confirm that the listed files are lesson artifacts.
Run the controlled cleanup command only after inspection.
The cleanup leaves the class62 directory in place and does not traverse subdirectories or use wildcard deletion.

### verification_command
python3 - <<'PY'
from pathlib import Path
root = Path('/opt/lab-classroom/class62').resolve()
for name in ['instances.json', 'mock_arr.py', 'monitor.py', 'report.json']:
    path = root / name
    print(name, 'present' if path.exists() else 'absent')
PY

### cleanup_command
python3 - <<'PY'
from pathlib import Path
root = Path('/opt/lab-classroom/class62').resolve()
expected = Path('/opt/lab-classroom/class62').resolve()
if root != expected:
    raise SystemExit('Unexpected cleanup root')
for name in ['instances.json', 'mock_arr.py', 'monitor.py', 'report.json']:
    path = (root / name).resolve()
    if path.parent != root:
        raise SystemExit('Refusing path outside class workspace')
    if path.is_file():
        path.unlink()
        print('Removed', path)
PY

### recovery
If a lesson artifact is removed unintentionally, recreate it by repeating the corresponding lab creation step. The cleanup procedure cannot recover unrelated data and must not be modified to include additional paths.

## Video narration notes

Welcome to Class 62, ARR Stack Health Monitoring. In this lesson, we are not merely checking whether a container exists or whether a port answers. We are building a layered view of service health. An ARR application can be running while an indexer is unavailable, a download client is disconnected, or a root folder is inaccessible. Conversely, a queue containing items can represent perfectly normal work.

Our collector begins with the system-status endpoint. If that request fails, the application is unavailable from the monitor's point of view. If it succeeds, we continue to the health endpoint and then collect queue context. An empty health list produces a healthy state. One or more application health events produce a degraded state. Queue size is recorded, but it does not independently create an incident.

The lab uses a loopback-only Python fixture rather than production services. Sonarr represents the healthy path. Radarr returns a warning about an intentionally unavailable fixture indexer. Prowlarr returns an intentional service failure. This gives us deterministic examples without changing a real media workflow.

Open two terminals. Create the isolated workspace, then create the mock API and monitoring program. Start the mock service in the first terminal. In the second terminal, run the monitor. Inspect the output and notice that the API key is absent. Sonarr should be healthy, Radarr degraded, and Prowlarr unavailable. The summary should contain one instance in each state.

Pay attention to the distinction between observations and policy. The monitor observes health events and queue totals. Your alerting policy decides how long a condition must persist and who should be notified. Those timing choices must come from your own reliability goals and environment, not from a universal threshold. Finally, protect production API keys, use encrypted transport across untrusted networks, keep metric labels bounded, and avoid exposing media details in dashboards or alerts.

## References

- Servarr Wiki, Sonarr System: https://wiki.servarr.com/sonarr/system
- Servarr Wiki, Radarr System: https://wiki.servarr.com/radarr/system
- Servarr Wiki, Prowlarr System: https://wiki.servarr.com/prowlarr/system
- Prometheus, Instrumentation Practices: https://prometheus.io/docs/practices/instrumentation/
- Prometheus, Metric and Label Naming: https://prometheus.io/docs/practices/naming/
- OWASP, Secrets Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- Python documentation, urllib.request: https://docs.python.org/3/library/urllib.request.html
- Python documentation, http.server: https://docs.python.org/3/library/http.server.html

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

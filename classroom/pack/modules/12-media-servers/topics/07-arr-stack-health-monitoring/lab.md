# Lab: ARR Stack Health Monitoring

**Module:** Requests & Media Servers
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Distinguish host reachability, HTTP availability, API authentication, application health, and queue state.

## Before you start

- Comfort using a Linux shell and Python 3.
- Basic understanding of HTTP status codes and JSON.
- Familiarity with the roles of Sonarr, Radarr, and Prowlarr.
- Permission to create files under /opt/lab-classroom/class62/.
- The directory /opt/lab-classroom/ must already exist.
- Two terminal sessions are recommended so the mock server and monitor can run separately.

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

## Verification

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

## Security

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

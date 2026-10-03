# Lab: ARR Stack Health Monitoring

**Module:** Requests & Media Servers
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Distinguish reachability, authentication, readiness, application health, dependency health, and workflow freshness

## Before you start

- Basic familiarity with Sonarr, Radarr, or another application in the ARR ecosystem
- Ability to run shell commands and Python 3 on a Linux host
- Basic understanding of JSON, HTTP status codes, and scheduled monitoring
- Awareness of Prometheus-style metric names and labels is helpful but not required
- Write access to /opt/lab-classroom/class62/

## Guided lab

### goal
Classify simulated Sonarr and Radarr instances, produce a JSON report, and export low-cardinality Prometheus-style metrics.

### scope
All files created, changed, or removed by this lab are confined to /opt/lab-classroom/class62/. The lab does not contact real ARR instances and does not require real API keys.

### steps
### step
1

### instruction
Create the isolated lab directory.

### command
mkdir -p /opt/lab-classroom/class62/
### step
2

### instruction
Create a fixture containing one healthy instance and one degraded instance.

### command
cat > /opt/lab-classroom/class62/fixtures.json <<'EOF'
{
  "instances": [
    {
      "app": "sonarr",
      "instance": "tv-main",
      "reachable": true,
      "authenticated": true,
      "health": [],
      "queue_depth": 0,
      "last_success_age_seconds": 120
    },
    {
      "app": "radarr",
      "instance": "movies-main",
      "reachable": true,
      "authenticated": true,
      "health": [
        {
          "type": "warning",
          "message": "Download client has been unavailable"
        }
      ],
      "queue_depth": 31,
      "last_success_age_seconds": 5400
    }
  ]
}
EOF
### step
3

### instruction
Create the classifier. The policy marks transport, authentication, and explicit application errors as critical. Application warnings, queue depths of 25 or more, and successful-work ages of one hour or more produce warning status.

### command
cat > /opt/lab-classroom/class62/arr_health_check.py <<'PY'
import json
from pathlib import Path

BASE = Path('/opt/lab-classroom/class62')
SOURCE = BASE / 'fixtures.json'
REPORT = BASE / 'health-report.json'
METRICS = BASE / 'arr-health.prom'

rank = {'ok': 0, 'warning': 1, 'critical': 2}
state_number = {'critical': 0, 'warning': 1, 'ok': 2}

def classify(item):
    states = ['ok']
    reasons = []

    if not item.get('reachable', False):
        states.append('critical')
        reasons.append('instance is unreachable')
    elif not item.get('authenticated', False):
        states.append('critical')
        reasons.append('API authentication failed')

    for check in item.get('health', []):
        check_type = str(check.get('type', '')).lower()
        if check_type in {'error', 'critical'}:
            states.append('critical')
            reasons.append(str(check.get('message', 'application health error')))
        elif check_type == 'warning':
            states.append('warning')
            reasons.append(str(check.get('message', 'application health warning')))

    if int(item.get('queue_depth', 0)) >= 25:
        states.append('warning')
        reasons.append('queue depth is at least 25')

    if int(item.get('last_success_age_seconds', 0)) >= 3600:
        states.append('warning')
        reasons.append('last successful work is at least one hour old')

    status = max(states, key=rank.get)
    return status, reasons

data = json.loads(SOURCE.read_text(encoding='utf-8'))
results = []
metric_lines = [
    '# HELP arr_monitor_up Whether the monitor reached and authenticated to the instance.',
    '# TYPE arr_monitor_up gauge',
    '# HELP arr_monitor_health_state Normalized state: 0 critical, 1 warning, 2 ok.',
    '# TYPE arr_monitor_health_state gauge',
    '# HELP arr_monitor_queue_depth Number of queued items reported by the fixture.',
    '# TYPE arr_monitor_queue_depth gauge',
    '# HELP arr_monitor_last_success_age_seconds Age of the last successful work event.',
    '# TYPE arr_monitor_last_success_age_seconds gauge'
]

for item in data['instances']:
    status, reasons = classify(item)
    app = item['app']
    instance = item['instance']
    labels = f'app="{app}",instance="{instance}"'
    up = 1 if item.get('reachable') and item.get('authenticated') else 0
    result = {
        'app': app,
        'instance': instance,
        'status': status,
        'reasons': reasons,
        'queue_depth': int(item.get('queue_depth', 0)),
        'last_success_age_seconds': int(item.get('last_success_age_seconds', 0))
    }
    results.append(result)
    metric_lines.extend([
        f'arr_monitor_up{{{labels}}} {up}',
        f'arr_monitor_health_state{{{labels}}} {state_number[status]}',
        f'arr_monitor_queue_depth{{{labels}}} {result["queue_depth"]}',
        f'arr_monitor_last_success_age_seconds{{{labels}}} {result["last_success_age_seconds"]}'
    ])

REPORT.write_text(json.dumps({'results': results}, indent=2) + '\n', encoding='utf-8')
METRICS.write_text('\n'.join(metric_lines) + '\n', encoding='utf-8')
print(f'wrote {REPORT}')
print(f'wrote {METRICS}')
PY
### step
4

### instruction
Run the classifier without creating Python bytecode files.

### command
python3 -B /opt/lab-classroom/class62/arr_health_check.py
### step
5

### instruction
Inspect the normalized report and exported metrics.

### command
cat /opt/lab-classroom/class62/health-report.json && printf '\n--- metrics ---\n' && cat /opt/lab-classroom/class62/arr-health.prom
### step
6

### instruction
Simulate an authentication failure by changing only the laboratory fixture, then rerun the classifier.

### command
python3 -B -c "import json; from pathlib import Path; p=Path('/opt/lab-classroom/class62/fixtures.json'); d=json.loads(p.read_text()); d['instances'][0]['authenticated']=False; p.write_text(json.dumps(d, indent=2)+'\n')" && python3 -B /opt/lab-classroom/class62/arr_health_check.py
### step
7

### instruction
Confirm that the simulated Sonarr instance is now critical and has an up value of zero.

### command
grep -E '"status": "critical"|arr_monitor_up\{app="sonarr",instance="tv-main"\} 0' /opt/lab-classroom/class62/health-report.json /opt/lab-classroom/class62/arr-health.prom

### production_adaptation
Replace fixture loading with application-specific API requests using documented endpoints for the installed release.
Apply connection and total-request timeouts so a failed instance cannot stall the entire collection cycle.
Store credentials in a protected secret mechanism rather than source code, command history, metrics, or dashboard variables.
Validate the returned application identity before accepting the data.
Add queue age, failed task count, storage availability, and dependency status only when each signal has an operational response.
Test alert firing and recovery during an approved maintenance window before enabling notifications.

## Expected results

- The initial report classifies sonarr/tv-main as ok.
- The initial report classifies radarr/movies-main as warning because it has an application warning, a queue depth of 31, and stale successful work.
- The initial metric for sonarr/tv-main health state is 2.
- The initial metric for radarr/movies-main health state is 1.
- After the authentication-failure simulation, sonarr/tv-main is classified as critical.
- After the authentication-failure simulation, arr_monitor_up for sonarr/tv-main is 0.
- All generated files remain under /opt/lab-classroom/class62/.

## Verification

- [ ] Run: python3 -B /opt/lab-classroom/class62/arr_health_check.py
- [ ] Run: python3 -B -m json.tool /opt/lab-classroom/class62/health-report.json
- [ ] Run: grep -F 'arr_monitor_health_state{app="radarr",instance="movies-main"} 1' /opt/lab-classroom/class62/arr-health.prom
- [ ] Run after the authentication-failure simulation: grep -F 'arr_monitor_up{app="sonarr",instance="tv-main"} 0' /opt/lab-classroom/class62/arr-health.prom
- [ ] Run: find /opt/lab-classroom/class62/ -maxdepth 1 -type f -printf '%f\n' | sort
- [ ] Confirm that the listed files are fixtures.json, arr_health_check.py, health-report.json, and arr-health.prom.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| python3 reports that the command is unavailable. | Python 3 is not installed or is not present in the command search path. | Install Python 3 using the host's approved package-management process, then rerun the lab. Do not replace the script with an unreviewed network-downloaded installer. |
| Permission is denied while creating the lab directory or files. | The current user does not have write permission to /opt/lab-classroom/. | Have the lab administrator create /opt/lab-classroom/class62/ and assign it to the classroom user according to local policy. Do not broaden permissions globally. |
| The script reports that fixtures.json does not exist. | The fixture creation step was skipped, failed, or was saved under another path. | Repeat the fixture step exactly and verify that /opt/lab-classroom/class62/fixtures.json exists. |
| A JSON decoding error appears. | The fixture was edited into invalid JSON, often because of a missing comma, quote, or brace. | Validate the fixture with python3 -B -m json.tool /opt/lab-classroom/class62/fixtures.json and correct the location reported by the parser. |
| A real ARR instance is reachable in a browser but a future production collector reports authentication failure. | The API key is incorrect, the expected authentication header is not being used, or an intermediary is removing the header. | Confirm the API requirements in the application's local API documentation, issue a dedicated monitoring credential where supported, and test the request path without printing the credential. |
| Alerts appear during every scheduled restart. | The alert evaluates a single failed collection without a pending period or maintenance suppression. | Require the condition to persist across multiple collection intervals and define a maintenance process that does not hide unexpected long outages. |
| The monitor is healthy but imports remain stalled. | The monitor checks only basic reachability and does not evaluate queues, task freshness, storage, or download-client health. | Add workflow-level signals and test a known degraded condition rather than treating an HTTP response as full service health. |
| Metric storage grows unexpectedly. | Unbounded values such as titles, release names, messages, or URLs were added as labels. | Retain only bounded labels such as application and instance. Move detailed text to protected diagnostic logs. |

## Security

### principles
Treat ARR API keys as secrets because they commonly permit extensive application control, not merely health reads.
Use a dedicated monitoring credential with the least privilege available in the installed product.
Keep secrets out of source files, shell history, process arguments, metric labels, annotations, and dashboard URLs.
Limit monitoring-network access to only the required application endpoints.
Use encrypted transport when traffic crosses an untrusted network.
Set strict request timeouts and response-size limits in a production collector.
Validate response content and application identity instead of trusting a successful status code alone.
Protect exported metrics if they reveal hostnames, library structure, operational schedules, or internal topology.
Rotate a credential immediately if it appears in a report, screenshot, repository, or metric payload.

### data_minimization
Export state and counts rather than titles, release names, download paths, indexer queries, or full application messages. Detailed operational records should remain in access-controlled logs with an appropriate retention period.

### secret_handling
The classroom lab uses no real secret. A production implementation should obtain each credential from an approved secret store or protected runtime secret file and must redact credentials from exceptions and debug output.

## Rollback

### impact
The lab is isolated and does not alter real ARR instances. Rollback removes only the four known classroom files and then removes the class directory if it is empty.

### command
python3 -B -c "from pathlib import Path; b=Path('/opt/lab-classroom/class62'); names=('fixtures.json','arr_health_check.py','health-report.json','arr-health.prom'); [(b/n).unlink(missing_ok=True) for n in names]; b.rmdir()"

### verification
Run: test ! -e /opt/lab-classroom/class62/ && echo 'class62 lab removed'

### recovery
If the files are needed again, repeat the lab creation steps. No production configuration or application data is involved.

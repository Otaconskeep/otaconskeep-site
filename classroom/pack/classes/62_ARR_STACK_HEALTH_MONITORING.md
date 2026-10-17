# Class 62: ARR Stack Health Monitoring

**Learning objective:** Distinguish reachability, authentication, readiness, application health, dependency health, and workflow freshness; Interpret ARR health records without treating every warning as an outage; Create a repeatable health-classification policy with ok, warning, and critical states; Generate low-cardinality Prometheus-style metrics from normalized health data; Design alerts that account for persistence, maintenance, and dependency failures; Protect ARR API keys and avoid exposing secrets through metrics, logs, or dashboards; Verify monitor behavior with known-good and degraded test fixtures
**Bloom level:** Understand / Apply
**Track:** Observability and Media Automation · **Difficulty:** intermediate · **Duration:** ~75 minutes · **Lab risk:** low
**Build output:** Build a practical health-monitoring model for Sonarr, Radarr, Lidarr, Readarr, Prowlarr, and similar applications without confusing basic process availability with actual service health. The lesson uses simulated application data to teach status classification, actionable metrics, alert design, verification, and safe handling of API credentials.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-02-25
**Compatibility:** ### lab_platform
Linux environment with a POSIX-compatible shell, Python 3.8 or later, and write access to /opt/lab-classroom/class62/.

### arr_versions
The monitoring concepts apply broadly across current ARR-family applications, but API paths, version prefixes, authentication behavior, status fields, and health schemas differ by application and release.

### production_note
Use the API documentation exposed by the exact installed application version. Do not assume that a Sonarr API path or response schema is identical to Radarr, Lidarr, Readarr, or Prowlarr.

### metrics
The generated text follows the Prometheus text exposition style but is not installed into a node exporter directory and is not automatically scraped.

### containers
The lab does not require containers and does not modify container configuration, volumes, or application databases.

## Learning objective

- Distinguish reachability, authentication, readiness, application health, dependency health, and workflow freshness
- Interpret ARR health records without treating every warning as an outage
- Create a repeatable health-classification policy with ok, warning, and critical states
- Generate low-cardinality Prometheus-style metrics from normalized health data
- Design alerts that account for persistence, maintenance, and dependency failures
- Protect ARR API keys and avoid exposing secrets through metrics, logs, or dashboards
- Verify monitor behavior with known-good and degraded test fixtures

## Why this matters

Build a practical health-monitoring model for Sonarr, Radarr, Lidarr, Readarr, Prowlarr, and similar applications without confusing basic process availability with actual service health. The lesson uses simulated application data to teach status classification, actionable metrics, alert design, verification, and safe handling of API credentials.

## Prerequisites

- Basic familiarity with Sonarr, Radarr, or another application in the ARR ecosystem
- Ability to run shell commands and Python 3 on a Linux host
- Basic understanding of JSON, HTTP status codes, and scheduled monitoring
- Awareness of Prometheus-style metric names and labels is helpful but not required
- Write access to /opt/lab-classroom/class62/

## Required reading

- Review the System, Health, Queue, and Tasks pages in at least one ARR application used in your homelab.
- Review the API documentation exposed by your installed ARR application, because endpoint versions differ among applications and releases.
- Read the Prometheus guidance on metric and label naming.
- Read the Prometheus guidance on alerting rules and the use of a pending duration before an alert fires.

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

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

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Inventory every ARR instance in your homelab and identify its application version, API documentation location, dependencies, expected work interval, and maintenance schedule.
Draft warning and critical thresholds for queue age and task freshness based on your real usage pattern. Explain why each threshold is actionable.
Design an alert dependency tree covering the host, storage, download client, indexer manager, and ARR applications.
Extend the lab fixture with one unreachable instance and one instance containing an explicit error. Confirm that both become critical.
Add an oldest_queue_item_age_seconds field to the fixture, report, and metrics output without adding item names as labels.
Write a test plan that proves alert firing, notification delivery, acknowledgement, recovery, and maintenance suppression.

## Feynman teach-back

### prompt
Explain ARR health monitoring to a new homelab operator without using the words observability, telemetry, or endpoint.

### model_explanation
Seeing that Sonarr is running is like seeing the lights on in a workshop. It does not prove that supplies arrived, tools work, or finished products can leave. A good checker asks several questions: can it reach Sonarr, is it allowed to ask for information, does Sonarr report a problem, are downloads piling up, and has useful work happened recently? The answers are reduced to a simple state, but the reasons are preserved for troubleshooting. Short interruptions are allowed to recover before a notification is sent. If a shared service fails, the operator receives one useful explanation instead of many duplicate alarms.

### self_check
Can you explain why a successful connection does not prove that imports work?
Can you state which conditions in the lab become critical?
Can you explain why media titles should not be metric labels?
Can you describe how a persistence period reduces alert noise?
Can you identify a shared dependency that may affect several ARR applications at once?

## Retrieval check

1. 1. Why is a successful connection to an ARR web port insufficient proof of service health?
2. 2. Which two failures does the lab classify as critical before examining application health records?
3. 3. Why should release names and media titles not be used as Prometheus-style metric labels?
4. 4. What numeric values does the lab use for critical, warning, and ok health states?
5. 5. Why should an alert normally require a condition to persist across multiple collection intervals?
6. 6. What is the difference between queue depth and queue age?
7. 7. Why should downstream ARR alerts be inhibited during a confirmed host outage?
8. 8. What should a production collector do with an ARR API key?
9. 9. In the initial fixture, why is the Radarr instance classified as warning?
10. 10. What additional evidence would help detect an ARR process that is running but no longer completing useful work?

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

## Verification checkpoints

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

## Security considerations

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

## Video narration notes

Class 62 moves beyond the simplest question in monitoring: is the process running? In an ARR stack, a running process can still be unable to search, download, import, rename, or update a library. We begin by separating reachability from authentication. A monitor that cannot connect has a different failure from one that connects but presents an invalid credential. We then inspect application health records and workflow indicators. Queue depth is useful, but it needs context. Thirty new items during a planned import may be expected, while one item blocked for two days may require action. Freshness tells us whether expected work has completed recently.

The lab creates two simulated instances. Sonarr starts healthy. Radarr starts in a warning state because it reports a dependency warning, has a queue depth above the classroom threshold, and has not completed successful work within one hour. The classifier reduces these signals into a documented state while preserving the reasons in a JSON report. It also emits Prometheus-style metrics. Notice that the labels contain only application and instance. We intentionally exclude media names, release names, paths, URLs, and error messages because those values are unbounded and may reveal private information.

Next, the lab changes Sonarr's simulated authentication result. The collector marks the instance critical and changes its up metric to zero. This demonstrates why network availability and authentication must be represented separately from application warnings. In production, a collector would query the documented API for each installed application and release, apply strict timeouts, normalize the responses, and obtain credentials from a protected secret source.

Finally, think about notification quality. A single missed check should rarely wake an operator. Require failures to persist, group related alerts, and suppress downstream symptoms when a host or shared dependency has already failed. A dashboard shows state; an alert should identify a sustained condition with a clear response. Monitoring is not finished when a graph appears. It is finished only after healthy, failed, and recovered states have all been tested.

## References

- Prometheus metric and label naming guidance: https://prometheus.io/docs/practices/naming/
- Prometheus alerting rule documentation: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
- Prometheus instrumentation guidance: https://prometheus.io/docs/practices/instrumentation/
- Prometheus alerting practices: https://prometheus.io/docs/practices/alerting/
- Sonarr project documentation: https://wiki.servarr.com/sonarr
- Radarr project documentation: https://wiki.servarr.com/radarr
- Lidarr project documentation: https://wiki.servarr.com/lidarr
- Prowlarr project documentation: https://wiki.servarr.com/prowlarr

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

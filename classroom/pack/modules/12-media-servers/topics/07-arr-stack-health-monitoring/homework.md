# Homework: ARR Stack Health Monitoring

**Module:** Requests & Media Servers
**Activity type:** Homework / independent application
**Objective:** Distinguish reachability, authentication, readiness, application health, dependency health, and workflow freshness

## Requirements

Inventory every ARR instance in your homelab and identify its application version, API documentation location, dependencies, expected work interval, and maintenance schedule.
Draft warning and critical thresholds for queue age and task freshness based on your real usage pattern. Explain why each threshold is actionable.
Design an alert dependency tree covering the host, storage, download client, indexer manager, and ARR applications.
Extend the lab fixture with one unreachable instance and one instance containing an explicit error. Confirm that both become critical.
Add an oldest_queue_item_age_seconds field to the fixture, report, and metrics output without adding item names as labels.
Write a test plan that proves alert firing, notification delivery, acknowledgement, recovery, and maintenance suppression.

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz

# Homework: Notifications for Downloads, Failures, and Requests

**Module:** Requests & Media Servers
**Activity type:** Homework / independent application
**Objective:** Distinguish informational download notifications from actionable failure notifications.

## Requirements

Add a synthetic download.warning event and define its route, severity, subject, and body. Keep every modified file under /opt/lab-classroom/class63/.
Extend the processor so malformed input is recorded in a local dead-letter file instead of stopping all subsequent event processing.
Add a created_at field to generated notifications using a supplied event timestamp so test output remains deterministic.
Design a policy that escalates a failed download only after a chosen number of attempts. Explain the operational reason for the threshold rather than claiming a universal best value.
Write a short notification-content policy listing which fields are approved, conditionally approved, and prohibited for your own homelab.

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz

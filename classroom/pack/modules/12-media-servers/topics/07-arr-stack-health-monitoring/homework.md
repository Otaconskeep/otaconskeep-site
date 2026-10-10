# Homework: ARR Stack Health Monitoring

**Module:** Requests & Media Servers
**Activity type:** Homework / independent application
**Objective:** Distinguish host reachability, HTTP availability, API authentication, application health, and queue state.

## Requirements

### tasks
Extend the fixture with a Lidarr prefix that returns a successful system-status response and one error-type health event.
Extend the monitor so error records include a bounded category such as authentication, transport, server, or response-format while excluding secrets and response bodies.
Add a report field indicating whether each queue query succeeded separately from queue_total.
Write a notification policy that treats total API loss differently from an indexer warning. Base timing on your own service objectives rather than copying an arbitrary interval.
Design a bounded metric set for instance availability, active health-event count, queue count, and collection success. List allowed labels and explain why media titles are excluded.

### submission
Submit the revised source files, one sanitized report, the notification policy, and a short explanation of the state model. Keep all submitted lab artifacts under /opt/lab-classroom/class62/ and do not include production credentials.

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz

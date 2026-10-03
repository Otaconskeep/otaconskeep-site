# Lesson 12.07: ARR Stack Health Monitoring

**Module:** Requests & Media Servers
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Distinguish reachability, authentication, readiness, application health, dependency health, and workflow freshness
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-02-25

## Learning objective

Distinguish reachability, authentication, readiness, application health, dependency health, and workflow freshness

## Why this matters

Build a practical health-monitoring model for Sonarr, Radarr, Lidarr, Readarr, Prowlarr, and similar applications without confusing basic process availability with actual service health. The lesson uses simulated application data to teach status classification, actionable metrics, alert design, verification, and safe handling of API credentials.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

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

## Reflection

1. What did I learn?
2. What did I struggle with?
3. How does this connect to earlier classes?

## Topic path (do in order)

| Step | Activity | Purpose |
|---|---|---|
| 1 | [Reading](./reading.md) | Learn |
| 2 | This lesson (Feynman) | Explain |
| 3 | [Lab](./lab.md) | Practice |
| 4 | [Homework](./homework.md) | Apply |
| 5 | [Quiz](./quiz.md) | Test |

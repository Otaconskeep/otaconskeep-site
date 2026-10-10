# Lesson 12.07: ARR Stack Health Monitoring

**Module:** Requests & Media Servers
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Distinguish host reachability, HTTP availability, API authentication, application health, and queue state.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-02-20

## Learning objective

Distinguish host reachability, HTTP availability, API authentication, application health, and queue state.

## Why this matters

Teach operators how to monitor Sonarr, Radarr, Prowlarr, and similar ARR applications by separating process reachability, API availability, application health events, and workload indicators. The lab uses isolated mock ARR endpoints so students can safely test healthy, degraded, and unavailable states without changing a production media stack.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

Explain to a new operator why a successful ping or open TCP port does not prove that Sonarr is healthy.
Explain the difference between unavailable and degraded without using the words liveness or readiness.
Explain why two queued Radarr items do not automatically indicate an incident.
Describe what the monitor does when the system-status request fails and why it skips dependent conclusions.
Explain why API keys and media titles should not become metric labels.
Draw the request flow from collector to system status, health, queue, report, and alert destination.
Describe how you would distinguish a bad API key from an application process that is not listening.

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

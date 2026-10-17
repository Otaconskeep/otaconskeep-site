# Lesson 13.01: Reverse Proxy Fundamentals

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Distinguish a reverse proxy from a forward proxy and from direct client-to-service access
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Distinguish a reverse proxy from a forward proxy and from direct client-to-service access

## Why this matters

Explain how a reverse proxy accepts client requests, forwards them to an upstream service, returns upstream responses, and creates a controlled boundary for routing, logging, TLS termination, authentication, and policy enforcement.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

Explain the lab as if teaching a new student: The client thinks port 18081 is the service, but that port belongs to the proxy. The proxy receives the request and makes a second request to the real application on port 18080. The application therefore sees the proxy as its immediate network peer. To preserve useful client context, the proxy adds forwarding headers, but those headers are trustworthy only because the proxy replaces values supplied by an untrusted client. If the application returns 503, the proxy can relay that application response. If the application cannot be reached at all, the proxy generates 502. If this explanation is unclear, draw the two separate TCP connections and label which process generates each status code.

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

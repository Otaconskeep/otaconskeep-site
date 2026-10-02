# Lesson 13.05: Tailscale for Homelab Remote Access

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain how Tailscale separates its coordination control plane from its encrypted data plane
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-02-28

## Learning objective

Explain how Tailscale separates its coordination control plane from its encrypted data plane

## Why this matters

Teach learners how Tailscale can provide identity-aware remote access to homelab services without directly exposing those services to the public internet. The lesson explains the control plane, WireGuard-based data plane, peer-to-peer connectivity, DERP relays, device identity, access policy, subnet routers, exit nodes, MagicDNS, and a staged deployment method. The lab produces and validates a deployment design entirely within /opt/lab-classroom/class68/ and does not enroll the host, change network settings, publish routes, or modify an existing tailnet.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain Tailscale remote access to a technically curious family member without using the phrase 'it is just a VPN.' Include identity, direct paths, relays, subnet routers, and least privilege.

### model_explanation
Each approved device receives a private cryptographic identity. A coordination service introduces devices and tells them what communication is permitted, but the devices encrypt application traffic for each other. They try to communicate directly; when the networks do not permit that, an encrypted packet relay can pass the traffic without becoming the application endpoint. A server can join directly and have its own identity, or a subnet router can provide a controlled path to older devices that cannot join. Access rules should let each person reach only the systems and services needed for their role. The application still needs its own accounts, updates, and logs because a private encrypted path does not make the application automatically safe.

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

# Lesson 13.05: Tailscale for Homelab Remote Access

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain the roles of the Tailscale coordination service, node identity, WireGuard tunnels, and DERP relays
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Explain the roles of the Tailscale coordination service, node identity, WireGuard tunnels, and DERP relays

## Why this matters

Teach learners how Tailscale creates an identity-aware private network for remote homelab access, how direct and relayed connections differ, how routes and exit nodes affect traffic, and how to design least-privilege access without exposing management services directly to the public internet. The lab performs a read-only inspection of an existing Tailscale installation when available and stores all generated artifacts under /opt/lab-classroom/class68/.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

Explain Tailscale to a new homelab operator without using the phrase 'magic VPN.' Start with two devices that each authenticate and obtain an identity. Explain that the coordination service introduces authorized peers but normally does not carry their application traffic. Describe how the peers prefer a direct encrypted WireGuard path and can use an encrypted DERP relay when direct connectivity fails. Then explain why connectivity is not the same as authorization: policy still decides which identity may reach which service, and the destination application should still authenticate its user. Finally, contrast a subnet router, which provides access to selected private prefixes, with an exit node, which carries general internet traffic. If the learner cannot explain those distinctions clearly, revisit the architecture and terminology sections.

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

# Lesson 13.06: WireGuard Fundamentals and Deployment

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Describe WireGuard's peer-to-peer architecture and public-key identity model
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Describe WireGuard's peer-to-peer architecture and public-key identity model

## Why this matters

Explain WireGuard's cryptographic peer model, routing behavior, configuration structure, and safe deployment workflow. The lab generates real WireGuard keys and validates paired server and client configurations without creating interfaces, changing routes, enabling forwarding, or modifying files outside the class workspace.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain WireGuard to a classmate without using the phrases virtual private network or magic tunnel. Include how a peer knows whom to encrypt for, how the receiver validates an inner source address, and why a handshake does not guarantee that an application will work.

### model_explanation
Each participant keeps a secret key and gives the matching public key to trusted participants. When the operating system sends a packet toward a configured prefix, WireGuard uses AllowedIPs to choose which peer should receive it and encrypts it for that peer. The receiver proves which public-key identity sent the packet and accepts the packet's inner source only if that source belongs to the AllowedIPs assigned to the authenticated peer. A handshake confirms identity and basic encrypted UDP reachability, but the packet may still encounter an incorrect route, forwarding policy, packet-filter decision, name-resolution problem, or unavailable application.

### self_check
Can you clearly separate transport addresses from tunnel addresses?
Can you describe both the outbound and inbound meanings of AllowedIPs?
Can you explain why the stable peer may omit an Endpoint for a roaming peer?
Can you explain why PersistentKeepalive is situational rather than universally required?

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

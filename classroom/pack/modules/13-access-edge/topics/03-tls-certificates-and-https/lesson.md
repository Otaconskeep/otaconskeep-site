# Lesson 13.03: TLS Certificates and HTTPS

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain the roles of a private key, public key, certificate signing request, certificate, certificate authority, and trust store.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Explain the roles of a private key, public key, certificate signing request, certificate, certificate authority, and trust store.

## Why this matters

Teach learners how TLS certificates establish server identity, how certificate authorities and trust stores participate in verification, and how to generate, inspect, serve, and validate a private HTTPS certificate without modifying the host trust store.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain to a new homelab administrator why a browser can receive an encrypted response yet still reject the connection, and explain why adding a private CA fixes only some certificate errors.

### model_explanation
Encryption means outsiders should not be able to read the connection, but the client also needs evidence that it is speaking to the intended server. The server presents a certificate and proves it owns the related private key. The client then checks whether a trusted CA signed the certificate, whether it is currently valid and authorized for server use, and whether its SAN matches the requested name. Giving the client a private CA certificate can establish a trusted signing path. It does not repair an expired certificate, an invalid usage, a bad signature, or a hostname mismatch. Trusting an issuer and verifying a service identity are separate checks, and both must succeed.

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

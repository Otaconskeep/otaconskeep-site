# Lesson 13.03: TLS Certificates and HTTPS

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain the roles of encryption, integrity, authentication, and certificate trust in TLS.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Explain the roles of encryption, integrity, authentication, and certificate trust in TLS.

## Why this matters

Understand how TLS certificates establish server identity and encrypted transport, then build and verify a private certificate authority, a locally trusted server certificate, and a loopback-only HTTPS service.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain TLS to a peer without using the phrases secure because it is encrypted or the certificate is trusted because it is valid.

### model_explanation
A server has a private key and publishes a certificate containing the related public key and the names it is allowed to use. A certificate authority signs that certificate. A client begins with a CA certificate it already accepts, verifies the signature path, checks time and intended usage, and confirms that the requested hostname or IP address appears in the server certificate. During the handshake, the server proves possession of its private key without sending that key. The peers derive temporary symmetric keys and use them to protect HTTP data. If identity checking is skipped, the connection may be encrypted but could still terminate at the wrong server.

### self_check
Can you explain why a certificate may be shared but its private key must remain secret?
Can you explain why a correctly signed certificate can still fail for the requested hostname?
Can you explain why a private root is not automatically trusted by clients?
Can you describe what must be replaced after a server private-key compromise?

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

# Reading: TLS Certificates and HTTPS

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Explain the roles of a private key, public key, certificate signing request, certificate, certificate authority, and trust store.

## Vocabulary

| Term | Meaning |
|---|---|
| TLS | Transport Layer Security, the protocol used to authenticate peers and protect application data in transit. |
| HTTPS | HTTP carried inside a TLS-protected connection. |
| Private key | Secret cryptographic key retained by its owner. A TLS server uses it to prove possession of the key associated with its certificate. |
| Public key | The non-secret portion of an asymmetric key pair. A certificate binds a public key to an asserted identity. |
| Certificate | A signed data structure containing a public key, identity information, validity dates, issuer information, and extensions that constrain its use. |
| Certificate authority | An entity whose private key signs certificates. A client accepts a chain only when it reaches a CA the client trusts and all verification rules pass. |
| CSR | Certificate Signing Request, which contains a public key and requested identity or extension information and is signed by the corresponding private key. |
| SAN | Subject Alternative Name, the certificate extension used to identify valid DNS names or IP addresses for modern hostname verification. |
| Trust store | A collection of trusted CA certificates used by a client as trust anchors during certificate path validation. |
| Certificate chain | An ordered relationship from a leaf certificate through any intermediate CAs to a trusted root CA. |
| Leaf certificate | The end-entity certificate presented by a server or client rather than a certificate used to issue other certificates. |
| Hostname verification | The client check that the requested service name matches an authorized identity in the certificate, normally a SAN entry. |
| SNI | Server Name Indication, a TLS extension through which a client tells a server which hostname it is attempting to reach. |

## Instruction

TLS solves several related but distinct problems. During an HTTPS connection, the client and server negotiate protocol parameters, establish shared session secrets, and authenticate at least the server in the usual web deployment. The server presents a certificate containing its public key and identity claims. It also proves possession of the matching private key as part of the handshake. The client must not accept the certificate merely because it is syntactically valid or because the connection is encrypted. It builds and validates a certification path to a locally trusted CA, checks signatures and validity periods, evaluates certificate constraints and usages, and verifies that the requested service name matches a Subject Alternative Name. A connection can therefore be encrypted while still being vulnerable to impersonation if certificate validation is disabled.

A certificate authority is trusted because the client has intentionally configured its certificate as a trust anchor, not because the CA certificate calls itself a CA. Public web browsers and operating systems ship with managed trust stores. A private homelab CA can provide the same signing relationship for internal services, but its root key must be carefully protected and its root certificate must be distributed through an intentional process. This lab does not install its CA into the host trust store. Instead, each verification command explicitly points to the lab CA file. That containment prevents the exercise from silently granting broad trust to a temporary key.

The private key and certificate serve different purposes. The certificate is normally public and may be sent to every client. The private key must stay on the server and should be readable only by the service account that needs it. If an attacker obtains the private key, the attacker may be able to impersonate the service until clients reject or stop trusting the certificate. File permissions are one layer of protection; encryption at rest, secret-management systems, access controls, audit logs, short certificate lifetimes, and a practiced replacement procedure may also be appropriate.

Modern service identity belongs in the SAN extension. The legacy Common Name remains visible in many tools, but clients generally use SAN entries for hostname verification. In this lab, the certificate authorizes the DNS name localhost but deliberately does not authorize the IP address 127.0.0.1. The TLS server is reachable through that address, yet IP identity verification fails. This demonstrates that network reachability and certificate identity are independent checks. Supplying the lab CA fixes an unknown-issuer error, but it does not override a name mismatch.

TLS is also not a complete application security boundary. HTTPS protects data while it travels between authenticated endpoints, but it cannot repair weak passwords, vulnerable application code, excessive authorization, compromised endpoints, malicious trusted CAs, or exposed private keys. Operational TLS additionally requires renewal monitoring, supported protocol and cipher configuration, complete certificate chains, accurate system time, and careful proxy or load-balancer configuration. A secure homelab should automate certificate issuance and renewal only after the administrator understands where keys are stored, which identities are authorized, and how failures will be detected.

## Architecture

### components
### name
Lab root CA

### location
/opt/lab-classroom/class66/ca.crt and /opt/lab-classroom/class66/ca.key

### role
Signs the temporary localhost server certificate. It is trusted only when commands explicitly reference ca.crt.
### name
Leaf certificate and key

### location
/opt/lab-classroom/class66/server.crt and /opt/lab-classroom/class66/server.key

### role
Provide the HTTPS endpoint identity and proof-of-possession key material.
### name
OpenSSL test server

### location
127.0.0.1:8443

### role
Presents the leaf certificate over a temporary loopback-only TLS listener.
### name
Verification clients

### location
Local OpenSSL and curl processes

### role
Validate the chain, service identity, handshake, and HTTPS response.

### trust_flow
The lab root CA signs the server certificate.
The server presents the signed leaf certificate and proves possession of server.key.
The client is explicitly given ca.crt as its trust anchor.
The client validates the signature chain, certificate constraints, validity period, intended server usage, and requested hostname.
Application data is exchanged only after the TLS handshake succeeds.

### scope_boundary
All generated files remain under /opt/lab-classroom/class66/. The server listens only on 127.0.0.1, and the lab CA is never installed into a system or browser trust store.

## Required reading

- OpenSSL verification options: https://docs.openssl.org/3.0/man1/openssl-verify/
- OpenSSL certificate utility: https://docs.openssl.org/3.0/man1/openssl-x509/
- RFC 8446, The Transport Layer Security Protocol Version 1.3: https://www.rfc-editor.org/rfc/rfc8446
- RFC 5280, Internet X.509 Public Key Infrastructure Certificate and CRL Profile: https://www.rfc-editor.org/rfc/rfc5280
- RFC 6125, Service Identity in TLS: https://www.rfc-editor.org/rfc/rfc6125

## References

- OpenSSL s_server documentation: https://docs.openssl.org/3.0/man1/openssl-s_server/
- OpenSSL s_client documentation: https://docs.openssl.org/3.0/man1/openssl-s_client/
- OpenSSL req documentation: https://docs.openssl.org/3.0/man1/openssl-req/
- OpenSSL x509 documentation: https://docs.openssl.org/3.0/man1/openssl-x509/
- OpenSSL verify documentation: https://docs.openssl.org/3.0/man1/openssl-verify/
- curl TLS certificate verification documentation: https://curl.se/docs/sslcerts.html
- RFC 5280, Internet X.509 Public Key Infrastructure Certificate and CRL Profile: https://www.rfc-editor.org/rfc/rfc5280
- RFC 6125, Representation and Verification of Service Identity: https://www.rfc-editor.org/rfc/rfc6125
- RFC 8446, The Transport Layer Security Protocol Version 1.3: https://www.rfc-editor.org/rfc/rfc8446

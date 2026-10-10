# Reading: TLS Certificates and HTTPS

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Explain the roles of encryption, integrity, authentication, and certificate trust in TLS.

## Vocabulary

| Term | Meaning |
|---|---|
| TLS | Transport Layer Security, the protocol used to authenticate peers and protect application data against disclosure and modification while it travels over a network. |
| HTTPS | HTTP carried inside a TLS-protected connection. |
| Private key | Secret cryptographic material used to prove possession of an identity and perform operations such as digital signatures. It must not be distributed with the certificate. |
| Public key | The non-secret half of an asymmetric key pair. A certificate binds a public key to an asserted identity. |
| X.509 certificate | A signed data structure containing a public key, identity information, validity dates, issuer information, extensions, and a digital signature. |
| Certificate authority | An entity whose certificate-signing key is used to issue and sign certificates for other identities. |
| Trust anchor | A CA certificate that a client explicitly accepts as a starting point for certificate-path validation. |
| Certificate signing request | A signed request containing a public key and requested identity information that is submitted to a certificate authority. |
| Subject Alternative Name | The certificate extension that lists the DNS names and IP addresses for which a certificate is valid. |
| Certificate chain | An ordered set of certificates connecting a leaf certificate through any intermediate authorities to a trusted root. |
| Leaf certificate | The end-entity certificate presented by a server or client rather than a certificate used to issue other certificates. |
| TLS handshake | The negotiation in which peers select protocol parameters, establish shared secrets, exchange authentication data, and confirm handshake integrity. |
| Server Name Indication | A TLS extension through which a client identifies the requested DNS name, allowing one server address to host multiple certificates. |

## Instruction

TLS protects a connection, but encryption alone is not enough. A client must also determine whether it established that encrypted connection with the intended server. During a typical HTTPS handshake, the server presents a leaf certificate and usually any required intermediate certificates. The client validates signatures toward a configured trust anchor, checks the certificate validity period and permitted uses, and compares the requested service identity with the certificate's Subject Alternative Name entries. A valid signature does not by itself prove that the certificate is appropriate for every hostname. A certificate issued for example.internal must not be accepted for storage.internal unless that second identity also appears in the certificate.

A certificate is public and may be distributed freely. Its corresponding private key is secret and should remain readable only by the service identity and authorized administrators. The certificate authority private key is even more sensitive because control of it permits issuance of identities trusted under that authority. Production designs commonly keep an offline root CA and use constrained intermediate CAs for routine issuance. This lab uses one short-lived local root for education, stores every artifact inside the class directory, and never adds that root to the host-wide trust store.

The handshake combines asymmetric authentication with efficient symmetric encryption. In modern TLS, ephemeral key agreement can provide forward secrecy, while the certificate key signs handshake information to authenticate the server. After both peers derive session keys and confirm the transcript, application data is protected for confidentiality and integrity. HTTPS is therefore HTTP after a successful TLS setup; the HTTP status line and body are not sent as readable plaintext over the protected connection.

Trust is a client policy, not a property a certificate grants itself. A self-signed root is accepted only when the client is explicitly configured to trust it. For this lab, verification commands point directly to the lab root certificate. That approach demonstrates private trust without changing global configuration. Production clients should validate certificates normally rather than suppressing errors. Ignoring verification can turn strong encryption into an encrypted connection to an attacker.

Operational certificate management includes accurate identity inventory, secure key generation, automated renewal, deployment of complete chains, service reloads, expiration monitoring, and revocation or replacement after compromise. Certificates also have scope. The server certificate created here is marked as a non-CA certificate and is limited to server authentication. Its SAN extension includes both the DNS identity localhost and the IP identity 127.0.0.1, allowing the learner to observe explicit hostname and IP-address verification.

## Architecture

### components
A private lab root CA consisting of a protected private key and a self-signed root certificate.
A server key pair and certificate signing request for the local HTTPS service.
A CA-signed leaf certificate with DNS:localhost and IP:127.0.0.1 Subject Alternative Name entries.
A Python HTTPS server bound only to 127.0.0.1:8443.
OpenSSL and Python clients configured to trust only the lab root certificate.

### data_flow
The client connects to TCP port 8443 on the loopback address.
The server presents the CA-signed leaf certificate during the TLS handshake.
The client validates the leaf signature against the explicitly supplied lab root certificate.
The client checks that localhost or 127.0.0.1 matches a Subject Alternative Name.
The peers establish encrypted session keys and exchange an HTTP request and response inside TLS.

### trust_boundary
No operating system or browser trust store is changed. Trust exists only for commands explicitly given /opt/lab-classroom/class66/ca/root-ca.crt.

### filesystem_scope
/opt/lab-classroom/class66/

### network_scope
The service listens on 127.0.0.1:8443 and is not intentionally exposed to other hosts.

## Required reading

- RFC 8446, The Transport Layer Security (TLS) Protocol Version 1.3: https://www.rfc-editor.org/rfc/rfc8446
- RFC 5280, Internet X.509 Public Key Infrastructure Certificate and CRL Profile: https://www.rfc-editor.org/rfc/rfc5280
- RFC 6125, Representation and Verification of Service Identity: https://www.rfc-editor.org/rfc/rfc6125
- OpenSSL verification documentation: https://docs.openssl.org/3.0/man1/openssl-verify/

## References

- RFC 8446, The Transport Layer Security (TLS) Protocol Version 1.3: https://www.rfc-editor.org/rfc/rfc8446
- RFC 5280, Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List Profile: https://www.rfc-editor.org/rfc/rfc5280
- RFC 6125, Representation and Verification of Domain-Based Application Service Identity: https://www.rfc-editor.org/rfc/rfc6125
- OpenSSL req documentation: https://docs.openssl.org/3.0/man1/openssl-req/
- OpenSSL x509 documentation: https://docs.openssl.org/3.0/man1/openssl-x509/
- OpenSSL verify documentation: https://docs.openssl.org/3.0/man1/openssl-verify/
- OpenSSL s_client documentation: https://docs.openssl.org/3.0/man1/openssl-s_client/
- Python ssl module documentation: https://docs.python.org/3/library/ssl.html
- Python http.server documentation: https://docs.python.org/3/library/http.server.html
- OWASP Transport Layer Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html
- Let's Encrypt certificate chain documentation: https://letsencrypt.org/certificates/

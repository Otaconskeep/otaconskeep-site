# Class 66: TLS Certificates and HTTPS

**Learning objective:** Explain the roles of a private key, public key, certificate signing request, certificate, certificate authority, and trust store.; Describe the TLS server authentication process without claiming that a certificate alone makes an application secure.; Create a short-lived private lab certificate authority and protect its private key with restrictive file permissions.; Create and sign a server certificate containing a Subject Alternative Name for localhost.; Inspect certificate identity, issuer, validity, key usage, extended key usage, and SAN fields.; Verify a certificate chain and demonstrate a hostname verification failure.; Run a loopback-only HTTPS endpoint and connect to it using an explicitly supplied CA certificate.; Roll back all lab-generated files and stop the temporary TLS process without modifying the operating system trust store.
**Bloom level:** Understand / Apply
**Track:** Homelab Networking and Security · **Difficulty:** intermediate · **Duration:** ~90 minutes · **Lab risk:** low
**Build output:** Teach learners how TLS certificates establish server identity, how certificate authorities and trust stores participate in verification, and how to generate, inspect, serve, and validate a private HTTPS certificate without modifying the host trust store.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### operating_systems
Linux distributions providing a POSIX-compatible shell, procps ps, stat, OpenSSL, and curl

### openssl
OpenSSL 1.1.1
OpenSSL 3.x

### network
Requires an available loopback TCP port 8443. No LAN or Internet listener is created.

### privileges
No elevated privileges are required when /opt/lab-classroom/class66/ already exists or the learner has permission to create it.

### limitations
OpenSSL output formatting can vary between versions while the certificate semantics remain the same.
The OpenSSL test server is for protocol demonstration and is not a production web server.
The generated RSA keys are unencrypted for noninteractive classroom use and must not be reused outside the lab.
System time must be reasonably accurate for certificate validity checks.

## Learning objective

- Explain the roles of a private key, public key, certificate signing request, certificate, certificate authority, and trust store.
- Describe the TLS server authentication process without claiming that a certificate alone makes an application secure.
- Create a short-lived private lab certificate authority and protect its private key with restrictive file permissions.
- Create and sign a server certificate containing a Subject Alternative Name for localhost.
- Inspect certificate identity, issuer, validity, key usage, extended key usage, and SAN fields.
- Verify a certificate chain and demonstrate a hostname verification failure.
- Run a loopback-only HTTPS endpoint and connect to it using an explicitly supplied CA certificate.
- Roll back all lab-generated files and stop the temporary TLS process without modifying the operating system trust store.

## Why this matters

Teach learners how TLS certificates establish server identity, how certificate authorities and trust stores participate in verification, and how to generate, inspect, serve, and validate a private HTTPS certificate without modifying the host trust store.

## Prerequisites

- Comfort using a Linux shell and changing directories.
- Basic understanding of clients, servers, DNS names, IP addresses, and TCP ports.
- OpenSSL and curl installed and available in PATH.
- Permission to create and modify files under /opt/lab-classroom/class66/.
- TCP port 8443 available on the loopback interface.

## Required reading

- OpenSSL verification options: https://docs.openssl.org/3.0/man1/openssl-verify/
- OpenSSL certificate utility: https://docs.openssl.org/3.0/man1/openssl-x509/
- RFC 8446, The Transport Layer Security Protocol Version 1.3: https://www.rfc-editor.org/rfc/rfc8446
- RFC 5280, Internet X.509 Public Key Infrastructure Certificate and CRL Profile: https://www.rfc-editor.org/rfc/rfc5280
- RFC 6125, Service Identity in TLS: https://www.rfc-editor.org/rfc/rfc6125

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

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

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

### tasks
Draw a certificate path containing a root CA, an intermediate CA, and a leaf certificate. Label which private key signs each certificate and which root certificate the client must trust.
Explain why a production root CA should normally not sign every server certificate directly.
Within /opt/lab-classroom/class66/ only, create a second CSR whose SAN contains both DNS:localhost and IP:127.0.0.1. Predict the IP verification result before signing it.
Compare the outputs of openssl verify using -verify_hostname localhost and -verify_ip 127.0.0.1. Explain why a textual match in the Common Name is not an acceptable substitute for the correct SAN type.
Write a renewal checklist covering certificate discovery, issuance, deployment, service reload, validation, expiration monitoring, and rollback.

### submission_criteria
The trust path diagram correctly distinguishes roots, intermediates, and leaf certificates.
The SAN explanation distinguishes DNS identities from IP identities.
The renewal checklist includes validation of the live endpoint rather than only checking files on disk.
Any generated homework artifacts remain exclusively under /opt/lab-classroom/class66/.

## Feynman teach-back

### prompt
Explain to a new homelab administrator why a browser can receive an encrypted response yet still reject the connection, and explain why adding a private CA fixes only some certificate errors.

### model_explanation
Encryption means outsiders should not be able to read the connection, but the client also needs evidence that it is speaking to the intended server. The server presents a certificate and proves it owns the related private key. The client then checks whether a trusted CA signed the certificate, whether it is currently valid and authorized for server use, and whether its SAN matches the requested name. Giving the client a private CA certificate can establish a trusted signing path. It does not repair an expired certificate, an invalid usage, a bad signature, or a hostname mismatch. Trusting an issuer and verifying a service identity are separate checks, and both must succeed.

## Retrieval check

1. 1. What secret must a TLS server protect to prove possession of the key associated with its certificate?
2. 2. What certificate extension should contain the DNS names authorized for a modern HTTPS service?
3. 3. Why does supplying ca.crt make the localhost certificate trusted without making 127.0.0.1 a valid identity?
4. 4. What is the difference between a certificate chain check and hostname verification?
5. 5. Why should the lab CA not be installed into the operating system trust store?
6. 6. What does CA:FALSE communicate in the leaf certificate's Basic Constraints extension?
7. 7. Does HTTPS guarantee that the web application has no authorization or software vulnerabilities?
8. 8. Why is the CA private key generally more sensitive than one server private key?

## Guided lab

### overview
Build a temporary CA, issue a localhost certificate, inspect and verify it, start a loopback-only TLS endpoint, and compare failed and successful client validation.

### workspace
/opt/lab-classroom/class66/

### steps
### step
1

### title
Create and enter the isolated workspace

### commands
mkdir -p /opt/lab-classroom/class66/
cd /opt/lab-classroom/class66/
umask 077
pwd

### notes
The printed working directory must be /opt/lab-classroom/class66. The restrictive umask protects newly created private material by default.
### step
2

### title
Define and create the temporary root CA

### commands
cd /opt/lab-classroom/class66/ && printf '%s\n' '[req]' 'distinguished_name = dn' 'x509_extensions = v3_ca' 'prompt = no' '' '[dn]' 'CN = Class 66 Lab Root CA' '' '[v3_ca]' 'basicConstraints = critical,CA:TRUE,pathlen:0' 'keyUsage = critical,keyCertSign,cRLSign' 'subjectKeyIdentifier = hash' > ca.cnf
cd /opt/lab-classroom/class66/ && openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 7 -config ca.cnf -keyout ca.key -out ca.crt
cd /opt/lab-classroom/class66/ && chmod 600 ca.key && chmod 644 ca.crt

### notes
The unencrypted CA key is acceptable only for this short-lived, isolated exercise. Do not reuse it or deploy it as a real trust anchor.
### step
3

### title
Create a server key and CSR for localhost

### commands
cd /opt/lab-classroom/class66/ && printf '%s\n' '[req]' 'distinguished_name = dn' 'prompt = no' 'req_extensions = req_ext' '' '[dn]' 'CN = localhost' '' '[req_ext]' 'subjectAltName = @alt_names' '' '[alt_names]' 'DNS.1 = localhost' > server.cnf
cd /opt/lab-classroom/class66/ && openssl req -new -newkey rsa:2048 -sha256 -nodes -config server.cnf -keyout server.key -out server.csr
cd /opt/lab-classroom/class66/ && chmod 600 server.key

### notes
The CSR requests localhost as a DNS SAN. It intentionally does not request an IP SAN.
### step
4

### title
Sign the server certificate with constrained leaf extensions

### commands
cd /opt/lab-classroom/class66/ && printf '%s\n' 'basicConstraints = critical,CA:FALSE' 'keyUsage = critical,digitalSignature,keyEncipherment' 'extendedKeyUsage = serverAuth' 'subjectAltName = DNS:localhost' 'authorityKeyIdentifier = keyid,issuer' 'subjectKeyIdentifier = hash' > server.ext
cd /opt/lab-classroom/class66/ && openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 3 -sha256 -extfile server.ext -out server.crt
cd /opt/lab-classroom/class66/ && chmod 644 server.crt

### notes
CA:FALSE prevents the leaf from being treated as a certificate authority. The serverAuth extended key usage identifies its intended TLS server role.
### step
5

### title
Inspect and verify the issued certificate

### commands
cd /opt/lab-classroom/class66/ && openssl x509 -in server.crt -noout -subject -issuer -dates -serial -fingerprint -sha256
cd /opt/lab-classroom/class66/ && openssl x509 -in server.crt -noout -text
cd /opt/lab-classroom/class66/ && openssl verify -CAfile ca.crt -purpose sslserver -verify_hostname localhost server.crt

### notes
Confirm that the issuer is the lab root CA, the SAN contains DNS:localhost, Basic Constraints says CA:FALSE, and Extended Key Usage includes TLS Web Server Authentication.
### step
6

### title
Demonstrate identity mismatch

### commands
cd /opt/lab-classroom/class66/ && openssl verify -CAfile ca.crt -purpose sslserver -verify_ip 127.0.0.1 server.crt; test $? -ne 0

### notes
The command is successful as a lab assertion only when certificate verification itself fails. Trusting the issuer does not make an unauthorized IP address valid.
### step
7

### title
Start a loopback-only TLS server

### commands
cd /opt/lab-classroom/class66/ && openssl s_server -accept 127.0.0.1:8443 -cert server.crt -key server.key -www > server.log 2>&1 & echo $! > /opt/lab-classroom/class66/server.pid
sleep 1
cd /opt/lab-classroom/class66/ && test -s server.pid && ps -p "$(cat server.pid)" -o pid=,args=

### notes
The endpoint is bound to the loopback interface rather than a LAN-facing address. Retain the PID file for controlled shutdown.
### step
8

### title
Compare untrusted and explicitly trusted HTTPS requests

### commands
curl --noproxy '*' --fail --silent --show-error https://localhost:8443/; test $? -ne 0
curl --noproxy '*' --fail --silent --show-error --cacert /opt/lab-classroom/class66/ca.crt https://localhost:8443/
cd /opt/lab-classroom/class66/ && openssl s_client -connect 127.0.0.1:8443 -servername localhost -CAfile ca.crt -verify_hostname localhost -verify_return_error </dev/null

### notes
The first request should be rejected because the temporary CA is absent from the default trust store. The second request should succeed because it explicitly supplies ca.crt. The s_client output should report a successful verification result.
### step
9

### title
Stop the temporary TLS server

### commands
cd /opt/lab-classroom/class66/ && pid="$(cat server.pid)" && case "$(ps -p "$pid" -o args= 2>/dev/null)" in *'openssl s_server'*) kill "$pid";; *) printf '%s\n' 'Refusing to signal a process that is not the expected OpenSSL server.' >&2; exit 1;; esac

### notes
The command checks the process description before sending a termination signal, reducing the risk of acting on a stale PID.

## Expected results

- The workspace contains a CA certificate and key, a server certificate and key, a CSR, configuration files, a CA serial file, and TLS server logs.
- The private key files are readable and writable only by their owner after the explicit permission changes.
- The server certificate identifies localhost through a DNS Subject Alternative Name.
- The server certificate is issued by the Class 66 Lab Root CA and is constrained as CA:FALSE.
- OpenSSL chain and hostname verification for localhost reports server.crt: OK.
- Verification for the IP address 127.0.0.1 fails because no matching IP SAN exists.
- A default curl request rejects the private CA rather than silently trusting it.
- A curl request using the explicit lab CA succeeds and returns the OpenSSL test server response.
- The OpenSSL client reports Verify return code: 0 (ok) when the CA and hostname checks are supplied.
- No certificate is added to the operating system or browser trust store.

## Verification checkpoints

- [ ] Run: cd /opt/lab-classroom/class66/ && openssl verify -CAfile ca.crt -purpose sslserver -verify_hostname localhost server.crt. Expected result: server.crt: OK.
- [ ] Run: cd /opt/lab-classroom/class66/ && openssl x509 -in server.crt -noout -ext subjectAltName. Expected result: a DNS entry for localhost.
- [ ] Run: cd /opt/lab-classroom/class66/ && openssl x509 -in server.crt -noout -ext basicConstraints. Expected result: critical CA:FALSE.
- [ ] Run: cd /opt/lab-classroom/class66/ && openssl x509 -in server.crt -noout -ext extendedKeyUsage. Expected result: TLS Web Server Authentication.
- [ ] Run: cd /opt/lab-classroom/class66/ && test "$(stat -c '%a' ca.key)" = 600 && test "$(stat -c '%a' server.key)" = 600. Expected result: a zero exit status.
- [ ] While the test server is running, run: curl --noproxy '*' --fail --silent --show-error --cacert /opt/lab-classroom/class66/ca.crt https://localhost:8443/. Expected result: an OpenSSL-generated status page.
- [ ] While the test server is running, run: cd /opt/lab-classroom/class66/ && openssl s_client -connect 127.0.0.1:8443 -servername localhost -CAfile ca.crt -verify_hostname localhost -verify_return_error </dev/null 2>&1 | grep 'Verify return code: 0 (ok)'. Expected result: the matching line is printed.
- [ ] Run: cd /opt/lab-classroom/class66/ && openssl verify -CAfile ca.crt -verify_ip 127.0.0.1 server.crt. Expected result: a nonzero status and an IP address mismatch message.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The workspace cannot be created or files cannot be written. | The current user lacks permission under /opt/lab-classroom, or the classroom directory was not provisioned. | Have the homelab administrator create /opt/lab-classroom/class66/ and grant the learner access. Do not redirect lab output to another system location. |
| OpenSSL reports that a configuration section or extension is missing. | A configuration file was copied incompletely or written with altered section names. | Regenerate ca.cnf, server.cnf, or server.ext using the exact lab command, then inspect it with cat before retrying. |
| Certificate verification reports unable to get local issuer certificate. | The wrong CA file was supplied, the leaf was not signed by the current CA, or files from different lab runs were mixed. | Compare the leaf issuer with the CA subject, remove the lab artifacts through the documented rollback, and regenerate the CA and leaf as one set. |
| Certificate verification reports a hostname mismatch for localhost. | The server certificate lacks DNS:localhost in its SAN, or the client verified a different name. | Inspect the SAN extension, regenerate the certificate with the supplied server configuration, and connect using https://localhost:8443/. |
| The HTTPS test using 127.0.0.1 fails even though the CA is supplied. | The certificate intentionally contains only a localhost DNS SAN and no 127.0.0.1 IP SAN. | Use localhost for the successful HTTPS test. Treat the IP mismatch as an intended demonstration rather than disabling verification. |
| The TLS server reports address already in use. | Another process, possibly an earlier lab server, is listening on 127.0.0.1:8443. | Inspect the PID stored in /opt/lab-classroom/class66/server.pid and verify its command line. Stop only the confirmed lab OpenSSL process, or ask the administrator to identify the conflicting listener. |
| curl still rejects the certificate when --cacert is provided. | The URL name does not match the SAN, the server is presenting a different certificate, the certificate is outside its validity period, or the CA file is incorrect. | Use https://localhost:8443/, inspect the live certificate with openssl s_client, compare its issuer and fingerprint with the files in the workspace, and confirm that system time is correct. |
| The first curl request unexpectedly succeeds without --cacert. | A proxy or environment-specific trust configuration intercepted the request, or an equivalent CA is already trusted. | Confirm that --noproxy '*' is present, inspect curl verbose output, and verify that no environment variable replaces the CA bundle. The exercise must not alter the host trust store. |
| The server shutdown command refuses to signal the PID. | The PID file is stale or the OpenSSL process already exited. | Inspect server.log and run ps using the stored PID. Remove only the stale server.pid file inside the class workspace after confirming that no lab server remains. |

## Security considerations

### principles
Never transmit, publish, or commit ca.key or server.key.
Treat a CA private key as more sensitive than an individual server key because it can authorize additional identities.
Do not install the temporary CA into any system, browser, container host, or mobile-device trust store.
Do not bypass certificate validation to make an error disappear; diagnose chain, validity, usage, and identity separately.
Use SAN entries that represent the exact DNS names or IP addresses clients are expected to verify.
Prefer short certificate lifetimes and automated renewal for production, paired with monitoring that detects renewal failure.
Keep private keys readable only by the service identity that requires them.
Bind test services to loopback unless remote access is explicitly part of an authorized design.
Remember that successful TLS validation authenticates the certified endpoint identity; it does not prove that the application is free from vulnerabilities.

### lab_specific_controls
The CA is valid for seven days and the leaf is valid for three days.
The server listens only on 127.0.0.1:8443.
Trust is passed explicitly through -CAfile or --cacert.
Private keys are assigned mode 600.
All persistent lab mutations are confined to /opt/lab-classroom/class66/.

## Rollback

### procedure
If the test server is running, read server.pid and confirm that the associated command is the lab OpenSSL s_server process.
Stop the confirmed process using the guarded shutdown command from lab step 9.
Delete only the fixed list of generated files in /opt/lab-classroom/class66/.
Confirm that no listed lab artifacts remain.
Leave the class66 directory in place so that the rollback does not change any parent-directory ownership or permissions.

### commands
cd /opt/lab-classroom/class66/ && if test -s server.pid; then pid="$(cat server.pid)"; case "$(ps -p "$pid" -o args= 2>/dev/null)" in *'openssl s_server'*) kill "$pid";; '') :;; *) printf '%s\n' 'PID belongs to another process; not signaling it.' >&2; exit 1;; esac; fi
cd /opt/lab-classroom/class66/ && for f in ca.cnf ca.key ca.crt ca.srl server.cnf server.key server.csr server.ext server.crt server.log server.pid; do test ! -e "$f" || unlink -- "$f"; done
cd /opt/lab-classroom/class66/ && for f in ca.cnf ca.key ca.crt ca.srl server.cnf server.key server.csr server.ext server.crt server.log server.pid; do test ! -e "$f" || exit 1; done

### result
The temporary process is stopped and all known lab-generated files are removed while /opt/lab-classroom/class66/ remains available.

## Video narration notes

Begin by separating encryption from identity. TLS can encrypt a session, but a secure client must also establish that it reached the intended endpoint. Introduce the private key as the server's secret, the certificate as a public signed identity document, and the CA certificate as a potential trust anchor. Show the isolated class workspace and emphasize that no system trust store will be changed. Create the short-lived root CA, then inspect its critical CA constraint and key usage. Create the localhost server key and CSR, pointing out that the SAN requests DNS:localhost. Sign the CSR with a leaf extension file that sets CA:FALSE and serverAuth. Inspect the resulting certificate and identify the subject, issuer, validity period, SAN, Basic Constraints, and Extended Key Usage. Run OpenSSL verification for localhost and observe success. Next, verify the IP address 127.0.0.1 and observe failure even though the same trusted CA is supplied. Explain that network reachability, issuer trust, and service identity are separate facts. Start the OpenSSL server on loopback port 8443. Show that a default curl request rejects the unknown private CA, then repeat the request with the explicit CA file and observe a successful HTTPS response. Use s_client with SNI and hostname verification to inspect the live handshake and verification result. Conclude by stopping the server, reviewing private-key handling, and removing only the generated class files through the documented rollback.

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

## Mastery gate

- [ ] Objectives demonstrated with evidence
- [ ] Feynman complete
- [ ] Quiz self-scored ≥80%
- [ ] Lab verification boxes checked
- [ ] Rollback understood

## Reflection

1. What did I learn?
2. What did I struggle with?
3. How does this connect to earlier classes?

## Spiral hook

Return to this class whenever a later service fails for identity, process, log, remote access, update, or routing reasons covered here.

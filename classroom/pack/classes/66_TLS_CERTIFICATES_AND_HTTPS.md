# Class 66: TLS Certificates and HTTPS

**Learning objective:** Explain the roles of encryption, integrity, authentication, and certificate trust in TLS.; Distinguish a certificate, private key, certificate signing request, root certificate, and certificate chain.; Create a private lab certificate authority without altering the operating system trust store.; Issue a server certificate containing Subject Alternative Name entries for localhost and 127.0.0.1.; Operate a loopback-only HTTPS service using the issued certificate and private key.; Verify certificate signatures, hostname identity, validity dates, and the negotiated TLS session.; Diagnose common TLS failures such as unknown issuer, hostname mismatch, expiration, and missing certificate chains.; Protect private keys and explain why bypassing certificate validation is unsafe.
**Bloom level:** Understand / Apply
**Track:** Networking and Security · **Difficulty:** intermediate · **Duration:** ~90 minutes · **Lab risk:** low
**Build output:** Understand how TLS certificates establish server identity and encrypted transport, then build and verify a private certificate authority, a locally trusted server certificate, and a loopback-only HTTPS service.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### operating_systems
Current Debian and Ubuntu releases
Current Fedora releases
Current Rocky Linux and AlmaLinux releases
Other Linux distributions providing compatible OpenSSL and Python versions

### openssl
OpenSSL 1.1.1 or OpenSSL 3.x with req -addext and verify hostname/IP support.

### python
Python 3.8 or newer; Python 3.10 or newer is recommended.

### permissions
The learner must already have write permission to /opt/lab-classroom/class66/. The lesson does not change ownership or system-wide permissions.

### network
IPv4 loopback support and an available local TCP port 8443 are required.

### limitations
The Python HTTPS service is for controlled education and is not a hardened production web server. No system-wide trust store, production certificate service, public DNS record, or external network listener is configured.

## Learning objective

- Explain the roles of encryption, integrity, authentication, and certificate trust in TLS.
- Distinguish a certificate, private key, certificate signing request, root certificate, and certificate chain.
- Create a private lab certificate authority without altering the operating system trust store.
- Issue a server certificate containing Subject Alternative Name entries for localhost and 127.0.0.1.
- Operate a loopback-only HTTPS service using the issued certificate and private key.
- Verify certificate signatures, hostname identity, validity dates, and the negotiated TLS session.
- Diagnose common TLS failures such as unknown issuer, hostname mismatch, expiration, and missing certificate chains.
- Protect private keys and explain why bypassing certificate validation is unsafe.

## Why this matters

Understand how TLS certificates establish server identity and encrypted transport, then build and verify a private certificate authority, a locally trusted server certificate, and a loopback-only HTTPS service.

## Prerequisites

- Basic familiarity with Linux command-line navigation and process control.
- A Linux host or virtual machine with OpenSSL and Python 3 installed.
- Write permission to /opt/lab-classroom/class66/.
- Basic understanding of DNS names, IP addresses, TCP ports, and client-server communication.
- Two terminal sessions are recommended so the HTTPS server can remain in the foreground while verification commands run.

## Required reading

- RFC 8446, The Transport Layer Security (TLS) Protocol Version 1.3: https://www.rfc-editor.org/rfc/rfc8446
- RFC 5280, Internet X.509 Public Key Infrastructure Certificate and CRL Profile: https://www.rfc-editor.org/rfc/rfc5280
- RFC 6125, Representation and Verification of Service Identity: https://www.rfc-editor.org/rfc/rfc6125
- OpenSSL verification documentation: https://docs.openssl.org/3.0/man1/openssl-verify/

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

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

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Inspect the root and server certificates and write down their subjects, issuers, serial numbers, validity periods, basic constraints, key usages, and Subject Alternative Names.
Draw the lab trust path from the localhost leaf certificate to the Class 66 Lab Root CA and mark which private key signs each certificate.
Explain why the root certificate has CA:TRUE while the server certificate has CA:FALSE.
Design a renewal plan for a home service certificate, including renewal lead time, deployment, service reload, post-deployment verification, and expiration monitoring.
Research ACME and describe how domain-control validation, automated issuance, and renewal differ from the manual private-CA process in this lab.
Describe how the architecture would change if an offline root CA issued an intermediate CA that then issued the server certificate.

## Feynman teach-back

### prompt
Explain TLS to a peer without using the phrases secure because it is encrypted or the certificate is trusted because it is valid.

### model_explanation
A server has a private key and publishes a certificate containing the related public key and the names it is allowed to use. A certificate authority signs that certificate. A client begins with a CA certificate it already accepts, verifies the signature path, checks time and intended usage, and confirms that the requested hostname or IP address appears in the server certificate. During the handshake, the server proves possession of its private key without sending that key. The peers derive temporary symmetric keys and use them to protect HTTP data. If identity checking is skipped, the connection may be encrypted but could still terminate at the wrong server.

### self_check
Can you explain why a certificate may be shared but its private key must remain secret?
Can you explain why a correctly signed certificate can still fail for the requested hostname?
Can you explain why a private root is not automatically trusted by clients?
Can you describe what must be replaced after a server private-key compromise?

## Retrieval check

1. 1. Which certificate field should a modern TLS client use to decide whether a certificate is valid for localhost?
2. 2. Why is a private CA certificate not automatically trusted merely because it is self-signed?
3. 3. What does the CA:FALSE basic constraint communicate about the server certificate?
4. 4. What is the security difference between a certificate and its corresponding private key?
5. 5. Name four major checks a client performs when validating a server certificate.
6. 6. Why does the lab pass a CA file directly to the client instead of installing the root globally?
7. 7. What does Server Name Indication contribute to a TLS connection?
8. 8. What should an administrator do if a server private key is suspected of compromise?
9. 9. Why can disabling certificate verification make an encrypted connection unsafe?
10. 10. What result should the negative trust test produce, and why?

## Guided lab

### overview
Create an isolated private CA, issue a local server certificate, run a loopback HTTPS service, and validate both the certificate and an application request. Run each command from a shell whose account can write to the designated class directory.

### steps
### step
1

### title
Create the isolated workspace

### instructions
Create the only directories used by this lab, enter the workspace, restrict default permissions for newly created files, and direct application home-state into the workspace.

### commands
mkdir -p /opt/lab-classroom/class66/ca /opt/lab-classroom/class66/server /opt/lab-classroom/class66/www
cd /opt/lab-classroom/class66
umask 077
export HOME=/opt/lab-classroom/class66
### step
2

### title
Generate the private root certificate authority

### instructions
Create a 3072-bit RSA root key and a self-signed root certificate valid for 365 days. The extensions identify this certificate as a CA and permit certificate signing.

### commands
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out /opt/lab-classroom/class66/ca/root-ca.key
openssl req -x509 -new -sha256 -days 365 -key /opt/lab-classroom/class66/ca/root-ca.key -out /opt/lab-classroom/class66/ca/root-ca.crt -subj '/C=XX/O=OtaconsKeep Homelab Academy/OU=Class 66/CN=Class 66 Lab Root CA' -addext 'basicConstraints=critical,CA:TRUE,pathlen:0' -addext 'keyUsage=critical,keyCertSign,cRLSign' -addext 'subjectKeyIdentifier=hash'
### step
3

### title
Generate the server key and certificate signing request

### instructions
Create a distinct private key for the HTTPS server and use it to sign a certificate request. The private CA key and server key serve different roles and must not be substituted for each other.

### commands
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /opt/lab-classroom/class66/server/server.key
openssl req -new -sha256 -key /opt/lab-classroom/class66/server/server.key -out /opt/lab-classroom/class66/server/server.csr -subj '/C=XX/O=OtaconsKeep Homelab Academy/OU=Class 66/CN=localhost'
### step
4

### title
Define server certificate extensions

### instructions
Create an extension file that makes the resulting certificate a server-only leaf certificate and declares its valid DNS and IP identities.

### commands
printf '%s\n' 'basicConstraints=critical,CA:FALSE' 'keyUsage=critical,digitalSignature,keyEncipherment' 'extendedKeyUsage=serverAuth' 'subjectAltName=DNS:localhost,IP:127.0.0.1' 'subjectKeyIdentifier=hash' 'authorityKeyIdentifier=keyid,issuer' > /opt/lab-classroom/class66/server/server-ext.cnf
### step
5

### title
Issue the server certificate

### instructions
Sign the request with the private root CA. The resulting leaf certificate is intentionally short-lived and valid for 30 days.

### commands
openssl x509 -req -sha256 -days 30 -in /opt/lab-classroom/class66/server/server.csr -CA /opt/lab-classroom/class66/ca/root-ca.crt -CAkey /opt/lab-classroom/class66/ca/root-ca.key -CAcreateserial -out /opt/lab-classroom/class66/server/server.crt -extfile /opt/lab-classroom/class66/server/server-ext.cnf
### step
6

### title
Inspect and validate the issued certificate

### instructions
Inspect the certificate's issuer, subject, validity, key usage, and SAN extension. Then perform chain and hostname validation using the lab root as the explicit trust anchor.

### commands
openssl x509 -in /opt/lab-classroom/class66/server/server.crt -noout -subject -issuer -dates -serial -fingerprint -sha256
openssl x509 -in /opt/lab-classroom/class66/server/server.crt -noout -ext basicConstraints -ext keyUsage -ext extendedKeyUsage -ext subjectAltName
openssl verify -CAfile /opt/lab-classroom/class66/ca/root-ca.crt -purpose sslserver -verify_hostname localhost /opt/lab-classroom/class66/server/server.crt
openssl verify -CAfile /opt/lab-classroom/class66/ca/root-ca.crt -purpose sslserver -verify_ip 127.0.0.1 /opt/lab-classroom/class66/server/server.crt
### step
7

### title
Create the HTTPS application

### instructions
Create a static response file and a minimal Python HTTPS server. The server listens only on the IPv4 loopback address.

### commands
printf '%s\n' 'Class 66 HTTPS lab is working.' > /opt/lab-classroom/class66/www/index.html
cat > /opt/lab-classroom/class66/https_server.py <<'PY'
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import ssl

ROOT = '/opt/lab-classroom/class66'
handler = partial(SimpleHTTPRequestHandler, directory=f'{ROOT}/www')
server = ThreadingHTTPServer(('127.0.0.1', 8443), handler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.minimum_version = ssl.TLSVersion.TLSv1_2
context.load_cert_chain(
    certfile=f'{ROOT}/server/server.crt',
    keyfile=f'{ROOT}/server/server.key'
)
server.socket = context.wrap_socket(server.socket, server_side=True)
print('Serving HTTPS on https://127.0.0.1:8443')
server.serve_forever()
PY
### step
8

### title
Start the HTTPS service

### instructions
Run the service in the foreground in the first terminal. Leave it running while completing the remaining steps. Stop it afterward with Ctrl-C.

### commands
cd /opt/lab-classroom/class66 && HOME=/opt/lab-classroom/class66 python3 /opt/lab-classroom/class66/https_server.py
### step
9

### title
Inspect the live TLS handshake

### instructions
In the second terminal, connect with the expected server name, supply the lab trust anchor, and request concise handshake information.

### commands
openssl s_client -connect 127.0.0.1:8443 -servername localhost -CAfile /opt/lab-classroom/class66/ca/root-ca.crt -verify_return_error -brief </dev/null
### step
10

### title
Make a validated HTTPS application request

### instructions
Use Python's HTTPS client with an explicit CA file. This performs certificate-chain and hostname validation before reading the HTTP response.

### commands
HOME=/opt/lab-classroom/class66 python3 - <<'PY'
import ssl
import urllib.request

context = ssl.create_default_context(
    cafile='/opt/lab-classroom/class66/ca/root-ca.crt'
)
with urllib.request.urlopen(
    'https://localhost:8443/',
    context=context,
    timeout=5
) as response:
    print('HTTP status:', response.status)
    print('TLS version:', response.fp.raw._sock.version())
    print('Body:', response.read().decode().strip())
PY
### step
11

### title
Observe trust failure safely

### instructions
Run a client without loading the private lab root. A certificate verification failure is the correct result because the lab CA is not in the default trust store. Do not disable verification to make this test pass.

### commands
HOME=/opt/lab-classroom/class66 python3 - <<'PY'
import urllib.request

try:
    urllib.request.urlopen('https://localhost:8443/', timeout=5)
    print('UNEXPECTED: the private lab CA was trusted by default')
except Exception as exc:
    print(type(exc).__name__ + ':', exc)
PY

## Expected results

- The root CA private key, root certificate, server private key, certificate request, leaf certificate, extension file, application file, and server program exist only under /opt/lab-classroom/class66/.
- The server certificate subject identifies localhost, while its issuer identifies Class 66 Lab Root CA.
- Certificate inspection shows CA:FALSE, serverAuth, DNS:localhost, and IP Address:127.0.0.1.
- Both OpenSSL verification commands report /opt/lab-classroom/class66/server/server.crt: OK.
- The live handshake reports a successful certificate verification and a negotiated TLS version and cipher.
- The validated Python request returns HTTP status 200 and the body Class 66 HTTPS lab is working.
- The final negative test fails certificate validation because the private lab root was not supplied as a trust anchor.

## Verification checkpoints

- [ ] Confirm the leaf certificate chains to the lab root: openssl verify -CAfile /opt/lab-classroom/class66/ca/root-ca.crt -purpose sslserver /opt/lab-classroom/class66/server/server.crt. Expected result: the leaf path followed by OK.
- [ ] Confirm the DNS identity: openssl verify -CAfile /opt/lab-classroom/class66/ca/root-ca.crt -verify_hostname localhost /opt/lab-classroom/class66/server/server.crt. Expected result: OK.
- [ ] Confirm the IP identity: openssl verify -CAfile /opt/lab-classroom/class66/ca/root-ca.crt -verify_ip 127.0.0.1 /opt/lab-classroom/class66/server/server.crt. Expected result: OK.
- [ ] Confirm the certificate and key correspond: compare the outputs of openssl pkey -in /opt/lab-classroom/class66/server/server.key -pubout -outform DER | openssl sha256 and openssl x509 -in /opt/lab-classroom/class66/server/server.crt -pubkey -noout | openssl pkey -pubin -outform DER | openssl sha256. Expected result: identical SHA-256 digests.
- [ ] Confirm the service is loopback-only while it is running: use ss -ltn and locate 127.0.0.1:8443. It must not show 0.0.0.0:8443 or an externally reachable address.
- [ ] Confirm live trust validation: openssl s_client -connect 127.0.0.1:8443 -servername localhost -CAfile /opt/lab-classroom/class66/ca/root-ca.crt -verify_return_error -brief </dev/null. Expected result: Verification: OK.
- [ ] Confirm application behavior with the validated Python request from the lab. Expected result: HTTP status 200 and the exact response body Class 66 HTTPS lab is working.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| mkdir reports permission denied for /opt/lab-classroom/class66. | The current account was not granted write access to the classroom parent directory. | Have the lab administrator pre-create /opt/lab-classroom/class66/ with ownership or access appropriate for the learner. Do not redirect lab artifacts into another location. |
| OpenSSL reports that -addext, -verify_hostname, or -verify_ip is unknown. | The installed OpenSSL version is older than the supported lab baseline. | Use a supported OpenSSL 1.1.1 or 3.x environment. Check the version with openssl version before repeating the lab. |
| Certificate verification reports unable to get local issuer certificate. | The client did not load the lab root certificate, the wrong CA file was selected, or the server certificate was issued by a different key. | Use /opt/lab-classroom/class66/ca/root-ca.crt as the CA file and inspect the server certificate's issuer. If artifacts were mixed between runs, rebuild the lab certificate set together. |
| Verification reports a hostname or IP address mismatch. | The client identity is absent from the Subject Alternative Name extension or the DNS and IP verification modes were confused. | Inspect the SAN extension. Validate localhost with hostname verification and 127.0.0.1 with IP verification. Reissue the certificate if the required identity is absent. |
| The server exits with an address already in use error. | Another process is already listening on 127.0.0.1:8443 or a previous lab server is still running. | Inspect listeners with ss -ltnp if authorized, stop the earlier class server using Ctrl-C in its terminal, and restart this lab server. |
| The server reports a key mismatch or PEM loading error. | The configured private key does not correspond to the public key in the certificate, or one of the files is damaged. | Use the public-key digest comparison in the verification section. If the digests differ, generate a new server key, request, and certificate as one consistent set. |
| The HTTPS request times out or receives connection refused. | The server is not running, it exited after an error, or the client used a different port. | Check the first terminal for the serving message, verify a listener exists on 127.0.0.1:8443, and ensure the client URL uses port 8443. |
| The negative trust test succeeds unexpectedly. | The lab root was previously added to a default trust store or the runtime inherited custom trust configuration. | Inspect environment-specific trust settings and repeat the test in a clean supported environment. The lesson does not require or authorize changing a system trust store. |
| Verification reports that the certificate is expired or not yet valid. | The host clock is incorrect or the short-lived lab certificate has passed its validity period. | Confirm the system date and time through the normal platform administration process. If the certificate has expired, issue a new leaf certificate from the existing lab CA. |

## Security considerations

Keep private keys secret. The root certificate and server certificate are public, but root-ca.key and server.key must not be copied into public shares, source repositories, images, or client bundles.
The lab sets a restrictive umask before creating key material. Confirm that private keys are not readable by unintended users according to the host's access model.
Never install the classroom root CA into production trust stores. Possession of its root private key would allow issuance of identities trusted by any client that accepts that root.
Do not disable certificate verification to hide trust, hostname, or expiration failures. Correct the certificate, identity, chain, time, or trust configuration instead.
Bind demonstration services to loopback unless remote access is an explicit, reviewed requirement. This lab uses 127.0.0.1 rather than all interfaces.
The CA and leaf lifetimes are intentionally limited. Production environments require renewal automation, expiration alerts, documented ownership, and replacement procedures.
A production HTTPS server may need to present intermediate certificates along with the leaf certificate. Root certificates are generally distributed through trust management rather than sent as part of the server chain.
If a private key may have been exposed, replacing only the certificate is insufficient. Generate a new key pair, issue a replacement certificate, deploy it, and apply the organization's revocation and incident-response procedures.
Protect CA operations with stronger controls than ordinary service keys. Mature designs commonly use an offline root, constrained intermediates, audited issuance, and hardware-backed key protection.

## Rollback

### service_stop
Stop the foreground Python HTTPS service with Ctrl-C. Confirm that 127.0.0.1:8443 is no longer listed as a listening socket.

### trust_state
No global trust-store changes were made, so there is no trust configuration to reverse.

### artifact_retention
Retain /opt/lab-classroom/class66/ if the instructor needs to review the generated certificate fields or verification output.

### artifact_removal
After confirming the HTTPS process has stopped and the path is exactly correct, the controlled cleanup command listed in dangerous_commands removes only this class workspace. Deleted private keys and certificates are not recoverable unless a separate backup exists.

## Video narration notes

Begin by showing the empty Class 66 workspace and describing the four promises commonly associated with TLS: confidentiality, integrity, server authentication, and secure key establishment. Generate the root key and pause to distinguish the secret root key from the distributable root certificate. Explain that the root certificate becomes useful only when a client deliberately accepts it as a trust anchor. Next, generate a separate server key and certificate signing request. Open the extension file and emphasize CA:FALSE, serverAuth, and the two Subject Alternative Name entries. Point out that the common name is descriptive but SAN is the identity source modern clients evaluate.

Sign the request and inspect the resulting leaf certificate. Compare its subject with its issuer, identify the 30-day lifetime, and show that its SAN permits both localhost and 127.0.0.1. Run explicit hostname and IP verification so learners can see that chain validation and service-identity validation are related but distinct operations.

Create the minimal Python service and highlight that it binds only to the loopback address. Start it in one terminal. In another terminal, use the OpenSSL client to display the negotiated protocol, cipher, peer certificate, and successful verification. Then run the Python HTTPS request with the lab root supplied as the CA file. Show the HTTP status, TLS version, and response body.

Finish with the negative test. Explain that failure without the CA file is correct and desirable because the operating system has not been told to trust this private issuer. Do not bypass the error. Review common production failures: an incomplete intermediate chain, an expired certificate, a wrong SAN, an unreadable or mismatched key, and accidental exposure of a CA key. Stop the foreground service and confirm that no global trust state was modified.

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

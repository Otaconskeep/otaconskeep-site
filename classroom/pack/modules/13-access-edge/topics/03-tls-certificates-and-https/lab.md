# Lab: TLS Certificates and HTTPS

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain the roles of encryption, integrity, authentication, and certificate trust in TLS.

## Before you start

- Basic familiarity with Linux command-line navigation and process control.
- A Linux host or virtual machine with OpenSSL and Python 3 installed.
- Write permission to /opt/lab-classroom/class66/.
- Basic understanding of DNS names, IP addresses, TCP ports, and client-server communication.
- Two terminal sessions are recommended so the HTTPS server can remain in the foreground while verification commands run.

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

## Verification

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

## Security

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

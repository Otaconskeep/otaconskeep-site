# Lab: TLS Certificates and HTTPS

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain the roles of a private key, public key, certificate signing request, certificate, certificate authority, and trust store.

## Before you start

- Comfort using a Linux shell and changing directories.
- Basic understanding of clients, servers, DNS names, IP addresses, and TCP ports.
- OpenSSL and curl installed and available in PATH.
- Permission to create and modify files under /opt/lab-classroom/class66/.
- TCP port 8443 available on the loopback interface.

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

## Verification

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

## Security

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

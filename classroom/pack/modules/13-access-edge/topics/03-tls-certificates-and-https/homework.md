# Homework: TLS Certificates and HTTPS

**Module:** Edge Access & VPN
**Activity type:** Homework / independent application
**Objective:** Explain the roles of a private key, public key, certificate signing request, certificate, certificate authority, and trust store.

## Requirements

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

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz

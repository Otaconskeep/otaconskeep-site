# Homework: TLS Certificates and HTTPS

**Module:** Edge Access & VPN
**Activity type:** Homework / independent application
**Objective:** Explain the roles of encryption, integrity, authentication, and certificate trust in TLS.

## Requirements

Inspect the root and server certificates and write down their subjects, issuers, serial numbers, validity periods, basic constraints, key usages, and Subject Alternative Names.
Draw the lab trust path from the localhost leaf certificate to the Class 66 Lab Root CA and mark which private key signs each certificate.
Explain why the root certificate has CA:TRUE while the server certificate has CA:FALSE.
Design a renewal plan for a home service certificate, including renewal lead time, deployment, service reload, post-deployment verification, and expiration monitoring.
Research ACME and describe how domain-control validation, automated issuance, and renewal differ from the manual private-CA process in this lab.
Describe how the architecture would change if an offline root CA issued an intermediate CA that then issued the server certificate.

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz

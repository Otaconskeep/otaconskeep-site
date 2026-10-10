# Homework: Local DNS and Friendly Service Names

**Module:** Edge Access & VPN
**Activity type:** Homework / independent application
**Objective:** Explain the roles of DNS clients, recursive resolvers, authoritative data, caching, and search domains

## Requirements

### tasks
Design a naming table for five real or planned homelab services. Include the FQDN, intended record type, address source, service owner, and whether the name should be available only internally.
Add one additional A record to /opt/lab-classroom/class65/dnsmasq.conf using another address from the 192.0.2.0/24 documentation range, validate the configuration, restart the isolated process, and verify the new name with dig.
Write a short explanation of why moving an application between servers is easier when users depend on a stable DNS name rather than a memorized address.
Compare role-oriented names such as backup.lab.home.arpa with hardware-oriented names such as mini-pc-02.lab.home.arpa. State which should be presented to end users and why.
Describe how clients on a real LAN would learn the DNS resolver address and search domain, but do not implement those changes in this lab.

### submission_evidence
The proposed naming table
The additional record line
The explicit dig command and returned value
The written comparison of role-oriented and hardware-oriented names
The explanation of resolver and search-domain distribution

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz

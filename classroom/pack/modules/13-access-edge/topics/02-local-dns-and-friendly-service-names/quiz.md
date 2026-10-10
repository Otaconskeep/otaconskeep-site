# Quiz: Local DNS and Friendly Service Names

**Module:** Edge Access & VPN
**Activity type:** Quiz / retrieval practice
**Target:** ≥80%
**Objective:** Explain the roles of DNS clients, recursive resolvers, authoritative data, caching, and search domains

## Questions

1. 1. What DNS record type maps a host name to an IPv4 address?
2. 2. Why does this lesson use a name beneath home.arpa instead of an invented public-looking suffix?
3. 3. Does a successful A-record lookup prove that the application at the returned address is running? Explain.
4. 4. Why does the lab use `dig @127.0.0.1 -p 1053` instead of a plain `dig` command?
5. 5. What is the purpose of a DNS TTL?
6. 6. Why might `nas` fail to resolve while `nas.lab.home.arpa` succeeds?
7. 7. What is the expected result of requesting an AAAA record when only an A record exists?
8. 8. Why should .local generally not be chosen as an ordinary unicast DNS suffix for this design?
9. 9. Does an A record specify whether a web service uses port 80, 443, or 8443?
10. 10. What must be verified before terminating the process whose identifier is stored in dnsmasq.pid?

## After scoring

- Missed items → return to Reading → redo Feynman Retry → reattempt.

<!-- answer key is maintained in instructor materials / automation batch report; not printed for students -->

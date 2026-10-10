# Homework: Reverse Proxy Fundamentals

**Module:** Edge Access & VPN
**Activity type:** Homework / independent application
**Objective:** Distinguish a reverse proxy from a forward proxy.

## Requirements

Draw a request sequence showing the client connection, proxy connection, request headers, backend response, and final client response.
Modify only `/opt/lab-classroom/class64/proxy.py` to route paths beginning with `/api/` to a second loopback backend on port 9002. Keep all new files and logs under the class directory.
Write a short policy specifying which proxy addresses an application should trust and what it should do with client-supplied forwarding headers.
Research one maintained reverse-proxy product and identify its directives or settings for upstream timeouts, request-size limits, access logs, Host handling, and trusted client-address headers.
Explain how TLS termination changes the client-to-proxy and proxy-to-backend connections, including when re-encryption may be appropriate.
Compare a 502 response, a connection-refused error, and an application-generated 500 response. State which component can generate each condition.

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz

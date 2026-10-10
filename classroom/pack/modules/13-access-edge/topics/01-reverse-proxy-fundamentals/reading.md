# Reading: Reverse Proxy Fundamentals

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Distinguish a reverse proxy from a forward proxy.

## Vocabulary

| Term | Meaning |
|---|---|
| reverse proxy | A server that accepts requests on behalf of one or more upstream servers and returns their responses to clients. |
| forward proxy | A proxy that acts on behalf of clients, commonly controlling or relaying client access to external destinations. |
| upstream | The backend service to which a reverse proxy forwards a request. |
| listener | The local IP address and TCP port on which a service waits for connections. |
| Host header | The HTTP field identifying the authority or virtual host requested by the client. |
| X-Forwarded-For | A widely used, non-standard header carrying information about the original client address across trusted proxies. |
| X-Forwarded-Proto | A commonly used header indicating the protocol, such as HTTP or HTTPS, used between the original client and the trusted proxy. |
| X-Forwarded-Host | A commonly used header preserving the Host value originally received by the proxy. |
| hop-by-hop header | A header applying to one transport connection rather than the full request chain; intermediaries must not blindly relay such headers. |
| TLS termination | The process in which a proxy handles the client TLS connection and forwards the resulting HTTP request to an upstream, optionally using another protected connection. |
| load balancing | Distributing requests among multiple suitable upstream instances. |
| 502 Bad Gateway | A response commonly returned by a proxy when it cannot obtain a valid response from its configured upstream. |

## Instruction

A reverse proxy sits on the server side of an application path. A client believes it is contacting the public service, but the connection first reaches the proxy listener. The proxy examines enough of the request to choose an upstream, opens or reuses a connection to that upstream, forwards an appropriate request, receives the response, and relays that response to the client. This indirection allows internal applications to use private addresses and varied ports while clients use a stable endpoint. It also creates a central location for TLS termination, routing by hostname or path, authentication integration, request-size limits, logging, caching, compression, and load balancing.

A reverse proxy is not the same as a network address translator. HTTP-aware proxies understand methods, paths, headers, and status codes, while basic address translation operates at lower layers and does not normally make routing decisions from HTTP fields. A reverse proxy is also different from a forward proxy: a forward proxy represents clients reaching destinations, whereas a reverse proxy represents destination services to clients.

Address binding is fundamental. A backend listening on 127.0.0.1:9001 accepts connections originating on the same host but is not directly reachable through a normal external interface. A proxy listening on 127.0.0.1:8080 is similarly local-only in this lesson. Production deployments may expose the proxy on selected network interfaces while keeping backends on loopback or a private service network. Exposure should always be intentional rather than achieved by indiscriminately listening on every interface.

Proxies must handle metadata carefully. The Host header can drive virtual-host routing and application URL generation. X-Forwarded-For, X-Forwarded-Proto, and X-Forwarded-Host communicate information that would otherwise be lost when the proxy creates a new upstream connection. These headers are trustworthy only when the application knows which proxies are trusted. A client can submit forged X-Forwarded-* values, so a public-facing proxy should replace, sanitize, or safely append them according to an explicit trust policy. Standardized Forwarded headers provide related functionality, but many applications still use X-Forwarded-* conventions.

HTTP also defines hop-by-hop behavior. Fields associated with one connection, including Connection and Transfer-Encoding, must not be copied blindly to another connection. A production proxy has extensive logic for message framing, streaming, upgrades, timeouts, retries, malformed requests, and protocol versions. The small Python proxy in this lesson is intentionally limited: it demonstrates request flow and selected headers, but it is not hardened, does not implement TLS, does not perform robust streaming, and must not be treated as a production gateway.

Failure location matters during diagnosis. If the backend deliberately returns an error, the proxy can still be healthy because it successfully transported the response. If the proxy cannot connect to the backend, the proxy itself commonly returns 502 Bad Gateway. If no process is listening on the proxy port, the client receives a connection failure before any HTTP status can be produced. Separating these layers prevents random configuration changes and helps operators test the client-to-proxy and proxy-to-upstream legs independently.

## Architecture

### request_flow
The client connects to 127.0.0.1:8080.
The reverse proxy accepts the HTTP request and records the original Host value.
The proxy creates a new connection to the upstream at 127.0.0.1:9001.
The proxy removes selected hop-by-hop headers and adds controlled X-Forwarded-* headers.
The backend returns a JSON document describing the request it observed.
The proxy relays the backend status, end-to-end headers, and response body to the client.

### diagram
client curl -> 127.0.0.1:8080 reverse proxy -> 127.0.0.1:9001 backend

### trust_boundaries
Client-supplied forwarding headers are untrusted.
The proxy is responsible for creating forwarding metadata accepted by the backend.
The loopback-only backend listener reduces network exposure but does not replace application authentication or operating-system isolation.

### production_comparison
A production design would normally use a maintained proxy such as NGINX, HAProxy, Apache HTTP Server, Caddy, Traefik, Envoy, or a managed gateway. It would also define TLS policy, timeouts, request limits, logging controls, trusted-proxy networks, health checks, and monitored upstream pools.

## Required reading

- Review the HTTP request-response model, including methods, paths, headers, status codes, and message bodies.
- Review the distinction between 127.0.0.1 and externally reachable interface addresses.
- Read RFC 9110 sections covering HTTP fields, methods, status codes, and intermediaries.
- Read RFC 7239 for the standardized Forwarded HTTP header and compare it conceptually with the commonly used X-Forwarded-* headers.

## References

- RFC 9110, HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110
- RFC 9112, HTTP/1.1: https://www.rfc-editor.org/rfc/rfc9112
- RFC 7239, Forwarded HTTP Extension: https://www.rfc-editor.org/rfc/rfc7239
- Python documentation, http.server: https://docs.python.org/3/library/http.server.html
- Python documentation, http.client: https://docs.python.org/3/library/http.client.html
- NGINX documentation, Beginner's Guide: https://nginx.org/en/docs/beginners_guide.html
- HAProxy documentation: https://www.haproxy.org/documentation/
- OWASP Transport Layer Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html

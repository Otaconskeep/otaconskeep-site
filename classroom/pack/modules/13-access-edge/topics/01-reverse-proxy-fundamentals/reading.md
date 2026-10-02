# Reading: Reverse Proxy Fundamentals

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Distinguish a reverse proxy from a forward proxy and from direct client-to-service access

## Vocabulary

| Term | Meaning |
|---|---|
| Reverse proxy | A server that accepts requests on behalf of one or more upstream servers and returns their responses to clients. |
| Forward proxy | A proxy used by clients to reach external destinations; it represents the client rather than the destination service. |
| Upstream | The backend application or service to which a reverse proxy forwards a request. |
| Downstream | The client-facing side of a proxy connection, including the client that sent the request. |
| Listener | An IP address and TCP port on which a process waits for incoming connections. |
| TLS termination | The act of decrypting HTTPS at a proxy so that the proxy can inspect and route the HTTP request before forwarding it. |
| Host header | An HTTP request field identifying the authority or virtual host the client intended to reach. |
| X-Forwarded-For | A commonly used nonstandard header carrying information about the original client address through proxies. |
| X-Forwarded-Proto | A commonly used header indicating whether the original client-facing request used HTTP or HTTPS. |
| Health check | A request or probe used to determine whether an upstream service is available and suitable to receive traffic. |
| 502 Bad Gateway | A response commonly returned by a proxy when it cannot obtain a valid response from its upstream. |
| Hop-by-hop header | A header that applies to one transport connection and generally must not be forwarded unchanged by an intermediary. |

## Instruction

A reverse proxy sits between clients and application servers. The client connects to the proxy's listener and usually does not need to know the upstream application's address or port. The proxy parses enough of the request to choose an upstream, opens a separate connection to that upstream, forwards an appropriate request, receives the response, and relays the result. These are two distinct transport connections: client-to-proxy and proxy-to-upstream. That distinction is essential when troubleshooting timeouts, source addresses, TLS, and connection limits.

A reverse proxy differs from a forward proxy primarily by whom it represents. A forward proxy represents a client that wants to reach other destinations. A reverse proxy represents destination services and provides one controlled entry point for them. Common reverse-proxy functions include hostname-based routing, path-based routing, TLS termination, load balancing, authentication, request-size limits, response compression, caching, observability, and maintenance responses. A proxy is not automatically a security solution; unsafe configuration can expose administrative paths, trust spoofed headers, or unintentionally publish an internal service.

HTTP headers carry important context across the proxy boundary. Preserving Host allows an upstream to perform virtual-host routing, although some deployments deliberately replace Host with the upstream authority. X-Forwarded-For commonly records the original client address, X-Forwarded-Host records the original requested host, and X-Forwarded-Proto records the original client-facing scheme. These fields are only trustworthy when every component knows which proxy addresses are trusted. A public client can submit its own X-Forwarded-For header. An edge proxy should therefore overwrite untrusted forwarded fields or construct a validated chain rather than blindly accepting them. The upstream must likewise trust forwarded metadata only when the request came from an approved proxy.

Intermediaries also need to handle hop-by-hop headers correctly. Connection, Keep-Alive, Transfer-Encoding, Upgrade, TE, Trailer, and related fields describe a particular connection and cannot always be copied to the next connection. Production proxies implement detailed HTTP framing and protocol rules. The small Python proxy in this lab intentionally handles only simple GET requests and removes common hop-by-hop fields. It is an educational model, not a production replacement for a maintained proxy.

Failure location matters. If the upstream application intentionally returns 503, a working proxy should preserve that status so the client can see the application's response. If the proxy cannot connect to the upstream at all, the proxy commonly returns 502 because it could not complete its gateway role. A timeout may instead produce 504 in a production implementation. Logs and tests from both sides of the proxy are required to distinguish application errors, connection refusal, name-resolution problems, routing errors, and proxy policy decisions.

In the lab, the backend listens only on 127.0.0.1:18080 and the proxy listens only on 127.0.0.1:18081. Loopback binding prevents remote hosts from connecting to either listener. Requests to the proxy are forwarded to the backend, which returns JSON showing the headers it received. This makes the proxy's changes visible without installing software, changing a system service, or exposing a network-facing port.

## Architecture

### diagram
curl client -> 127.0.0.1:18081 reverse proxy -> 127.0.0.1:18080 backend application

### components
A curl client sends test requests from the local host.
A minimal Python reverse proxy listens on 127.0.0.1:18081.
A minimal Python backend listens on 127.0.0.1:18080.
The proxy preserves the requested Host value, overwrites untrusted X-Forwarded-* fields, adds Via, and forwards the request.
The backend returns JSON describing the path, apparent peer address, and selected request headers.

### request_flow
The client opens a TCP connection to port 18081.
The proxy accepts and parses the client request.
The proxy creates a separate TCP connection to port 18080.
The backend processes the forwarded request and produces an HTTP response.
The proxy relays the upstream status, selected headers, and body to the client.
The proxy and client close or reuse their respective connections independently.

### scope_limitations
The lab implements GET only.
The lab does not implement TLS, load balancing, caching, WebSocket upgrades, or production-grade HTTP framing.
Both listeners are bound to loopback and are not intended for remote access.

## Required reading

- Review the HTTP request and response model, including methods, status codes, headers, and message bodies.
- Review the difference between a listening address and a destination address.
- Review the meaning of loopback addresses such as 127.0.0.1.
- Read RFC 9110 sections relevant to HTTP fields, intermediaries, and status codes.
- Read RFC 7239 for the standardized Forwarded header and compare it with commonly deployed X-Forwarded-* headers.

## References

- RFC 9110, HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110
- RFC 9112, HTTP/1.1: https://www.rfc-editor.org/rfc/rfc9112
- RFC 7239, Forwarded HTTP Extension: https://www.rfc-editor.org/rfc/rfc7239
- MDN, Proxy servers and tunneling: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Proxy_servers_and_tunneling
- Python documentation, http.server: https://docs.python.org/3/library/http.server.html
- Python documentation, http.client: https://docs.python.org/3/library/http.client.html

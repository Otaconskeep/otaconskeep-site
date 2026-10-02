# Class 64: Reverse Proxy Fundamentals

**Learning objective:** Distinguish a reverse proxy from a forward proxy and from direct client-to-service access; Trace an HTTP request through a reverse proxy to an upstream application; Explain the purpose of Host, X-Forwarded-For, X-Forwarded-Host, X-Forwarded-Proto, and Via headers; Recognize the difference between an upstream application failure and an upstream connectivity failure; Explain why proxy trust boundaries matter when processing forwarded headers; Deploy and verify a small loopback-only reverse proxy without changing system services; Safely stop the lab and remove only the lab-created files
**Bloom level:** Understand / Apply
**Track:** Networking and Service Delivery · **Difficulty:** beginner · **Duration:** ~75 minutes · **Lab risk:** low
**Build output:** Explain how a reverse proxy accepts client requests, forwards them to an upstream service, returns upstream responses, and creates a controlled boundary for routing, logging, TLS termination, authentication, and policy enforcement.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### operating_system
Linux with loopback networking and permission to write to /opt/lab-classroom/class64/

### python
Python 3.9 or newer

### client_tool
curl with standard HTTP support

### network
No external network access is required after the lesson materials are available.

### ports
127.0.0.1:18080 for the backend
127.0.0.1:18081 for the reverse proxy

### privileges
No privileged port or persistent system-service change is required. Directory ownership must already permit the learner to create the lab files.

## Learning objective

- Distinguish a reverse proxy from a forward proxy and from direct client-to-service access
- Trace an HTTP request through a reverse proxy to an upstream application
- Explain the purpose of Host, X-Forwarded-For, X-Forwarded-Host, X-Forwarded-Proto, and Via headers
- Recognize the difference between an upstream application failure and an upstream connectivity failure
- Explain why proxy trust boundaries matter when processing forwarded headers
- Deploy and verify a small loopback-only reverse proxy without changing system services
- Safely stop the lab and remove only the lab-created files

## Why this matters

Explain how a reverse proxy accepts client requests, forwards them to an upstream service, returns upstream responses, and creates a controlled boundary for routing, logging, TLS termination, authentication, and policy enforcement.

## Prerequisites

- Basic familiarity with IP addresses, TCP ports, and HTTP requests
- Ability to use a Linux terminal
- Python 3.9 or newer
- curl installed for HTTP verification
- Write access to /opt/lab-classroom/class64/

## Required reading

- Review the HTTP request and response model, including methods, status codes, headers, and message bodies.
- Review the difference between a listening address and a destination address.
- Review the meaning of loopback addresses such as 127.0.0.1.
- Read RFC 9110 sections relevant to HTTP fields, intermediaries, and status codes.
- Read RFC 7239 for the standardized Forwarded header and compare it with commonly deployed X-Forwarded-* headers.

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

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

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Draw a production design with one public proxy and two private upstream applications. Label every listener, trust boundary, and TLS connection.
Describe how hostname-based routing could send app.example.test to one upstream and media.example.test to another.
Explain why an application must not trust X-Forwarded-For from every source address.
Modify only /opt/lab-classroom/class64/proxy.py so that requests beginning with /blocked receive a local 403 response without contacting the backend.
Add a response header named X-Class64-Proxy with the value active, then verify whether it was generated by the proxy or the backend.
Document how a production proxy should distinguish readiness checks from liveness checks.

## Feynman teach-back

Explain the lab as if teaching a new student: The client thinks port 18081 is the service, but that port belongs to the proxy. The proxy receives the request and makes a second request to the real application on port 18080. The application therefore sees the proxy as its immediate network peer. To preserve useful client context, the proxy adds forwarding headers, but those headers are trustworthy only because the proxy replaces values supplied by an untrusted client. If the application returns 503, the proxy can relay that application response. If the application cannot be reached at all, the proxy generates 502. If this explanation is unclear, draw the two separate TCP connections and label which process generates each status code.

## Retrieval check

1. 1. What is the primary difference between a reverse proxy and a forward proxy?
2. 2. How many distinct TCP connections are normally involved when a client reaches an upstream HTTP service through a reverse proxy?
3. 3. Why should a public-facing proxy overwrite or validate a client-supplied X-Forwarded-For header?
4. 4. Which status code commonly indicates that a proxy could not obtain a valid response from its upstream?
5. 5. In this lab, what is the diagnostic difference between the backend returning 503 and the proxy returning 502?
6. 6. Why are hop-by-hop headers not copied blindly from one side of a proxy to the other?
7. 7. What security property is provided by binding both lab listeners to 127.0.0.1?
8. 8. Why is the Python proxy in this lesson unsuitable as a production reverse proxy?

## Guided lab

### workspace
/opt/lab-classroom/class64/

### safety_boundary
Every file created by this lab is stored under /opt/lab-classroom/class64/. No package manager, system service, privileged port, external interface, or persistent operating-system configuration is changed.

### steps
### step
1

### title
Create the isolated workspace

### instructions
Run the following command from a terminal with permission to write beneath /opt/lab-classroom:

### command
mkdir -p /opt/lab-classroom/class64
### step
2

### title
Create the backend application

### instructions
Create /opt/lab-classroom/class64/backend.py with the exact content supplied in this step.

### path
/opt/lab-classroom/class64/backend.py

### content
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class BackendHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        status = 503 if self.path.startswith('/fail') else 200
        payload = {
            'service': 'class64-backend',
            'path': self.path,
            'status_generated_by_backend': status,
            'peer_seen_by_backend': self.client_address[0],
            'host': self.headers.get('Host'),
            'x_forwarded_for': self.headers.get('X-Forwarded-For'),
            'x_forwarded_host': self.headers.get('X-Forwarded-Host'),
            'x_forwarded_proto': self.headers.get('X-Forwarded-Proto'),
            'via': self.headers.get('Via')
        }
        body = json.dumps(payload, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print('backend:', format % args)

server = ThreadingHTTPServer(('127.0.0.1', 18080), BackendHandler)
print('Backend listening on http://127.0.0.1:18080')
server.serve_forever()

### step
3

### title
Create the reverse proxy

### instructions
Create /opt/lab-classroom/class64/proxy.py with the exact content supplied in this step.

### path
/opt/lab-classroom/class64/proxy.py

### content
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

UPSTREAM_HOST = '127.0.0.1'
UPSTREAM_PORT = 18080
HOP_BY_HOP = {
    'connection', 'keep-alive', 'proxy-authenticate',
    'proxy-authorization', 'proxy-connection', 'te',
    'trailer', 'transfer-encoding', 'upgrade'
}

class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        original_host = self.headers.get('Host', '')
        upstream_headers = {
            name: value
            for name, value in self.headers.items()
            if name.lower() not in HOP_BY_HOP
            and name.lower() not in {
                'x-forwarded-for', 'x-forwarded-host',
                'x-forwarded-proto', 'via'
            }
        }
        upstream_headers['X-Forwarded-For'] = self.client_address[0]
        upstream_headers['X-Forwarded-Host'] = original_host
        upstream_headers['X-Forwarded-Proto'] = 'http'
        upstream_headers['Via'] = '1.1 class64-proxy'

        connection = http.client.HTTPConnection(
            UPSTREAM_HOST, UPSTREAM_PORT, timeout=3
        )
        try:
            connection.request('GET', self.path, headers=upstream_headers)
            response = connection.getresponse()
            body = response.read()
            self.send_response(response.status, response.reason)
            for name, value in response.getheaders():
                if name.lower() not in HOP_BY_HOP and name.lower() not in {'server', 'date'}:
                    self.send_header(name, value)
            self.end_headers()
            self.wfile.write(body)
        except (OSError, http.client.HTTPException) as error:
            self.send_error(502, 'Upstream unavailable: ' + str(error))
        finally:
            connection.close()

    def log_message(self, format, *args):
        print('proxy:', format % args)

server = ThreadingHTTPServer(('127.0.0.1', 18081), ProxyHandler)
print('Proxy listening on http://127.0.0.1:18081')
server.serve_forever()

### step
4

### title
Start the backend

### instructions
In terminal A, run the backend in the foreground. Leave this terminal open so its request log remains visible.

### command
python3 /opt/lab-classroom/class64/backend.py
### step
5

### title
Start the reverse proxy

### instructions
In terminal B, run the proxy in the foreground. Leave this terminal open.

### command
python3 /opt/lab-classroom/class64/proxy.py
### step
6

### title
Send a request through the proxy

### instructions
In terminal C, request the proxy listener rather than the backend listener.

### command
curl -i -H 'Host: app.class64.test' -H 'X-Forwarded-For: 203.0.113.99' 'http://127.0.0.1:18081/hello?source=proxy'
### step
7

### title
Compare direct backend access

### instructions
Request the backend directly. Compare its JSON with the proxied response, especially the forwarded fields and Via field.

### command
curl -i -H 'Host: direct.class64.test' 'http://127.0.0.1:18080/hello?source=direct'
### step
8

### title
Observe an application-generated failure

### instructions
Request the backend's failure path through the proxy. The backend intentionally generates the 503 response, and the proxy relays it.

### command
curl -i 'http://127.0.0.1:18081/fail'
### step
9

### title
Observe an upstream connectivity failure

### instructions
Stop only the backend in terminal A with Ctrl-C, leave the proxy running, and repeat the request. The proxy should generate a 502 because it cannot connect to its upstream.

### command
curl -i 'http://127.0.0.1:18081/hello'

## Expected results

- The backend starts with the message Backend listening on http://127.0.0.1:18080.
- The proxy starts with the message Proxy listening on http://127.0.0.1:18081.
- A request to port 18081 returns JSON produced by class64-backend.
- The proxied JSON reports the requested path as /hello?source=proxy.
- The proxied JSON reports app.class64.test as both host and x_forwarded_host.
- The proxy overwrites the client-supplied X-Forwarded-For value, so the backend sees 127.0.0.1 rather than 203.0.113.99.
- The proxied JSON reports http as x_forwarded_proto and 1.1 class64-proxy as via.
- A direct request to port 18080 lacks proxy-generated forwarded fields.
- The /fail request returns HTTP 503 while the backend is running.
- After the backend is stopped, a request through the still-running proxy returns HTTP 502.

## Verification checkpoints

- [ ] Run curl -i http://127.0.0.1:18080/health and confirm the backend returns HTTP 200 while it is running.
- [ ] Run curl -i http://127.0.0.1:18081/health and confirm the request reaches the same backend through the proxy.
- [ ] Run curl -i -H 'Host: verify.class64.test' http://127.0.0.1:18081/check and confirm host and x_forwarded_host both contain verify.class64.test.
- [ ] Run curl -i -H 'X-Forwarded-For: 203.0.113.99' http://127.0.0.1:18081/check and confirm x_forwarded_for is 127.0.0.1, demonstrating that untrusted client input was overwritten.
- [ ] Run curl -i http://127.0.0.1:18081/fail and confirm HTTP 503 is returned while the backend remains available.
- [ ] Stop the backend, repeat curl -i http://127.0.0.1:18081/check, and confirm the proxy returns HTTP 502.
- [ ] Stop the proxy and confirm subsequent requests to port 18081 fail to connect, proving the temporary listener is gone.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| Python reports Permission denied while creating a lab file. | The current account does not have write access to /opt/lab-classroom/class64/. | Have the lab administrator create the permitted classroom directory with ownership appropriate for the student account. Do not redirect the lab into unrelated system paths. |
| Python reports Address already in use for port 18080. | Another process or an earlier backend instance is already listening on that port. | Stop the earlier class64 backend terminal. If the listener is unrelated, ask the lab administrator to identify it rather than terminating an unknown process. |
| Python reports Address already in use for port 18081. | Another process or an earlier proxy instance is already listening on that port. | Stop the earlier class64 proxy terminal. Do not terminate an unidentified process merely to free the port. |
| A request to port 18081 returns 502 immediately. | The backend is stopped, failed to start, or is not listening on 127.0.0.1:18080. | Check terminal A for errors, start backend.py, and verify direct access to http://127.0.0.1:18080/health before retrying the proxy. |
| The request to /fail returns 503. | This is the intentional application-generated failure used by the lesson. | No repair is required. Compare it with the 502 produced after the backend is stopped. |
| The supplied X-Forwarded-For value does not appear in the backend response. | The lab proxy deliberately overwrites untrusted client-supplied forwarding metadata. | Treat this as the expected secure behavior at the proxy trust boundary. |
| The direct backend request contains no Via or X-Forwarded-* values. | The request bypassed the proxy, so no intermediary added those fields. | Send the request to port 18081 when testing proxy behavior. |
| curl displays Failed to connect after the failure test. | The proxy was stopped instead of only the backend, or it exited because of an earlier error. | Restart proxy.py in terminal B and confirm it reports that it is listening on port 18081. |

## Security considerations

### principles
Bind internal services only to interfaces that require access. Loopback binding is used here to avoid remote exposure.
Do not trust X-Forwarded-* or Forwarded values merely because the headers exist.
Define which proxy addresses are trusted, overwrite metadata at the public edge, and configure upstream applications to trust only approved proxies.
Avoid exposing an upstream directly when access controls are enforced only at the proxy.
Apply authentication and authorization at a layer that cannot be bypassed.
Limit accepted request sizes, header sizes, methods, connection counts, and timeouts in production.
Do not log credentials, session cookies, authorization headers, or sensitive query strings without an explicit protected logging policy.
Keep production proxy software updated and use maintained implementations rather than the educational proxy in this lesson.
Protect administrative dashboards and metrics endpoints separately from ordinary application routes.
Use TLS for traffic that crosses an untrusted network, including proxy-to-upstream traffic when the internal network is not trusted.

### trust_boundary_note
The client controls every header it sends. Forwarded identity becomes meaningful only when a trusted proxy validates or replaces client input and the upstream accepts such identity only from that proxy.

### production_warning
The Python proxy demonstrates request flow but does not provide production-grade protocol parsing, TLS, request-body handling, concurrency controls, access policy, resilient retries, or comprehensive header processing.

## Rollback

### stop_services
In terminal A, press Ctrl-C if the backend is still running.
In terminal B, press Ctrl-C if the proxy is still running.
Confirm that requests to ports 18080 and 18081 no longer connect.

### retain_option
The Python files may remain under /opt/lab-classroom/class64/ as inert lesson artifacts. No listener remains after both foreground processes are stopped.

### optional_cleanup
After verifying the exact path, the bounded cleanup command documented in dangerous_commands may be used to remove /opt/lab-classroom/class64/ and its lesson files.

### post_rollback_state
No system service, startup configuration, package, external listener, or operating-system network policy was changed by the lab.

## Video narration notes

Begin with a diagram containing three boxes: client, reverse proxy, and backend. Emphasize that the arrows represent two separate TCP connections, not a single connection passing transparently through the proxy. Compare this with direct backend access and then briefly contrast a reverse proxy with a client-oriented forward proxy. Introduce the lab ports: 18081 for the proxy and 18080 for the backend. Explain that both bind to loopback, keeping the exercise local.

Show the backend code first. Point out that it reports the path, immediate peer, Host, forwarding fields, and Via. Explain that /fail deliberately returns 503. Next show the proxy code. Highlight the fixed upstream, removal of common hop-by-hop fields, preservation of Host, replacement of client-supplied forwarding metadata, and the local 502 error path.

Start the backend and proxy in separate terminals. Send a request with a custom Host and a forged X-Forwarded-For value. In the returned JSON, identify the original host and show that the forged address was replaced with 127.0.0.1. Send a request directly to the backend and compare the missing forwarding metadata. Then request /fail and explain that 503 came from a reachable application. Stop the backend while leaving the proxy active and repeat the request. Explain that 502 now comes from the proxy because its upstream connection failed.

Conclude by discussing trusted-proxy configuration, direct-backend bypass risk, TLS termination, health checks, logging, and why the educational Python implementation must not be deployed as a production edge service. Stop both foreground processes and verify that neither listener remains.

## References

- RFC 9110, HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110
- RFC 9112, HTTP/1.1: https://www.rfc-editor.org/rfc/rfc9112
- RFC 7239, Forwarded HTTP Extension: https://www.rfc-editor.org/rfc/rfc7239
- MDN, Proxy servers and tunneling: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Proxy_servers_and_tunneling
- Python documentation, http.server: https://docs.python.org/3/library/http.server.html
- Python documentation, http.client: https://docs.python.org/3/library/http.client.html

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

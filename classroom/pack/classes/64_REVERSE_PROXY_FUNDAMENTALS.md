# Class 64: Reverse Proxy Fundamentals

**Learning objective:** Distinguish a reverse proxy from a forward proxy.; Trace an HTTP request from a client through a reverse proxy to an upstream service.; Explain listener addresses, upstream addresses, Host headers, and X-Forwarded-* headers.; Recognize the difference between a proxy-generated error and an application-generated error.; Verify that a backend is reachable only through the intended local interfaces in this lab.; Describe common production reverse-proxy responsibilities, including TLS termination, routing, health checks, authentication integration, and request limits.; Safely stop the lab services and return the host to its prior operational state.
**Bloom level:** Understand / Apply
**Track:** Networking and Web Services · **Difficulty:** beginner · **Duration:** ~75 minutes · **Lab risk:** low
**Build output:** Explain how a reverse proxy receives client requests, selects an upstream service, forwards request metadata, returns upstream responses, and creates a controlled boundary between clients and backend applications. The lab builds an isolated educational proxy and backend using only the Python standard library.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### operating_systems
Debian 11 or newer
Ubuntu 20.04 LTS or newer
Rocky Linux 8 or newer
AlmaLinux 8 or newer
Other Linux distributions with equivalent Python and procfs behavior

### runtime
Python 3.8 or newer using only the standard library.

### network
IPv4 loopback support with TCP ports 8080 and 9001 available.

### shell
A POSIX-like shell with standard process and text utilities.

### limitations
The guarded process verification reads Linux /proc process metadata. On a non-Linux Unix-like system, inspect process identity manually before stopping either service.

## Learning objective

- Distinguish a reverse proxy from a forward proxy.
- Trace an HTTP request from a client through a reverse proxy to an upstream service.
- Explain listener addresses, upstream addresses, Host headers, and X-Forwarded-* headers.
- Recognize the difference between a proxy-generated error and an application-generated error.
- Verify that a backend is reachable only through the intended local interfaces in this lab.
- Describe common production reverse-proxy responsibilities, including TLS termination, routing, health checks, authentication integration, and request limits.
- Safely stop the lab services and return the host to its prior operational state.

## Why this matters

Explain how a reverse proxy receives client requests, selects an upstream service, forwards request metadata, returns upstream responses, and creates a controlled boundary between clients and backend applications. The lab builds an isolated educational proxy and backend using only the Python standard library.

## Prerequisites

- Basic familiarity with TCP ports, IP addresses, and HTTP requests.
- A Linux host or virtual machine with Python 3.8 or newer.
- A shell account that can create /opt/lab-classroom/class64/.
- The curl command-line HTTP client.
- Ports 8080 and 9001 must be available on the loopback interface.

## Required reading

- Review the HTTP request-response model, including methods, paths, headers, status codes, and message bodies.
- Review the distinction between 127.0.0.1 and externally reachable interface addresses.
- Read RFC 9110 sections covering HTTP fields, methods, status codes, and intermediaries.
- Read RFC 7239 for the standardized Forwarded HTTP header and compare it conceptually with the commonly used X-Forwarded-* headers.

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

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

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Draw a request sequence showing the client connection, proxy connection, request headers, backend response, and final client response.
Modify only `/opt/lab-classroom/class64/proxy.py` to route paths beginning with `/api/` to a second loopback backend on port 9002. Keep all new files and logs under the class directory.
Write a short policy specifying which proxy addresses an application should trust and what it should do with client-supplied forwarding headers.
Research one maintained reverse-proxy product and identify its directives or settings for upstream timeouts, request-size limits, access logs, Host handling, and trusted client-address headers.
Explain how TLS termination changes the client-to-proxy and proxy-to-backend connections, including when re-encryption may be appropriate.
Compare a 502 response, a connection-refused error, and an application-generated 500 response. State which component can generate each condition.

## Feynman teach-back

### prompt
Explain the lab to someone who knows what a website is but has never heard of a reverse proxy.

### model_explanation
The backend is like a kitchen, and the reverse proxy is like the service counter. A customer gives an order to the counter instead of walking into the kitchen. The counter records useful information, passes the order to the kitchen, receives the finished result, and hands it back. Customers only need to know the counter address even if the kitchen later moves or several kitchens are added. If the kitchen is unavailable but the counter is still open, the counter can report a gateway error. Because customers can write misleading notes on an order, the counter must create trusted delivery information itself rather than believing every forwarding label supplied by a customer.

### self_check
Can you identify which process accepted the client connection?
Can you identify which process generated a 502 when the backend was down?
Can you explain why the backend sees the proxy as its immediate network peer?
Can you explain why forwarding headers must have a trust policy?
Can you explain why loopback binding reduces exposure?

## Retrieval check

1. 1. What is the primary difference between a reverse proxy and a forward proxy?
2. 2. In the lab, which address and port accept the client's proxied HTTP request?
3. 3. Why does the proxy remove or avoid blindly forwarding hop-by-hop headers?
4. 4. What does X-Forwarded-Proto communicate to an upstream application?
5. 5. Why must an application not automatically trust every client-supplied X-Forwarded-For value?
6. 6. What failure is demonstrated when the proxy remains running but the backend is stopped?
7. 7. Why is binding the backend to 127.0.0.1 safer than binding it to every interface when only a same-host proxy needs access?
8. 8. Does a successful HTTP connection to the proxy prove that the backend is healthy? Explain.
9. 9. What is TLS termination?
10. 10. Why is the Python proxy from this lesson unsuitable for production use?

## Guided lab

### scope
All files created by this lab are under /opt/lab-classroom/class64/. Both network listeners bind only to 127.0.0.1. The programs use the Python standard library and are intentionally educational rather than production-ready.

### steps
### step
1

### title
Create the isolated lab directory

### command
sudo install -d -o "$USER" -g "$(id -gn)" /opt/lab-classroom/class64
cd /opt/lab-classroom/class64
pwd

### explanation
The resulting path must be /opt/lab-classroom/class64. Do not continue from a different working directory.
### step
2

### title
Create the backend service

### command
cat > /opt/lab-classroom/class64/backend.py <<'PY'
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json

HOST = "127.0.0.1"
PORT = 9001

class BackendHandler(BaseHTTPRequestHandler):
    server_version = "Class64Backend/1.0"

    def handle_request(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        body = self.rfile.read(length) if length else b""
        response = {
            "service": "class64-backend",
            "method": self.command,
            "path": self.path,
            "host": self.headers.get("Host"),
            "x_forwarded_for": self.headers.get("X-Forwarded-For"),
            "x_forwarded_proto": self.headers.get("X-Forwarded-Proto"),
            "x_forwarded_host": self.headers.get("X-Forwarded-Host"),
            "body": body.decode("utf-8", errors="replace")
        }
        payload = json.dumps(response, indent=2, sort_keys=True).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    do_GET = handle_request
    do_POST = handle_request

if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), BackendHandler)
    print(f"Backend listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()
PY
python3 -m py_compile /opt/lab-classroom/class64/backend.py

### explanation
The backend returns request information as JSON so that header and path behavior can be inspected.
### step
3

### title
Create the educational reverse proxy

### command
cat > /opt/lab-classroom/class64/proxy.py <<'PY'
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import http.client

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 8080
UPSTREAM_HOST = "127.0.0.1"
UPSTREAM_PORT = 9001
HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade"
}

class ProxyHandler(BaseHTTPRequestHandler):
    server_version = "Class64Proxy/1.0"

    def proxy_request(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_error(400, "Invalid Content-Length")
            return

        body = self.rfile.read(length) if length else None
        outbound_headers = {}
        for name, value in self.headers.items():
            if name.lower() not in HOP_BY_HOP and name.lower() not in {
                "x-forwarded-for",
                "x-forwarded-proto",
                "x-forwarded-host"
            }:
                outbound_headers[name] = value

        original_host = self.headers.get("Host", "")
        outbound_headers["X-Forwarded-For"] = self.client_address[0]
        outbound_headers["X-Forwarded-Proto"] = "http"
        outbound_headers["X-Forwarded-Host"] = original_host

        connection = http.client.HTTPConnection(UPSTREAM_HOST, UPSTREAM_PORT, timeout=5)
        try:
            connection.request(self.command, self.path, body=body, headers=outbound_headers)
            upstream_response = connection.getresponse()
            response_body = upstream_response.read()
            self.send_response(upstream_response.status, upstream_response.reason)
            for name, value in upstream_response.getheaders():
                if name.lower() not in HOP_BY_HOP:
                    self.send_header(name, value)
            self.end_headers()
            self.wfile.write(response_body)
        except (OSError, http.client.HTTPException):
            self.send_error(502, "Bad Gateway")
        finally:
            connection.close()

    do_GET = proxy_request
    do_POST = proxy_request

if __name__ == "__main__":
    server = ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), ProxyHandler)
    print(
        f"Proxy listening on http://{LISTEN_HOST}:{LISTEN_PORT}; "
        f"upstream is http://{UPSTREAM_HOST}:{UPSTREAM_PORT}",
        flush=True
    )
    server.serve_forever()
PY
python3 -m py_compile /opt/lab-classroom/class64/proxy.py

### explanation
The proxy creates a separate upstream connection, rejects client control of the forwarding headers used by the lab, and omits selected hop-by-hop headers.
### step
4

### title
Start the backend and proxy

### command
cd /opt/lab-classroom/class64
nohup python3 -B backend.py > backend.log 2>&1 & echo $! > backend.pid
sleep 1
nohup python3 -B proxy.py > proxy.log 2>&1 & echo $! > proxy.pid
sleep 1
cat backend.log
cat proxy.log

### explanation
Process identifiers and logs remain in the class directory. If either log contains a traceback, stop and use the troubleshooting section before continuing.
### step
5

### title
Compare direct and proxied requests

### command
curl --fail --silent --show-error http://127.0.0.1:9001/direct
printf '\n--- proxied request ---\n'
curl --fail --silent --show-error http://127.0.0.1:8080/through-proxy
printf '\n'

### explanation
The direct request should have null forwarding fields. The proxied request should show values created by the proxy.
### step
6

### title
Inspect Host and forwarding behavior

### command
curl --fail --silent --show-error -H 'Host: app.lab.example' -H 'X-Forwarded-For: 203.0.113.50' http://127.0.0.1:8080/header-test
printf '\n'

### explanation
The backend should see app.lab.example as both Host and X-Forwarded-Host. It should see 127.0.0.1 as X-Forwarded-For rather than trusting the client-supplied example address.
### step
7

### title
Send a request body through the proxy

### command
curl --fail --silent --show-error -X POST -H 'Content-Type: text/plain' --data 'reverse proxy lab' http://127.0.0.1:8080/submit
printf '\n'

### explanation
The backend should report POST, /submit, and the submitted body. This demonstrates that the proxy handles more than the URL path.
### step
8

### title
Observe an upstream failure

### command
pid="$(cat /opt/lab-classroom/class64/backend.pid)"
case "$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null)" in
  *'/opt/lab-classroom/class64/backend.py'*|*'backend.py'*) kill "$pid" ;;
  *) echo 'Refusing to stop an unverified process' >&2; exit 1 ;;
esac
sleep 1
curl --silent --show-error --output /opt/lab-classroom/class64/failure-body.txt --write-out 'HTTP status: %{http_code}\n' http://127.0.0.1:8080/upstream-down
cat /opt/lab-classroom/class64/failure-body.txt

### explanation
The proxy remains reachable but cannot contact its upstream, so it should return an HTTP 502 response. The response body is stored inside the lab directory.
### step
9

### title
Restart the backend and confirm recovery

### command
cd /opt/lab-classroom/class64
nohup python3 -B backend.py > backend.log 2>&1 & echo $! > backend.pid
sleep 1
curl --fail --silent --show-error http://127.0.0.1:8080/recovered
printf '\n'

### explanation
A successful response confirms that the proxy can reach the restored upstream without being restarted.

## Expected results

- Both startup logs report loopback listeners: the backend on 127.0.0.1:9001 and the proxy on 127.0.0.1:8080.
- A direct request to port 9001 returns service information but no proxy-created X-Forwarded-* values.
- A request to port 8080 reaches the same backend through the reverse proxy.
- The proxied response reports 127.0.0.1 in x_forwarded_for and http in x_forwarded_proto.
- The custom Host value app.lab.example reaches the backend and is also recorded in x_forwarded_host.
- The client-supplied X-Forwarded-For example value is not trusted or passed through by the educational proxy.
- A POST request preserves the method, path, and text body.
- Stopping only the backend causes the reachable proxy to return HTTP 502.
- Restarting the backend restores successful proxied requests without restarting the proxy.

## Verification checkpoints

- [ ] Run `curl --fail --silent --show-error http://127.0.0.1:9001/health` and confirm the JSON contains `"service": "class64-backend"`.
- [ ] Run `curl --fail --silent --show-error http://127.0.0.1:8080/health` and confirm the JSON contains `"x_forwarded_for": "127.0.0.1"`.
- [ ] Run `curl --fail --silent --show-error -H 'Host: verify.lab.example' http://127.0.0.1:8080/check` and confirm both host and x_forwarded_host are verify.lab.example.
- [ ] Run `curl --silent --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:8080/status` while both services are running and confirm the result is 200.
- [ ] Run `ss -ltn | grep -E '127\.0\.0\.1:(8080|9001)'` and confirm both listeners are bound to 127.0.0.1 rather than 0.0.0.0.
- [ ] Inspect `/opt/lab-classroom/class64/proxy.log` and `/opt/lab-classroom/class64/backend.log` to correlate client requests with proxy and backend activity.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The startup log reports Address already in use. | Another process is already listening on port 8080 or 9001, or a previous class process remains active. | Use `ss -ltnp` to identify the listener. Stop only a process you own and have positively identified. Alternatively, change both the relevant listener and upstream port constants while keeping all lab files under the class directory. |
| curl reports connection refused on port 8080. | The proxy did not start, terminated because of a Python error, or is listening on a different address or port. | Read `/opt/lab-classroom/class64/proxy.log`, verify the PID with `ps -p "$(cat /opt/lab-classroom/class64/proxy.pid)"`, and correct any syntax or port issue before starting it again. |
| The proxy returns 502 Bad Gateway. | The backend is stopped, port 9001 is incorrect, or the backend failed during startup. | Test `http://127.0.0.1:9001/health` directly, inspect `backend.log`, verify the backend process, and confirm that the proxy upstream constants match the backend listener. |
| The backend sees an unexpected Host value. | The client supplied a different Host header, or the proxy code was changed to replace Host with the upstream address. | Repeat the request with an explicit Host header and inspect the outbound-header construction in proxy.py. In production, decide deliberately whether to preserve or replace Host based on application requirements. |
| The expected X-Forwarded-For value is missing on a proxied request. | The request was sent directly to port 9001 or the forwarding-header code was altered. | Confirm the request targets port 8080 and verify that proxy.py sets X-Forwarded-For before calling `connection.request`. |
| The stop command refuses to stop an unverified process. | The PID file is stale, the process has already exited, or the operating system reused the PID. | Do not bypass the identity check. Inspect the PID file, `ps`, and the class logs. Remove or replace a stale PID file only after confirming that it does not identify a running class service. |
| Python compilation creates a permission error. | The class directory or existing files are owned by another account. | Inspect ownership with `ls -ld /opt/lab-classroom/class64` and `ls -l` inside it. Have an administrator assign the lab directory to the intended learner rather than broadening permissions indiscriminately. |

## Security considerations

### principles
Expose only the proxy listener that clients actually need; keep upstream services on loopback or a controlled private network when architecture permits.
Never trust client-supplied X-Forwarded-* or Forwarded fields merely because they exist.
Configure applications with an explicit list or range of trusted proxy addresses before using forwarding headers for authorization, secure-cookie decisions, redirects, audit attribution, or rate limiting.
Use maintained production proxy software rather than the demonstration script.
Define upstream connect, read, write, and idle timeouts so failed or slow services do not consume resources indefinitely.
Set request-header and body-size limits appropriate to the application.
Protect external traffic with correctly configured TLS and automate certificate renewal monitoring.
Avoid placing credentials, session tokens, or sensitive bodies in routine access logs.
Patch the proxy, TLS libraries, operating system, and backend applications.
Apply authentication and authorization at the correct layer; network placement alone does not authenticate a caller.

### lab_limitations
The educational proxy does not provide TLS, authentication, streaming, WebSocket support, robust HTTP message framing, rate limiting, health-based upstream selection, production logging, or defenses against hostile traffic. It must remain loopback-only and must not be exposed as an Internet-facing service.

### header_warning
Forwarding headers represent a trust boundary. This lab replaces client-provided X-Forwarded-For, X-Forwarded-Proto, and X-Forwarded-Host values. More complex deployments with multiple trusted proxies require a documented append and parsing policy.

## Rollback

### goal
Stop both class services while leaving the lab files and logs available for inspection. No configuration outside /opt/lab-classroom/class64/ was changed.

### commands
cd /opt/lab-classroom/class64
for name in proxy backend; do pid_file="/opt/lab-classroom/class64/${name}.pid"; if [ -f "$pid_file" ]; then pid="$(cat "$pid_file")"; cmdline="$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null || true)"; case "$cmdline" in *"/opt/lab-classroom/class64/${name}.py"*|*"${name}.py"*) kill "$pid" ;; '') echo "$name is already stopped" ;; *) echo "Refusing to stop unverified PID $pid for $name" >&2 ;; esac; fi; done
sleep 1
ss -ltn | grep -E '127\.0\.0\.1:(8080|9001)' || printf 'Class listener ports are no longer present.\n'

### post_rollback_state
No class service should listen on ports 8080 or 9001. Source files, logs, PID files, and the captured failure response remain under /opt/lab-classroom/class64/ for review.

## Video narration notes

Begin with the architecture diagram: curl is the client, port 8080 is the reverse-proxy listener, and port 9001 is the upstream backend. Emphasize that the client opens one TCP connection to the proxy and the proxy opens a different connection to the backend. Create the isolated class directory, then walk through the backend code. Show that it returns the method, path, Host, forwarding headers, and body as JSON. Next, review the proxy code. Point out the loopback listener, fixed upstream, hop-by-hop header filtering, and replacement of client-supplied X-Forwarded-* fields. Start both processes and inspect their logs before testing. Compare a direct backend request with a request through the proxy. Use a custom Host header and a forged X-Forwarded-For value to demonstrate why the proxy must control trusted forwarding metadata. Send a POST request to show that method and body handling are part of proxy behavior. Stop only the verified backend process, leave the proxy running, and demonstrate the resulting 502 response. Explain that connection refused at port 8080, a proxy-generated 502, and an application-generated 500 represent failures at different layers. Restart the backend and verify recovery. Close by stressing that the Python program is a teaching aid, not a production gateway, and then execute the rollback procedure to stop both verified class processes.

## References

- RFC 9110, HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110
- RFC 9112, HTTP/1.1: https://www.rfc-editor.org/rfc/rfc9112
- RFC 7239, Forwarded HTTP Extension: https://www.rfc-editor.org/rfc/rfc7239
- Python documentation, http.server: https://docs.python.org/3/library/http.server.html
- Python documentation, http.client: https://docs.python.org/3/library/http.client.html
- NGINX documentation, Beginner's Guide: https://nginx.org/en/docs/beginners_guide.html
- HAProxy documentation: https://www.haproxy.org/documentation/
- OWASP Transport Layer Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html

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

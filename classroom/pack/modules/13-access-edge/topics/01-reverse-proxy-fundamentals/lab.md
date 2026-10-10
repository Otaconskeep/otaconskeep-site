# Lab: Reverse Proxy Fundamentals

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Distinguish a reverse proxy from a forward proxy.

## Before you start

- Basic familiarity with TCP ports, IP addresses, and HTTP requests.
- A Linux host or virtual machine with Python 3.8 or newer.
- A shell account that can create /opt/lab-classroom/class64/.
- The curl command-line HTTP client.
- Ports 8080 and 9001 must be available on the loopback interface.

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

## Verification

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

## Security

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

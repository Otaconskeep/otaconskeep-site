# Lab: Reverse Proxy Fundamentals

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Distinguish a reverse proxy from a forward proxy and from direct client-to-service access

## Before you start

- Basic familiarity with IP addresses, TCP ports, and HTTP requests
- Ability to use a Linux terminal
- Python 3.9 or newer
- curl installed for HTTP verification
- Write access to /opt/lab-classroom/class64/

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

## Verification

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

## Security

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

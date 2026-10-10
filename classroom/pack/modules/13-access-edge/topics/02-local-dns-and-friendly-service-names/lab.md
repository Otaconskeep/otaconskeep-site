# Lab: Local DNS and Friendly Service Names

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain the roles of DNS clients, recursive resolvers, authoritative data, caching, and search domains

## Before you start

- Basic understanding of IPv4 addresses, ports, and client-server communication
- Ability to use a Linux shell and inspect running processes
- dnsmasq installed on the lab host
- The dig utility installed, commonly provided by a dnsutils or bind-utils package
- Permission to create files under /opt/lab-classroom/class65/ and bind a process to 127.0.0.1:1053
- Completion of introductory LAN addressing and DHCP lessons is recommended

## Guided lab

### scope
All files created or changed by this lab are confined to /opt/lab-classroom/class65/. No operating system resolver, network interface, DHCP service, or system-wide DNS configuration is modified.

### steps
### step
1

### name
Check required commands

### command
command -v dnsmasq && command -v dig && command -v ss

### explanation
Each command should print an executable path. If one is absent, stop and use the troubleshooting guidance rather than changing system packages as part of this lab.
### step
2

### name
Create the isolated lab directory

### command
sudo install -d -m 0755 /opt/lab-classroom/class65

### explanation
This creates only the classroom directory permitted for Class 65.
### step
3

### name
Write the dnsmasq configuration

### command
sudo tee /opt/lab-classroom/class65/dnsmasq.conf >/dev/null <<'EOF'
port=1053
listen-address=127.0.0.1
bind-interfaces
no-resolv
domain-needed
bogus-priv
local=/lab.home.arpa/
local-ttl=60
host-record=nas.lab.home.arpa,192.0.2.10
host-record=dashboard.lab.home.arpa,192.0.2.20
host-record=git.lab.home.arpa,192.0.2.30
EOF

### explanation
The server is restricted to loopback and a nonstandard port. no-resolv prevents forwarding to an upstream resolver, while local marks the lesson namespace as locally handled.
### step
4

### name
Validate configuration syntax

### command
dnsmasq --test --conf-file=/opt/lab-classroom/class65/dnsmasq.conf

### explanation
Do not start the service unless dnsmasq reports that the syntax check succeeded.
### step
5

### name
Start the isolated DNS process

### command
nohup dnsmasq --no-daemon --conf-file=/opt/lab-classroom/class65/dnsmasq.conf > /opt/lab-classroom/class65/dnsmasq.log 2>&1 & echo $! | sudo tee /opt/lab-classroom/class65/dnsmasq.pid >/dev/null

### explanation
The process remains attached to its dnsmasq foreground mode while the shell places it in the background. Its output and recorded process identifier remain inside the lab directory.
### step
6

### name
Confirm that the process is alive

### command
pid=$(cat /opt/lab-classroom/class65/dnsmasq.pid) && kill -0 "$pid" && printf 'dnsmasq is running as PID %s\n' "$pid"

### explanation
A successful zero-signal check confirms that a process with the recorded identifier exists. The later query tests whether it is the expected DNS service.
### step
7

### name
Inspect the listener

### command
ss -lunt | grep -E '127\.0\.0\.1:1053[[:space:]]'

### explanation
dnsmasq should expose DNS over both UDP and TCP on loopback port 1053. It should not be shown on a LAN address.
### step
8

### name
Query each friendly name

### command
dig @127.0.0.1 -p 1053 nas.lab.home.arpa A +short; dig @127.0.0.1 -p 1053 dashboard.lab.home.arpa A +short; dig @127.0.0.1 -p 1053 git.lab.home.arpa A +short

### explanation
The three answers should match the records in the configuration.
### step
9

### name
Inspect a complete DNS response

### command
dig @127.0.0.1 -p 1053 nas.lab.home.arpa A

### explanation
Review the status, question, answer, TTL, server address, and query time. The important functional checks are that the response succeeds and the answer contains 192.0.2.10.
### step
10

### name
Test an unknown local name

### command
dig @127.0.0.1 -p 1053 missing.lab.home.arpa A

### explanation
The server should not invent an address for an undefined record. Observe the negative response and contrast it with the successful records.
### step
11

### name
Demonstrate record-type independence

### command
dig @127.0.0.1 -p 1053 nas.lab.home.arpa AAAA +short

### explanation
No IPv6 value should be returned because the lab defines only an A record. A working A record does not imply the existence of an AAAA record.

## Expected results

- The dnsmasq configuration syntax check completes successfully.
- The recorded dnsmasq process remains running after startup.
- A listener is visible on 127.0.0.1:1053 for DNS traffic and is not intentionally exposed on a LAN interface.
- The A query for nas.lab.home.arpa returns 192.0.2.10.
- The A query for dashboard.lab.home.arpa returns 192.0.2.20.
- The A query for git.lab.home.arpa returns 192.0.2.30.
- The query for missing.lab.home.arpa does not return a fabricated A address.
- The AAAA query for nas.lab.home.arpa produces no IPv6 address because no AAAA record was configured.
- The host's normal resolver configuration remains unchanged.

## Verification

- [ ] Run `dnsmasq --test --conf-file=/opt/lab-classroom/class65/dnsmasq.conf`; the command must report a successful syntax check.
- [ ] Run `pid=$(cat /opt/lab-classroom/class65/dnsmasq.pid) && kill -0 "$pid"`; a zero exit status confirms that the recorded process exists.
- [ ] Run `ss -lunt | grep -E '127\.0\.0\.1:1053[[:space:]]'`; output should show the loopback listener.
- [ ] Run `test "$(dig @127.0.0.1 -p 1053 nas.lab.home.arpa A +short)" = "192.0.2.10"`; a zero exit status verifies the NAS record.
- [ ] Run `test "$(dig @127.0.0.1 -p 1053 dashboard.lab.home.arpa A +short)" = "192.0.2.20"`; a zero exit status verifies the dashboard record.
- [ ] Run `test "$(dig @127.0.0.1 -p 1053 git.lab.home.arpa A +short)" = "192.0.2.30"`; a zero exit status verifies the Git record.
- [ ] Run `test -z "$(dig @127.0.0.1 -p 1053 nas.lab.home.arpa AAAA +short)"`; a zero exit status confirms that the lesson did not define an IPv6 address.
- [ ] Run `dig @127.0.0.1 -p 1053 missing.lab.home.arpa A +short`; no A address should be printed.
- [ ] Run `cat /opt/lab-classroom/class65/dnsmasq.log`; there should be no startup error preventing dnsmasq from listening.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The shell reports that dnsmasq or dig is not found. | The required software is not installed or is not present in the current PATH. | Stop the lab and install the appropriate package using the normal administration procedure for the host. Package installation is intentionally outside this filesystem-constrained lab. |
| The configuration test reports an unknown option or syntax error. | The file contains a typo, an unsupported option, or characters introduced while copying. | Inspect /opt/lab-classroom/class65/dnsmasq.conf, compare every line with the lab configuration, correct only that file, and repeat the syntax test. |
| dnsmasq exits immediately after startup. | Port 1053 is already in use, the loopback address could not be bound, or the configuration failed after launch. | Read /opt/lab-classroom/class65/dnsmasq.log and run `ss -lunt | grep ':1053'`. Stop or reconfigure the conflicting lab process only after identifying its owner; do not terminate an unidentified service. |
| dig times out when querying 127.0.0.1 on port 1053. | dnsmasq is not running, is listening on a different address or port, or failed after the PID file was written. | Check the recorded PID with `kill -0`, inspect the log, inspect listeners with ss, and restart the lab process only after resolving the reported error. |
| dig without @127.0.0.1 and -p 1053 does not resolve the lab names. | The operating system's normal resolver has not been pointed at the isolated lab server. | This is expected. Use the explicit dig server and port arguments. The lesson intentionally does not modify the host resolver. |
| The A record resolves, but a browser or ping cannot reach the returned address. | The records use documentation-only addresses and no application is expected to be running there. | Treat the DNS answer as the lab result. In a production design, replace the values with real reachable service addresses and separately verify routing, service ports, and application health. |
| The AAAA query returns no address. | Only IPv4 A records are defined. | This is expected. Add an AAAA record only when the named service has a stable and reachable IPv6 address. |
| A short query such as `dig nas` does not return the configured address. | dig is not automatically using lab.home.arpa as a search domain, and the lab server has no bare `nas` record. | Query the FQDN nas.lab.home.arpa. Search-domain distribution is a separate client configuration concern and is outside this isolated lab. |
| The returned answer appears stale after editing the configuration. | The running dnsmasq process has not reloaded the edited file, or an answer is being read from another resolver. | Confirm the query explicitly targets 127.0.0.1:1053, stop the recorded lab process safely, rerun the syntax test, and start it again. |

## Security

### principles
Listen only on addresses that require DNS service. This lab uses loopback so no other LAN client can query it.
Do not operate an unintended open resolver. A resolver exposed to untrusted networks can leak information or participate in abuse.
Treat DNS as naming data, not as proof of service identity. TLS certificate validation and application authentication remain necessary.
Restrict who may modify local DNS records because changing a trusted name can redirect users to a malicious endpoint.
Use reserved private naming space appropriately. home.arpa avoids collisions with public DNS and avoids misuse of the multicast-oriented .local suffix.
Plan both UDP and TCP DNS behavior. Normal DNS clients can require TCP for responses or protocol fallback.
Avoid returning private internal records to unintended clients. Split-horizon deployments require explicit views, access control, and testing.
Use least privilege in production. Binding the standard DNS port may require elevated startup privileges, but the long-running service should use the platform's supported privilege-reduction features.
Protect DNS administration and configuration backups because they reveal host names, service roles, and addressing structure.

### lab_boundaries
The lab binds only to 127.0.0.1:1053, performs no upstream recursion, uses documentation-only addresses, and does not alter the host resolver or LAN DNS distribution.

### production_considerations
A production resolver should have controlled configuration ownership, reliable service supervision, logging appropriate to the environment, restricted listening interfaces, tested UDP and TCP access, defined redundancy, backup procedures, and a deliberate plan for DHCP or client resolver distribution.

## Rollback

### goal
Stop only the process recorded by this lab, verify that the listener is gone, and delete only content beneath /opt/lab-classroom/class65/.

### steps
### step
1

### command
pid=$(cat /opt/lab-classroom/class65/dnsmasq.pid) && args=$(ps -p "$pid" -o args=) && printf '%s\n' "$args" | grep -F '/opt/lab-classroom/class65/dnsmasq.conf'

### explanation
Verify that the recorded process command line references this lesson's configuration before terminating it.
### step
2

### command
pid=$(cat /opt/lab-classroom/class65/dnsmasq.pid) && kill "$pid"

### explanation
Send the normal termination signal only after confirming the process identity.
### step
3

### command
for attempt in 1 2 3 4 5; do ss -lunt | grep -qE '127\.0\.0\.1:1053[[:space:]]' || break; sleep 1; done; ! ss -lunt | grep -qE '127\.0\.0\.1:1053[[:space:]]'

### explanation
Wait briefly and confirm that the lab listener has disappeared.
### step
4

### command
sudo find /opt/lab-classroom/class65/ -mindepth 1 -depth -delete

### explanation
Delete only entries beneath the dedicated Class 65 directory. The directory itself remains available for classroom reuse.
### step
5

### command
test -d /opt/lab-classroom/class65/ && test -z "$(find /opt/lab-classroom/class65/ -mindepth 1 -print -quit)"

### explanation
A zero exit status confirms that the class directory exists and contains no remaining lab files.

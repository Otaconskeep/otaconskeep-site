# Class 65: Local DNS and Friendly Service Names

**Learning objective:** Explain the roles of DNS clients, recursive resolvers, authoritative data, caching, and search domains; Select home.arpa as an appropriate namespace for private residential DNS names; Create friendly A records for local services in an isolated dnsmasq configuration; Query a specific DNS server and port with dig without changing the operating system resolver; Distinguish DNS resolution success from application reachability; Recognize common failures involving ports, record types, caches, search suffixes, and split-horizon DNS; Stop the lab DNS process and remove only the files created in the permitted classroom directory
**Bloom level:** Understand / Apply
**Track:** Networking · **Difficulty:** intermediate · **Duration:** ~75 minutes · **Lab risk:** low
**Build output:** Teach learners how local DNS converts memorable service names into IP addresses, why a dedicated home-network namespace is preferable to improvised names, and how to test a self-contained DNS service without changing the host's system resolver configuration.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### platforms
Linux distributions providing dnsmasq, dig, ss, nohup, ps, grep, find, and a POSIX-compatible shell

### dnsmasq_behavior
The lesson requires dnsmasq options for a custom port, loopback binding, local zones, disabled upstream resolution, and host-record entries.

### privileges
Creating /opt/lab-classroom/class65/ may require elevated privileges. Port 1053 is non-privileged, so the dnsmasq process itself normally does not require elevated startup solely for port binding.

### networking
IPv4 loopback must be available. The configured 192.0.2.0/24 answers are documentation values and are not expected to be reachable.

### containers_and_virtual_machines
The lab can run inside a container or virtual machine if loopback networking is available and no other process occupies port 1053.

### system_resolver
No dependency exists on a particular host resolver implementation because dig targets the lab server directly.

## Learning objective

- Explain the roles of DNS clients, recursive resolvers, authoritative data, caching, and search domains
- Select home.arpa as an appropriate namespace for private residential DNS names
- Create friendly A records for local services in an isolated dnsmasq configuration
- Query a specific DNS server and port with dig without changing the operating system resolver
- Distinguish DNS resolution success from application reachability
- Recognize common failures involving ports, record types, caches, search suffixes, and split-horizon DNS
- Stop the lab DNS process and remove only the files created in the permitted classroom directory

## Why this matters

Teach learners how local DNS converts memorable service names into IP addresses, why a dedicated home-network namespace is preferable to improvised names, and how to test a self-contained DNS service without changing the host's system resolver configuration.

## Prerequisites

- Basic understanding of IPv4 addresses, ports, and client-server communication
- Ability to use a Linux shell and inspect running processes
- dnsmasq installed on the lab host
- The dig utility installed, commonly provided by a dnsutils or bind-utils package
- Permission to create files under /opt/lab-classroom/class65/ and bind a process to 127.0.0.1:1053
- Completion of introductory LAN addressing and DHCP lessons is recommended

## Required reading

- RFC 1034, Domain Names—Concepts and Facilities: https://www.rfc-editor.org/rfc/rfc1034
- RFC 1035, Domain Names—Implementation and Specification: https://www.rfc-editor.org/rfc/rfc1035
- RFC 8375, Special-Use Domain home.arpa: https://www.rfc-editor.org/rfc/rfc8375
- dnsmasq manual page, especially --host-record, --local, --no-resolv, --listen-address, and --port

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| DNS | The Domain Name System, a distributed naming system that maps names to data such as IP addresses. |
| stub resolver | The client-side resolver library that sends DNS questions to a configured DNS server on behalf of applications. |
| recursive resolver | A DNS server that obtains answers on behalf of clients, often caching the results for later requests. |
| authoritative data | DNS information supplied by the source responsible for a namespace rather than learned from another resolver. |
| A record | A DNS record that maps a name to an IPv4 address. |
| AAAA record | A DNS record that maps a name to an IPv6 address. |
| CNAME record | A DNS record that makes one DNS name an alias of another DNS name. |
| PTR record | A reverse-DNS record that maps an address-oriented name back to a host name. |
| FQDN | A fully qualified domain name that identifies a name within the complete DNS hierarchy, such as nas.lab.home.arpa. |
| TTL | Time to live, the number of seconds for which a DNS answer may normally be cached. |
| search domain | A suffix that a client resolver may append to an unqualified name, allowing a short input such as nas to be attempted as nas.lab.home.arpa. |
| split-horizon DNS | A design in which the answer for a name depends on which resolver or network view receives the query. |
| home.arpa | The special-use DNS domain reserved by RFC 8375 for naming within residential home networks. |

## Instruction

Humans prefer names such as nas.lab.home.arpa, while network connections ultimately use addresses. DNS provides the controlled mapping between those forms. A client application normally asks the operating system's stub resolver for an address. The stub resolver sends a query to a configured DNS server, which can answer from local data, answer from cache, or obtain an answer from elsewhere. An A record returns an IPv4 address, an AAAA record returns an IPv6 address, and a PTR record supports reverse lookup. These are independent records: creating an A record does not automatically prove that a service is running, create a reverse record, or make the destination reachable.

For a home environment, stable service names reduce dependence on memorized addresses and make later address changes less disruptive. A bookmark can target grafana.lab.home.arpa while DNS controls which address currently hosts Grafana. Names should describe stable roles rather than temporary implementation details when practical. The home.arpa namespace is specifically reserved for residential private use. Avoid treating .local as a general unicast DNS suffix because .local is conventionally associated with multicast DNS and can produce confusing differences between clients. Inventing a suffix that resembles a public top-level domain can also create collisions or information leakage.

DNS does not include a port number in an A record. DNS can map dashboard.lab.home.arpa to an address, but the user may still need a URL such as https://dashboard.lab.home.arpa:8443 unless a reverse proxy or a service-specific discovery mechanism handles the port. DNS also does not replace certificate validation. An HTTPS certificate must contain the name the client uses.

This lab runs dnsmasq only on the loopback address and the nonstandard UDP/TCP port 1053. It deliberately does not edit the machine's resolver settings or expose DNS to the LAN. The configuration supplies three local A records using documentation-only IPv4 addresses. Those addresses are suitable for a naming exercise but are not expected to host reachable applications. Querying the server explicitly with dig proves that the DNS data works. A production deployment would use actual stable addresses, listen only on intended interfaces, provide both UDP and TCP service on the standard DNS port, and distribute the resolver address through a controlled client or DHCP configuration. Production changes are intentionally outside this lab because all lab filesystem mutations must remain under /opt/lab-classroom/class65/.

## Architecture

### components
### name
dig client

### role
Sends an explicit DNS query to 127.0.0.1 on port 1053 and displays the response.
### name
isolated dnsmasq process

### role
Listens only on loopback, returns configured local records, and does not consult upstream resolvers.
### name
lab configuration

### role
Stores the local namespace and host records in /opt/lab-classroom/class65/dnsmasq.conf.
### name
lab.home.arpa namespace

### role
Provides a clearly scoped naming area beneath the home.arpa special-use domain.

### query_flow
The learner runs dig with an explicit server address and port.
dig sends a DNS question for an A record to 127.0.0.1:1053.
dnsmasq matches the question against a host-record entry.
dnsmasq returns the configured IPv4 address.
dig displays the answer without changing the host's normal DNS path.

### records
### nas.lab.home.arpa
192.0.2.10

### dashboard.lab.home.arpa
192.0.2.20

### git.lab.home.arpa
192.0.2.30

### scope_note
192.0.2.0/24 is reserved for documentation. The records demonstrate DNS behavior and do not imply that an application exists at any returned address.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

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

## Feynman teach-back

### prompt
Explain local DNS to a family member who knows that websites have names but does not know how name resolution works.

### model_explanation
DNS is like a local contacts list for computers. Instead of remembering that the storage server uses a particular numerical address, you ask for nas.lab.home.arpa. Your computer asks a DNS server for the address stored under that name. The DNS answer only tells the computer where to try connecting; it does not guarantee that the storage service is running, that the route works, or that the service is trustworthy. In this lab, we created a tiny contacts list that can be queried only from the same machine.

### check_yourself
Can you explain why an A record does not contain an application port?
Can you explain why successful DNS resolution does not prove that a web service is healthy?
Can you explain why home.arpa is preferable to inventing a public-looking suffix?
Can you describe the difference between a full name and a short name that depends on a search domain?

## Retrieval check

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

## Verification checkpoints

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

## Security considerations

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

## Video narration notes

In this lesson, we replace memorized homelab addresses with friendly service names. We begin with the DNS path: an application asks the operating system resolver, the resolver contacts a DNS server, and the server returns records such as A or AAAA. We then discuss namespace choice. The home.arpa domain is reserved for home networks, while .local is commonly associated with multicast DNS and should not be casually reused for ordinary DNS.

Our practical environment is intentionally isolated. We create a dnsmasq configuration only beneath /opt/lab-classroom/class65/. The service listens on 127.0.0.1 and port 1053, so it neither replaces the host resolver nor exposes a DNS service to the LAN. Three records map friendly names to documentation-only IPv4 addresses. Before launch, we ask dnsmasq to test the configuration. We then start it, record its process identifier, inspect the loopback listener, and query it explicitly with dig.

Pay attention to the boundary between name resolution and reachability. When nas.lab.home.arpa returns 192.0.2.10, DNS has performed its job. That result does not mean a NAS is running, that a route exists, or that an HTTPS certificate is valid. We also query an undefined name and request an AAAA record that was never configured. Those tests show that a DNS server should not invent records and that record types are independent.

Finally, we review production design. Real clients need a deliberate method for learning the resolver address and optional search domain. The DNS service should listen only where required, accept queries only from intended clients, support normal DNS transport behavior, and be supervised and backed up. During rollback, we verify that the recorded process is truly the lesson process before stopping it, confirm the listener is gone, and remove only files beneath the dedicated Class 65 directory.

## References

- RFC 1034, Domain Names—Concepts and Facilities: https://www.rfc-editor.org/rfc/rfc1034
- RFC 1035, Domain Names—Implementation and Specification: https://www.rfc-editor.org/rfc/rfc1035
- RFC 6762, Multicast DNS: https://www.rfc-editor.org/rfc/rfc6762
- RFC 8375, Special-Use Domain home.arpa: https://www.rfc-editor.org/rfc/rfc8375
- RFC 5737, IPv4 Address Blocks Reserved for Documentation: https://www.rfc-editor.org/rfc/rfc5737
- dnsmasq project documentation: https://thekelleys.org.uk/dnsmasq/doc.html
- BIND 9 dig manual: https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility

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

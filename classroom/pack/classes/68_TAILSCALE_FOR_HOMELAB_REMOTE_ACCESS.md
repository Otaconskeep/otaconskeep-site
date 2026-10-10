# Class 68: Tailscale for Homelab Remote Access

**Learning objective:** Explain the roles of the Tailscale coordination service, node identity, WireGuard tunnels, and DERP relays; Distinguish direct peer-to-peer connections from relayed connections; Describe the difference between node access, subnet routing, exit-node routing, and Tailscale SSH; Design tag-based and group-based access around least privilege; Inspect local Tailscale status without changing network configuration; Identify operational and security concerns involving device approval, key expiry, route approval, DNS, and account recovery; Produce and validate a remote-access design artifact for a homelab
**Bloom level:** Understand / Apply
**Track:** Homelab Networking and Secure Remote Access · **Difficulty:** intermediate · **Duration:** ~90 minutes · **Lab risk:** low
**Build output:** Teach learners how Tailscale creates an identity-aware private network for remote homelab access, how direct and relayed connections differ, how routes and exit nodes affect traffic, and how to design least-privilege access without exposing management services directly to the public internet. The lab performs a read-only inspection of an existing Tailscale installation when available and stores all generated artifacts under /opt/lab-classroom/class68/.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### operating_systems
Linux systems capable of running Python 3
The read-only status exercise is applicable when a Tailscale CLI supporting status --json is already installed

### tailscale
Policy terminology and CLI output can evolve. Review current Tailscale documentation before translating the design artifact into a production policy.

### privileges
Creating /opt/lab-classroom/class68/ requires permission to write beneath /opt/lab-classroom. No elevated network or service changes are required.

### network_effects
None. The lab does not enroll a node, bring an interface up, advertise or approve routes, select an exit node, or alter DNS.

### data_handling
status.json is optional and may contain sensitive tailnet inventory. It is created with restrictive permissions and should remain local.

## Learning objective

- Explain the roles of the Tailscale coordination service, node identity, WireGuard tunnels, and DERP relays
- Distinguish direct peer-to-peer connections from relayed connections
- Describe the difference between node access, subnet routing, exit-node routing, and Tailscale SSH
- Design tag-based and group-based access around least privilege
- Inspect local Tailscale status without changing network configuration
- Identify operational and security concerns involving device approval, key expiry, route approval, DNS, and account recovery
- Produce and validate a remote-access design artifact for a homelab

## Why this matters

Teach learners how Tailscale creates an identity-aware private network for remote homelab access, how direct and relayed connections differ, how routes and exit nodes affect traffic, and how to design least-privilege access without exposing management services directly to the public internet. The lab performs a read-only inspection of an existing Tailscale installation when available and stores all generated artifacts under /opt/lab-classroom/class68/.

## Prerequisites

- Basic Linux command-line navigation
- Understanding of IP addresses, subnets, routing, and ports
- A conceptual understanding of public and private networks
- Permission to inspect the local host's Tailscale status if Tailscale is installed
- Python 3 for the local policy-design validation exercise
- No Tailscale account or active tailnet is required for the safe lab

## Required reading

- Tailscale documentation: How Tailscale works — https://tailscale.com/kb/1151/what-is-tailscale
- Tailscale documentation: Connection types — https://tailscale.com/kb/1257/connection-types
- Tailscale documentation: Access control — https://tailscale.com/kb/1018/acls
- Tailscale documentation: Subnet routers — https://tailscale.com/kb/1019/subnets
- Tailscale documentation: Device approval — https://tailscale.com/kb/1099/device-approval

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| Tailnet | The private Tailscale network associated with an organization or identity domain. |
| Coordination service | The service that authenticates nodes and distributes the information required for authorized peers to discover and establish encrypted connections. It is not normally in the data path. |
| WireGuard | The encrypted tunneling protocol used for Tailscale data traffic between nodes. |
| DERP | A Tailscale relay system used when two peers cannot establish a direct path. Relayed traffic remains end-to-end encrypted. |
| Direct connection | A peer-to-peer data path established between two Tailscale nodes without carrying application traffic through a DERP relay. |
| Subnet router | A Tailscale node that advertises reachability to one or more non-Tailscale IP subnets. |
| Exit node | A Tailscale node selected to carry a client's general internet-bound traffic, similar to a full-tunnel VPN gateway. |
| MagicDNS | Tailscale-provided naming that allows devices to be addressed by tailnet DNS names instead of only Tailscale IP addresses. |
| Tag | A non-human identity label assigned to a device or service role and governed by tag ownership rules. |
| Grant | A tailnet policy rule expressing which sources may reach which destinations and, where supported, what application-level capabilities are allowed. |
| Route approval | An administrative control that determines whether a route advertised by a node is accepted for use by the tailnet. |
| Key expiry | A control that requires a node to reauthenticate after its node key reaches the configured expiration point. |

## Instruction

Traditional remote access often begins by publishing a management port, forwarding traffic through a residential router, or placing a broad remote-access server in front of the entire home network. Each approach can work, but it increases the importance of patching, credential protection, perimeter configuration, and careful routing. Tailscale takes an identity-aware overlay approach. Each enrolled node receives a tailnet identity and encrypted addressing. The coordination service helps authenticated nodes learn public keys, endpoints, policy, and network-map information. Application traffic normally travels directly between peers over WireGuard when network address translation and path conditions permit. If a direct path cannot be established, traffic can traverse a DERP relay while remaining encrypted between the endpoints.

A Tailscale IP does not automatically mean every device may access every service. Authorization is controlled by the tailnet policy, device posture features where available, identity groups, tags, and administrative approval settings. Human-owned clients are commonly represented by user identities, while durable infrastructure should use carefully governed tags. A useful design separates administrators, ordinary users, infrastructure nodes, and temporary devices. For example, an administrator group might reach a hypervisor management interface, while a media-user group may reach only a media service. Avoid creating one broad rule simply because every system belongs to the same homelab.

A subnet router extends access to devices that cannot run Tailscale, such as an appliance or isolated management interface. This convenience also expands the trust boundary: the router becomes a transit point, the advertised prefixes must not overlap unexpectedly with remote networks, and both route approval and policy authorization must be considered. An exit node has a different purpose. It carries general client traffic rather than merely providing access to a selected private subnet. Selecting an exit node can affect latency, DNS behavior, internet geolocation, and the operator's responsibility for traffic leaving that node.

Operational verification should separate three questions. First, is the device authenticated and present in the intended tailnet? Second, does policy authorize the attempted source, destination, and service? Third, can the peers establish a usable path? A failed connection is not always an authentication failure. It may be a policy denial, an unapproved route, a service listening only on a different interface, an overlapping subnet, or a path that has fallen back to a relay. Tailscale status and ping diagnostics can help distinguish these layers, but sensitive inventory information should not be pasted into public tickets. This class deliberately does not enroll a device, advertise routes, select an exit node, or change host networking. Learners instead inspect existing state read-only and create a design that can be reviewed before any production deployment.

## Architecture

### components
Remote client: an administrator-controlled laptop, phone, or tablet enrolled in the tailnet
Coordination service: authenticates identities and distributes peer, key, endpoint, and policy information
Homelab Tailscale node: a server that runs Tailscale and exposes only specifically authorized services
DERP relay: an encrypted fallback data path when a direct peer-to-peer path cannot be established
Optional subnet router: a node that forwards authorized traffic toward selected non-Tailscale networks
Optional exit node: a node that forwards a client's general internet traffic when explicitly selected
Tailnet policy: the authorization layer governing source-to-destination access

### normal_flow
The client and homelab node authenticate independently and receive tailnet network information.
Policy determines whether the source identity may reach the destination and service.
The peers attempt to discover a direct network path.
If direct connectivity succeeds, encrypted application traffic travels peer to peer.
If direct connectivity fails, encrypted traffic can use a DERP relay.
The destination service still applies its own application authentication and authorization.

### trust_boundaries
Identity provider and tailnet administrator accounts
Endpoint operating systems and local credential stores
Tag ownership and tailnet policy administration
Subnet-router forwarding boundary
Exit-node internet egress boundary
The application authentication boundary behind the encrypted network path

### design_principle
Use Tailscale as a private connectivity and authorization layer, not as a replacement for endpoint patching, application authentication, logging, backups, or service-specific authorization.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Draw a proposed tailnet containing one administrator device, one homelab server, one non-Tailscale appliance, and one optional subnet router. Label every trust boundary.
Create a service inventory that lists destination, port, owner, required source role, data sensitivity, and whether direct Tailscale installation is possible.
Write three least-privilege requirements in plain language before attempting policy syntax.
Document how a lost administrator laptop would be removed and how its application credentials would be rotated.
Identify any private subnet overlap likely to occur between the homelab and hotel, workplace, or family networks.
Compare the operational consequences of a direct connection and a DERP-relayed connection without treating relay use as an encryption failure.
Propose a quarterly review checklist for users, devices, tags, routes, enrollment keys, and administrative roles.

## Feynman teach-back

Explain Tailscale to a new homelab operator without using the phrase 'magic VPN.' Start with two devices that each authenticate and obtain an identity. Explain that the coordination service introduces authorized peers but normally does not carry their application traffic. Describe how the peers prefer a direct encrypted WireGuard path and can use an encrypted DERP relay when direct connectivity fails. Then explain why connectivity is not the same as authorization: policy still decides which identity may reach which service, and the destination application should still authenticate its user. Finally, contrast a subnet router, which provides access to selected private prefixes, with an exit node, which carries general internet traffic. If the learner cannot explain those distinctions clearly, revisit the architecture and terminology sections.

## Retrieval check

1. What role does the Tailscale coordination service normally play, and does it normally carry application traffic?
2. Why can a Tailscale connection remain secure when it uses a DERP relay?
3. What is the functional difference between a subnet router and an exit node?
4. Why should infrastructure devices generally use governed tags instead of being permanently associated with an individual employee or family member?
5. A node appears online, but a permitted user cannot reach a service. Name four separate layers or conditions that should be checked.
6. Why is a broad allow-everything rule a poor long-term troubleshooting solution?
7. What sensitive information might be exposed by sharing status.json publicly?
8. Does Tailscale eliminate the need for application authentication, endpoint patching, and backups?

## Guided lab

### name
Read-only Tailscale inspection and least-privilege access design

### scope
All files created or changed by this lab remain under /opt/lab-classroom/class68/. The lab does not authenticate a node, change Tailscale preferences, advertise routes, alter DNS, enable an exit node, or modify host network policy.

### steps
### step
1

### instruction
Create the isolated lab workspace with restrictive permissions.

### commands
install -d -m 700 /opt/lab-classroom/class68
umask 077
printf '%s\n' 'Class 68 Tailscale inspection workspace' > /opt/lab-classroom/class68/README.txt
### step
2

### instruction
Record whether the Tailscale client is available. This only writes the result into the class workspace.

### commands
if command -v tailscale >/dev/null 2>&1; then printf '%s\n' 'tailscale-cli=available' > /opt/lab-classroom/class68/environment.txt; else printf '%s\n' 'tailscale-cli=not-found' > /opt/lab-classroom/class68/environment.txt; fi
if command -v tailscale >/dev/null 2>&1; then tailscale version > /opt/lab-classroom/class68/version.txt 2>&1 || true; else printf '%s\n' 'Version unavailable because the CLI was not found.' > /opt/lab-classroom/class68/version.txt; fi
### step
3

### instruction
If Tailscale is already installed and its local service is available, capture a read-only status snapshot. Do not share this file publicly because it may contain device names, addresses, users, and tailnet details.

### commands
if command -v tailscale >/dev/null 2>&1 && tailscale status --json >/opt/lab-classroom/class68/status.json 2>/opt/lab-classroom/class68/status-error.txt; then chmod 600 /opt/lab-classroom/class68/status.json; printf '%s\n' 'status=captured' >> /opt/lab-classroom/class68/environment.txt; else printf '%s\n' 'status=unavailable; inspect status-error.txt locally' >> /opt/lab-classroom/class68/environment.txt; fi
### step
4

### instruction
Create a proposed architecture inventory. These are design roles, not claims about the current host or tailnet.

### commands
cat > /opt/lab-classroom/class68/design.json <<'EOF'
{
  "roles": {
    "admins": ["admin-laptop"],
    "service_users": ["family-laptop"],
    "infrastructure": ["monitoring-server", "backup-server"],
    "subnet_routers": ["homelab-router-node"]
  },
  "resources": {
    "hypervisor-management": {"ports": [443], "allowed_roles": ["admins"]},
    "media-service": {"ports": [443], "allowed_roles": ["admins", "service_users"]},
    "metrics-endpoint": {"ports": [9100], "allowed_roles": ["infrastructure"]}
  },
  "advertised_routes": ["192.0.2.0/24"],
  "exit_node_required": false,
  "notes": "192.0.2.0/24 is a documentation prefix used only for this design exercise. Replace it only during a separately approved deployment review."
}
EOF
chmod 600 /opt/lab-classroom/class68/design.json
### step
5

### instruction
Validate the design structure and generate a local report. The validator rejects broad all-role access, invalid ports, and non-documentation routes so the exercise cannot accidentally be mistaken for a deployable site configuration.

### commands
PYTHONDONTWRITEBYTECODE=1 python3 - <<'PY'
import ipaddress
import json
from pathlib import Path
base = Path('/opt/lab-classroom/class68')
design = json.loads((base / 'design.json').read_text())
errors = []
roles = design.get('roles', {})
resources = design.get('resources', {})
if not roles:
    errors.append('No roles were defined.')
if not resources:
    errors.append('No resources were defined.')
for name, resource in resources.items():
    allowed = resource.get('allowed_roles', [])
    ports = resource.get('ports', [])
    unknown = sorted(set(allowed) - set(roles))
    if unknown:
        errors.append(f'{name}: unknown roles: {unknown}')
    if not allowed:
        errors.append(f'{name}: no allowed roles')
    if set(allowed) == set(roles):
        errors.append(f'{name}: every role is allowed; review least privilege')
    for port in ports:
        if not isinstance(port, int) or not 1 <= port <= 65535:
            errors.append(f'{name}: invalid port {port!r}')
for route in design.get('advertised_routes', []):
    try:
        network = ipaddress.ip_network(route, strict=True)
        if not network.subnet_of(ipaddress.ip_network('192.0.2.0/24')):
            errors.append(f'{route}: lab accepts only the 192.0.2.0/24 documentation range')
    except ValueError as exc:
        errors.append(f'{route}: invalid network: {exc}')
report = ['Class 68 design validation', f'roles={len(roles)}', f'resources={len(resources)}']
if errors:
    report.append('result=FAIL')
    report.extend('error=' + item for item in errors)
else:
    report.append('result=PASS')
    report.append('review_required=This is a design artifact, not a deployable tailnet policy.')
(base / 'validation-report.txt').write_text('\n'.join(report) + '\n')
print('\n'.join(report))
raise SystemExit(1 if errors else 0)
PY
### step
6

### instruction
Review permissions and generated content without printing status.json, which may contain sensitive inventory.

### commands
find /opt/lab-classroom/class68 -maxdepth 1 -type f -printf '%M %f\n' | sort
cat /opt/lab-classroom/class68/environment.txt
cat /opt/lab-classroom/class68/version.txt
cat /opt/lab-classroom/class68/validation-report.txt

## Expected results

- The directory /opt/lab-classroom/class68/ exists with owner-only directory access.
- environment.txt reports whether the Tailscale CLI and local status were available.
- version.txt contains either the locally installed client version or a clear unavailable message.
- status.json exists only when the existing client and local service returned status successfully.
- design.json contains role-separated access requirements and uses only the 192.0.2.0/24 documentation prefix.
- validation-report.txt contains result=PASS for the unmodified exercise design.
- No node is enrolled, no route is advertised, no exit node is selected, and no host network setting is changed.

## Verification checkpoints

- [ ] Run: test -d /opt/lab-classroom/class68 && echo workspace-present
- [ ] Run: stat -c '%a %n' /opt/lab-classroom/class68 and verify the directory mode is 700.
- [ ] Run: grep '^result=PASS$' /opt/lab-classroom/class68/validation-report.txt
- [ ] Run: grep '^review_required=' /opt/lab-classroom/class68/validation-report.txt
- [ ] Run: python3 -m json.tool /opt/lab-classroom/class68/design.json >/dev/null && echo design-json-valid
- [ ] Run: grep '^tailscale-cli=' /opt/lab-classroom/class68/environment.txt
- [ ] If status.json exists, run: python3 -m json.tool /opt/lab-classroom/class68/status.json >/dev/null && echo status-json-valid
- [ ] Confirm that every command which writes data targets /opt/lab-classroom/class68/.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| install reports permission denied while creating the workspace. | The current account cannot create directories under /opt/lab-classroom. | Ask the lab administrator to create /opt/lab-classroom/class68 with ownership assigned to the learner. Do not redirect the exercise into an unapproved system location. |
| environment.txt says tailscale-cli=not-found. | Tailscale is not installed or is not present in the current PATH. | Continue with the design exercise. Installation and enrollment are intentionally outside this low-risk lab. |
| The CLI exists, but status is unavailable. | The local Tailscale service is stopped, inaccessible to the current account, or not configured. | Read /opt/lab-classroom/class68/status-error.txt locally. Do not change service state or authenticate the node as part of this lab. |
| The validator reports an unknown role. | A resource names an allowed role that is absent from the roles object. | Correct the spelling or add the intended role to design.json, then rerun the validator. |
| The validator rejects an advertised route. | The exercise accepts only the documentation network 192.0.2.0/24 to prevent the design artifact from being mistaken for an approved production route. | Restore advertised_routes to 192.0.2.0/24. Record real homelab prefixes separately for an authorized deployment review. |
| A real remote connection is authenticated but cannot reach a service. | Possible causes include policy denial, an unapproved subnet route, a service bound to an unexpected address, an overlapping network, or service-level authentication failure. | Troubleshoot in layers: confirm tailnet identity, confirm policy authorization, confirm route approval and selection, inspect connection type, and verify that the destination service is listening as intended. Do not broadly authorize all traffic as a diagnostic shortcut. |
| A connection works but is reported as relayed. | Network address translation or local network restrictions prevented a direct peer-to-peer path. | Confirm functionality first. A DERP connection remains encrypted and may be acceptable. Investigate direct-path optimization only under an approved network change process. |

## Security considerations

### controls
Protect the identity-provider account and tailnet administrator roles with strong multifactor authentication.
Keep the number of tailnet owners and policy administrators small.
Use groups for people and governed tags for infrastructure identities.
Grant access to named roles, destinations, and required service ports rather than authorizing the entire tailnet.
Require administrative approval for sensitive devices and advertised routes where appropriate.
Retain key expiry for user-operated endpoints unless a documented service requirement justifies an exception.
Treat reusable or preauthorized enrollment keys as secrets, constrain their capabilities, and revoke unused keys.
Continue to require application authentication even when traffic arrives through Tailscale.
Review subnet routes for overlap with networks learners may encounter while traveling.
Treat status.json as sensitive because it may reveal usernames, device names, addresses, routes, and online state.
Do not publish management services directly merely because Tailscale also protects an alternate path.
Maintain endpoint updates, logging, backups, disk encryption, and account recovery procedures.

### threats
Compromise of an administrator identity
Loss or theft of an enrolled endpoint
Overly broad grants or tag ownership
Unreviewed subnet-route advertisement
Unexpected traffic egress through an exit node
Sensitive inventory disclosure from diagnostic output
A compromised subnet router reaching devices that cannot enforce tailnet identity directly

### review_questions
Who can add devices and who can change policy?
Which devices require approval before joining?
Which services truly need remote access?
Can each rule be narrowed by role, destination, or port?
What is the recovery plan if the identity provider is unavailable or compromised?
How will departed users, lost devices, expired keys, and stale tags be removed?

## Rollback

### scope
The lab makes no Tailscale or network configuration changes. Rollback consists only of deleting generated class artifacts.

### precheck
Run find /opt/lab-classroom/class68 -maxdepth 1 -type f -printf '%f\n' and confirm every listed item belongs to Class 68.

### command
find /opt/lab-classroom/class68 -mindepth 1 -delete

### postcheck
Run find /opt/lab-classroom/class68 -mindepth 1 -print and verify that it produces no output.

### recovery_note
Deletion is not reversible unless the workspace was backed up. Recreate the artifacts by repeating the lab.

## Video narration notes

Begin with the problem: a homelab operator wants remote access without publishing a management service to the entire internet. Introduce the tailnet as a private identity-based network. Show a remote laptop, a homelab server, the coordination service, and an optional DERP relay. Emphasize that the coordination service helps peers authenticate and find each other, while application data normally takes a direct encrypted path. Animate a failed direct-path attempt followed by a DERP path, and state that the relay sees encrypted traffic rather than application plaintext.

Next, separate connectivity from authorization. A device being present in the tailnet does not mean it should reach every server. Show administrators, service users, and infrastructure as different roles. Map each role only to the required services and ports. Explain why durable servers should use governed tags and why tag ownership is security-sensitive.

Then compare three patterns. A normal Tailscale node exposes services running on itself. A subnet router forwards traffic to selected networks containing devices that cannot run Tailscale. An exit node carries general internet traffic for a client. Stress that the last two roles are not interchangeable and that each expands operational responsibility.

Move into the lab. Create the restricted workspace under /opt/lab-classroom/class68/. Detect the client without installing anything. If an existing local service is available, capture status as a sensitive read-only artifact. Build design.json using documentation-only addressing, run the Python validator, and inspect validation-report.txt. Point out that the exercise produces a reviewable design rather than changing live connectivity.

Close with a troubleshooting model: identity, authorization, routing, path establishment, destination service, and application authentication. Remind learners that a relay is not automatically a failure, that status output can disclose inventory, and that secure remote access still depends on endpoint hygiene, least privilege, logging, account recovery, and backups.

## References

- Tailscale documentation: What is Tailscale? — https://tailscale.com/kb/1151/what-is-tailscale
- Tailscale documentation: How Tailscale works — https://tailscale.com/blog/how-tailscale-works
- Tailscale documentation: Connection types — https://tailscale.com/kb/1257/connection-types
- Tailscale documentation: DERP servers — https://tailscale.com/kb/1232/derp-servers
- Tailscale documentation: Access control policies — https://tailscale.com/kb/1018/acls
- Tailscale documentation: Grants syntax — https://tailscale.com/kb/1324/grants
- Tailscale documentation: Subnet routers — https://tailscale.com/kb/1019/subnets
- Tailscale documentation: Exit nodes — https://tailscale.com/kb/1103/exit-nodes
- Tailscale documentation: MagicDNS — https://tailscale.com/kb/1081/magicdns
- Tailscale documentation: Device approval — https://tailscale.com/kb/1099/device-approval
- Tailscale documentation: Auth keys — https://tailscale.com/kb/1085/auth-keys
- WireGuard protocol overview — https://www.wireguard.com/protocol/

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

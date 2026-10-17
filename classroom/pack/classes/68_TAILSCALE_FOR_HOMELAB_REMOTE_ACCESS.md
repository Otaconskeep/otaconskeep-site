# Class 68: Tailscale for Homelab Remote Access

**Learning objective:** Explain how Tailscale separates its coordination control plane from its encrypted data plane; Describe direct peer-to-peer paths and DERP-relayed paths without assuming that a relay can decrypt traffic; Choose between installing Tailscale directly on a service host and advertising a subnet through a subnet router; Explain the security consequences of route advertisement, route approval, exit nodes, device approval, tags, groups, and access policy; Design least-privilege remote access for homelab administrators and ordinary users; Create a staged rollout plan that preserves an existing administrative access path; Validate a homelab Tailscale architecture document and access test matrix without changing host networking; Identify evidence needed to distinguish authentication, authorization, routing, DNS, and service-listener failures
**Bloom level:** Understand / Apply
**Track:** Homelab Networking and Secure Remote Access · **Difficulty:** intermediate · **Duration:** ~90 minutes · **Lab risk:** low
**Build output:** Teach learners how Tailscale can provide identity-aware remote access to homelab services without directly exposing those services to the public internet. The lesson explains the control plane, WireGuard-based data plane, peer-to-peer connectivity, DERP relays, device identity, access policy, subnet routers, exit nodes, MagicDNS, and a staged deployment method. The lab produces and validates a deployment design entirely within /opt/lab-classroom/class68/ and does not enroll the host, change network settings, publish routes, or modify an existing tailnet.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-02-28
**Compatibility:** ### operating_systems
The design concepts apply to current Tailscale clients on Linux, Windows, macOS, mobile platforms, and supported appliances.
The hands-on lab commands require a Linux environment with a POSIX-compatible shell, Python 3, and permission to create /opt/lab-classroom/class68/.

### tailscale_scope
The lab does not depend on a specific Tailscale client release because it does not invoke a client, daemon, API, or live policy parser. Administrative interfaces, policy capabilities, and command output may change over time; verify current official documentation before a live deployment.

### network_scope
The proposed 192.168.50.0/24 prefix is a documentation example within the generated lab plan. Learners must inventory their own routes and check for overlap before any real deployment.

### limitations
This lesson validates design artifacts only. It does not prove real peer connectivity, identity-provider behavior, application reachability, DNS integration, route acceptance, or live access policy.

## Learning objective

- Explain how Tailscale separates its coordination control plane from its encrypted data plane
- Describe direct peer-to-peer paths and DERP-relayed paths without assuming that a relay can decrypt traffic
- Choose between installing Tailscale directly on a service host and advertising a subnet through a subnet router
- Explain the security consequences of route advertisement, route approval, exit nodes, device approval, tags, groups, and access policy
- Design least-privilege remote access for homelab administrators and ordinary users
- Create a staged rollout plan that preserves an existing administrative access path
- Validate a homelab Tailscale architecture document and access test matrix without changing host networking
- Identify evidence needed to distinguish authentication, authorization, routing, DNS, and service-listener failures

## Why this matters

Teach learners how Tailscale can provide identity-aware remote access to homelab services without directly exposing those services to the public internet. The lesson explains the control plane, WireGuard-based data plane, peer-to-peer connectivity, DERP relays, device identity, access policy, subnet routers, exit nodes, MagicDNS, and a staged deployment method. The lab produces and validates a deployment design entirely within /opt/lab-classroom/class68/ and does not enroll the host, change network settings, publish routes, or modify an existing tailnet.

## Prerequisites

- Basic understanding of IPv4 addressing, private subnets, routing, DNS, and network ports
- Basic Linux command-line experience
- Ability to distinguish authentication from authorization
- Familiarity with JSON and simple Python commands
- A conceptual understanding of remote-access VPNs
- Optional access to an existing Tailscale account for comparing the lesson design with a real tailnet; no account is required for the lab

## Required reading

- Tailscale documentation, How Tailscale works: https://tailscale.com/kb/1151/what-is-tailscale
- Tailscale documentation, Connection types: https://tailscale.com/kb/1257/connection-types
- Tailscale documentation, Access control: https://tailscale.com/kb/1018/acls
- Tailscale documentation, Subnet routers: https://tailscale.com/kb/1019/subnets
- Tailscale documentation, MagicDNS: https://tailscale.com/kb/1081/magicdns
- WireGuard protocol overview: https://www.wireguard.com/protocol/

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| Tailnet | The private Tailscale network associated with an organization or account, including its users, devices, identities, policy, and configuration. |
| Control plane | The coordination system that authenticates participants, distributes peer information and policy, and assists with connection establishment. It is distinct from the encrypted path carrying application traffic. |
| Data plane | The encrypted path over which peers exchange application packets. Tailscale uses WireGuard-based tunnels for this traffic. |
| DERP | Tailscale's encrypted packet relay mechanism used when peers cannot establish a usable direct path. A DERP relay forwards already encrypted traffic and is not the endpoint holding the peer session keys. |
| NAT traversal | Techniques used to establish communication between devices located behind address translation or restrictive network boundaries. |
| Subnet router | A Tailscale node that advertises routes to one or more networks so authorized tailnet devices can reach systems that do not run Tailscale themselves. |
| Exit node | A Tailscale node that can carry a client's general internet-bound traffic, similar to a default-route VPN gateway, when explicitly selected and authorized. |
| MagicDNS | Tailscale's DNS feature for resolving tailnet device names and, when configured, integrating additional DNS naming behavior. |
| Device identity | The cryptographic and administrative identity assigned to a device participating in a tailnet. |
| User identity | The authenticated person or account associated with tailnet access and policy decisions. |
| Tag | A non-human identity label used to represent the role of a device or service in access policy. |
| Route approval | The administrative authorization that determines whether a route advertised by a subnet router or exit node becomes available for use. |
| Least privilege | The practice of granting only the destinations, protocols, and access needed for a specific role rather than broad network-wide reachability. |

## Instruction

Traditional remote access often begins with a public port forwarded from an internet router to an internal service. That approach can work, but it makes the service's authentication surface, patch state, protocol implementation, and logging quality part of the public perimeter. Tailscale offers a different model: devices authenticate into a private tailnet, receive cryptographic identities, learn authorized peer information, and exchange application traffic through WireGuard-based encrypted tunnels. This does not eliminate the need to secure applications, accounts, operating systems, or backups. It changes how reachable the service is and adds an identity-aware authorization layer before ordinary application authentication.

The architecture has two important planes. The control plane coordinates identity, keys, peer discovery, routes, names, and policy. The data plane carries packets between devices. When network conditions permit, peers communicate directly. If a direct path cannot be established, traffic can pass through a DERP relay. The relay forwards encrypted packets; it is not equivalent to a conventional gateway that terminates and re-encrypts the session. A relayed connection may have different latency or throughput characteristics, but this lesson makes no benchmark claim because results depend on geography, networks, devices, and path conditions.

There are two common homelab deployment patterns. In the first, Tailscale runs directly on each server. Each server has its own tailnet identity, can be addressed individually, and can receive narrowly scoped policy. This usually gives clearer attribution and smaller trust boundaries. In the second, a subnet router advertises a LAN prefix so remote clients can reach devices that cannot run Tailscale. That is useful for appliances, hypervisors, printers, management interfaces, or legacy systems, but it enlarges the reachable network behind one routing identity. Advertise only the required prefixes, avoid overlapping routes, approve routes deliberately, and restrict which identities may use them.

An exit node is different from a subnet router. A subnet router provides paths to designated private prefixes. An exit node can provide a default route for a client's broader traffic. Running one does not automatically make every client use it; the route must be offered, authorized, and selected. An exit node creates capacity, privacy, policy, and trust considerations because the node's local network becomes the apparent source for forwarded traffic.

Name resolution should be designed rather than assumed. MagicDNS can make tailnet device names convenient, but a subnet-routed application may still depend on an internal DNS zone. A packet route and a DNS answer are separate dependencies. If an IP address works but a name does not, investigate naming and resolver configuration rather than treating the tunnel as completely broken. Similarly, successful tailnet reachability does not prove that an application is listening on the intended interface or that its own authorization permits the user.

Access policy should describe intended communication, not merely reproduce broad LAN trust. Human users can be organized by role, while infrastructure devices can use tags whose ownership is controlled. A useful policy design names the source identity, destination identity or subnet, application port, business purpose, and expected denial cases. Tests should include negative assertions such as a media user being unable to reach a hypervisor management endpoint. Default-deny reasoning is strongest when each permission has a named owner and test.

Tailscale account access is part of the homelab security boundary. Protect identity-provider accounts with strong multifactor authentication, review administrators, remove stale devices, understand key-expiry behavior, and define a response for a lost laptop or compromised account. Do not confuse encryption with endpoint safety: an authorized but compromised client can still attack destinations that policy allows.

A safe rollout keeps an independent management path until verification is complete. First inventory services and routes. Next enroll one noncritical device, confirm identity and policy, and test both allowed and denied flows. Then add a single administrative destination or a narrowly scoped subnet route. Observe whether connections are direct or relayed, validate DNS separately, and only then expand coverage. Avoid disabling the existing access method during the same change window. Rollback should be designed before enrollment, including route withdrawal, device revocation, policy reversion, and confirmation that local-only services remain available.

The lab deliberately stops before enrollment or network mutation. It creates a machine-readable architecture plan, an access test matrix, and a rollout checklist. This separates design correctness from account-specific execution and ensures every lab-created file remains under /opt/lab-classroom/class68/.

## Architecture

### components
### name
Identity provider and tailnet administration

### role
Authenticate users and administrators, manage devices, review routes, and publish access policy.
### name
Tailscale coordination service

### role
Distribute peer metadata, public keys, policy, naming information, and connection-coordination data.
### name
Remote administrative client

### role
Provide an authenticated endpoint from which an administrator reaches approved homelab services.
### name
Directly enrolled homelab server

### role
Represent a server with its own tailnet identity and narrowly scoped service access.
### name
Subnet router

### role
Advertise selected homelab prefixes for systems that cannot participate directly.
### name
DERP relay

### role
Forward encrypted packets when a direct peer path is unavailable.
### name
Internal DNS service

### role
Resolve private application names when those names are not represented by tailnet device naming alone.

### traffic_flow
The user authenticates and the client obtains tailnet coordination information.
Policy determines whether the source identity is authorized for the requested destination and service.
Peers attempt to establish a direct encrypted path.
If a direct path is unavailable, encrypted packets may be relayed through DERP.
For directly enrolled servers, traffic terminates at that server's Tailscale interface.
For subnet-routed systems, traffic reaches the subnet router and is forwarded toward an approved private prefix.
The destination application still performs its own authentication and authorization.

### trust_boundaries
Identity-provider account and recovery security
Tailnet administrator and policy-author privileges
Each enrolled endpoint and its local users
The subnet router and every network reachable behind its approved routes
The destination application's credentials and authorization model
DNS configuration used to map names to destinations

### recommended_pattern
Install Tailscale directly on capable administrative servers where practical. Use a dedicated subnet router only for devices that cannot run a client, advertise the smallest useful prefixes, and grant route use only to roles that need it. Keep general user services separate from management interfaces in policy.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Create a service inventory for your homelab with columns for owner, hostname, network, protocol, sensitivity, direct-client eligibility, and required user roles.
Draw two designs for the same environment: one using direct enrollment on every capable server and one using a subnet router. Compare identity granularity, operational effort, and blast radius.
Write at least eight access test statements, including three expected denials and one DNS-specific test.
Document how you would revoke a lost administrative laptop while preserving emergency access.
Identify every private prefix in your environment and note possible overlap with networks commonly encountered while traveling.
Explain whether your use case requires an exit node. If it does, document who may use it and what trust is placed in the exit node's network.
Review the official access-control syntax separately before proposing any live policy, and have another person review the proposal before application.

## Feynman teach-back

### prompt
Explain Tailscale remote access to a technically curious family member without using the phrase 'it is just a VPN.' Include identity, direct paths, relays, subnet routers, and least privilege.

### model_explanation
Each approved device receives a private cryptographic identity. A coordination service introduces devices and tells them what communication is permitted, but the devices encrypt application traffic for each other. They try to communicate directly; when the networks do not permit that, an encrypted packet relay can pass the traffic without becoming the application endpoint. A server can join directly and have its own identity, or a subnet router can provide a controlled path to older devices that cannot join. Access rules should let each person reach only the systems and services needed for their role. The application still needs its own accounts, updates, and logs because a private encrypted path does not make the application automatically safe.

## Retrieval check

1. 1. What is the difference between the Tailscale control plane and data plane?
2. 2. Does a DERP-relayed connection mean the relay can decrypt the peer session traffic?
3. 3. When is direct installation on a server generally preferable to placing that server behind a subnet router?
4. 4. How does a subnet router differ from an exit node?
5. 5. Why should an access test plan contain expected denial cases?
6. 6. If a service works by IP address but not by hostname, which dependency should be investigated first?
7. 7. Why should an independent management path remain available during rollout?
8. 8. Does Tailscale remove the need for application authentication and endpoint patching?

## Guided lab

### name
Design and validate a least-privilege Tailscale rollout

### objective
Create a local architecture manifest, access test matrix, and rollout checklist without enrolling the host or changing networking.

### scope_guard
Every file created or modified by this lab is under /opt/lab-classroom/class68/. The lab does not authenticate to Tailscale, create a tailnet, alter routes, alter DNS, start a daemon, or change a remote policy.

### steps
### step
1

### title
Create the isolated workspace

### command
sudo install -d -o "$USER" -g "$(id -gn)" /opt/lab-classroom/class68

### explanation
This creates only the class workspace and assigns it to the current learner.
### step
2

### title
Generate the architecture and test documents

### command
cd /opt/lab-classroom/class68 && python3 - <<'PY'
import json
from pathlib import Path
root = Path('/opt/lab-classroom/class68')
architecture = {
  'design_name': 'homelab-remote-access',
  'administrative_clients': ['admin-laptop'],
  'direct_nodes': [
    {'name': 'backup-server', 'role': 'backup administration', 'services': ['tcp/443']},
    {'name': 'monitoring-server', 'role': 'monitoring dashboard', 'services': ['tcp/443']}
  ],
  'subnet_router': {
    'name': 'lan-router-node',
    'proposed_routes': ['192.168.50.0/24'],
    'purpose': 'Reach appliances that cannot run Tailscale',
    'requires_explicit_route_approval': True
  },
  'exit_node_required': False,
  'dns': {
    'magicdns_for_tailnet_nodes': True,
    'internal_zone_dependency': 'home.arpa',
    'validate_name_and_address_separately': True
  },
  'safety': {
    'retain_existing_management_path': True,
    'start_with_one_noncritical_node': True,
    'test_expected_denials': True
  }
}
tests = [
  {'id': 'T01', 'source': 'admin-laptop', 'destination': 'backup-server:443', 'expected': 'allow', 'reason': 'Approved backup administration'},
  {'id': 'T02', 'source': 'admin-laptop', 'destination': 'monitoring-server:443', 'expected': 'allow', 'reason': 'Approved monitoring administration'},
  {'id': 'T03', 'source': 'media-user', 'destination': 'backup-server:443', 'expected': 'deny', 'reason': 'No backup administration role'},
  {'id': 'T04', 'source': 'admin-laptop', 'destination': '192.168.50.10:443', 'expected': 'allow', 'reason': 'Approved appliance management through subnet route'},
  {'id': 'T05', 'source': 'media-user', 'destination': '192.168.50.10:443', 'expected': 'deny', 'reason': 'Management subnet is not available to media users'},
  {'id': 'T06', 'source': 'admin-laptop', 'destination': 'internet-default-route', 'expected': 'deny', 'reason': 'The design does not require an exit node'}
]
rollout = {
  'ordered_checks': [
    'Record the current independent management path',
    'Enroll one noncritical device through an approved administrative process',
    'Confirm device owner, device identity, and expiry settings',
    'Apply the smallest intended access rule',
    'Test every expected allow result',
    'Test every expected deny result',
    'Validate IP reachability separately from DNS resolution',
    'Determine whether the peer path is direct or relayed',
    'Approve only the intended subnet route',
    'Review logs and remove obsolete identities'
  ],
  'rollback_triggers': [
    'Unexpected management loss',
    'An unauthorized identity reaches a protected destination',
    'A broader route is advertised or approved than intended',
    'DNS changes disrupt local clients'
  ]
}
(root / 'architecture.json').write_text(json.dumps(architecture, indent=2) + '\n')
(root / 'access-tests.json').write_text(json.dumps(tests, indent=2) + '\n')
(root / 'rollout.json').write_text(json.dumps(rollout, indent=2) + '\n')
PY

### explanation
The generated files describe a proposed deployment. They are not a live Tailscale configuration and are not submitted to a control plane.
### step
3

### title
Validate document structure and safety assumptions

### command
cd /opt/lab-classroom/class68 && python3 - <<'PY'
import json
from pathlib import Path
root = Path('/opt/lab-classroom/class68')
a = json.loads((root / 'architecture.json').read_text())
t = json.loads((root / 'access-tests.json').read_text())
r = json.loads((root / 'rollout.json').read_text())
assert a['safety']['retain_existing_management_path'] is True
assert a['subnet_router']['requires_explicit_route_approval'] is True
assert a['exit_node_required'] is False
assert a['subnet_router']['proposed_routes'] == ['192.168.50.0/24']
assert any(x['expected'] == 'allow' for x in t)
assert any(x['expected'] == 'deny' for x in t)
assert len({x['id'] for x in t}) == len(t)
assert len(r['rollback_triggers']) >= 3
print('PASS: architecture, access tests, and rollback criteria are internally consistent')
PY

### explanation
Assertions check key safety decisions and ensure the plan includes positive and negative authorization tests.
### step
4

### title
Produce a human-readable review report

### command
cd /opt/lab-classroom/class68 && python3 - <<'PY'
import json
from pathlib import Path
root = Path('/opt/lab-classroom/class68')
a = json.loads((root / 'architecture.json').read_text())
t = json.loads((root / 'access-tests.json').read_text())
lines = [
  'Class 68 Tailscale Design Review',
  '================================',
  f"Proposed subnet routes: {', '.join(a['subnet_router']['proposed_routes'])}",
  f"Exit node required: {a['exit_node_required']}",
  f"Retain independent management: {a['safety']['retain_existing_management_path']}",
  '',
  'Access test matrix:'
]
for item in t:
    lines.append(f"{item['id']} {item['expected'].upper():5} {item['source']} -> {item['destination']} | {item['reason']}")
(root / 'review.txt').write_text('\n'.join(lines) + '\n')
print((root / 'review.txt').read_text())
PY

### explanation
The report gives reviewers a concise list of proposed routes, safety assumptions, and access expectations.

### success_condition
The validator prints a PASS result, review.txt lists six access tests, both allow and deny outcomes are represented, only 192.168.50.0/24 is proposed for subnet routing, and no live system or tailnet setting has changed.

## Expected results

- The directory /opt/lab-classroom/class68/ exists and contains architecture.json, access-tests.json, rollout.json, and review.txt.
- The validation command prints: PASS: architecture, access tests, and rollback criteria are internally consistent
- architecture.json proposes exactly one subnet route, 192.168.50.0/24.
- architecture.json records that no exit node is required for the stated design.
- access-tests.json contains six uniquely identified tests with both allowed and denied outcomes.
- rollout.json preserves an independent management path and defines rollback triggers.
- No device is enrolled, no route is advertised or approved, no DNS setting is changed, and no remote access policy is applied.

## Verification checkpoints

- [ ] Run: find /opt/lab-classroom/class68 -maxdepth 1 -type f -printf '%f\n' | sort ; verify that the output lists access-tests.json, architecture.json, review.txt, and rollout.json.
- [ ] Run: python3 -m json.tool /opt/lab-classroom/class68/architecture.json >/dev/null && echo architecture-valid ; verify that architecture-valid is printed.
- [ ] Run: python3 -m json.tool /opt/lab-classroom/class68/access-tests.json >/dev/null && echo tests-valid ; verify that tests-valid is printed.
- [ ] Run: python3 -m json.tool /opt/lab-classroom/class68/rollout.json >/dev/null && echo rollout-valid ; verify that rollout-valid is printed.
- [ ] Run: grep -E 'ALLOW|DENY' /opt/lab-classroom/class68/review.txt ; verify that both ALLOW and DENY appear.
- [ ] Run: grep '192.168.50.0/24' /opt/lab-classroom/class68/review.txt ; verify that the proposed subnet appears once in the summary.
- [ ] Review the host and tailnet manually and confirm that the lab did not enroll a device, advertise a route, approve a route, select an exit node, or change DNS.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The workspace creation command reports permission denied. | The learner cannot create directories beneath /opt or does not have the permitted privilege for the training host. | Ask the lab administrator to pre-create /opt/lab-classroom/class68/ with ownership assigned to the learner. Do not redirect the exercise into unrelated system directories. |
| python3 is not found. | Python 3 is not installed or is not available through the current command search path. | Use a classroom image that provides Python 3, or have the administrator provision it before the lab. Do not install additional software as part of this constrained exercise. |
| A JSON validation command reports invalid syntax. | A generated file was manually edited and now contains a missing comma, quote, bracket, or brace. | Inspect the line and column reported by python3 -m json.tool. Correct only the affected file under /opt/lab-classroom/class68/, or rerun the generation step to restore all three JSON files. |
| The assertion validator reports that an expected deny result is missing. | The access test matrix was changed to contain only successful paths. | Restore tests for unauthorized identities and unintended default-route access. A least-privilege design must verify both permissions and denials. |
| A future live deployment can reach a Tailscale address but not the service. | The encrypted network path exists, but the application is not listening on the destination address or port, its local policy rejects the client, or tailnet access policy does not allow the service. | Check authorization, destination address, service listener, and application logs independently. Do not assume that device reachability proves application availability. |
| A future live deployment works by address but not by hostname. | Routing works but the client lacks the required tailnet or internal DNS resolution path. | Verify the exact DNS name, resolver selection, MagicDNS state, and any internal zone dependency. Test name resolution separately from packet reachability. |
| A future connection is relayed instead of direct. | The peers could not establish a usable direct path because of NAT behavior, filtering, or current network conditions. | Confirm that the connection is functional and encrypted, then review Tailscale connection diagnostics and network conditions. Do not weaken broad network protections merely to force a direct path. |
| A future subnet route is advertised but clients cannot use it. | The route is awaiting approval, the source identity lacks policy permission, the client has not accepted the route, or the subnet router cannot reach the destination. | Check route advertisement, administrative approval, source authorization, client route acceptance, and router-to-destination reachability as separate stages. |
| A future client reaches more of the LAN than intended. | The advertised prefix or access policy is broader than the documented requirement. | Withdraw or disable the broad route, restore the prior reviewed policy, and replace the route with the smallest prefixes that satisfy the requirement before retesting. |

## Security considerations

### principles
Treat tailnet administration and the associated identity provider as privileged security systems.
Require strong multifactor authentication for administrators and protect account recovery paths.
Grant access by role, destination, and service instead of granting broad LAN reachability.
Use device tags for infrastructure roles only when tag ownership and assignment are controlled.
Advertise and approve the smallest practical subnet prefixes.
Keep management interfaces separate from ordinary user services in access policy.
Test expected denials after every policy change.
Review stale users, stale devices, reusable enrollment mechanisms, route approvals, and administrator assignments.
Maintain endpoint patching, disk protection, screen locking, and application authentication because an encrypted tunnel does not secure a compromised endpoint.
Retain an independent recovery path while changing remote-access configuration.

### threats
### threat
Compromised administrator identity

### mitigation
Use strong multifactor authentication, minimize administrators, monitor administrative changes, and maintain a documented recovery and revocation process.
### threat
Lost or stolen enrolled client

### mitigation
Revoke the device promptly, protect local storage and sessions, review recent access, and rotate application credentials if exposure is plausible.
### threat
Overly broad subnet route

### mitigation
Advertise only necessary prefixes, require route approval, restrict route use by identity, and test inaccessible destinations.
### threat
Overly permissive policy

### mitigation
Use named roles and infrastructure identities, document each allowed flow, and maintain negative test cases.
### threat
Compromised subnet router

### mitigation
Dedicate and harden the node where practical, minimize local services, patch it, monitor it, and limit the networks and identities it connects.
### threat
False confidence from encryption

### mitigation
Continue using destination application authentication, authorization, updates, audit logs, and backups.
### threat
Administrative lockout during migration

### mitigation
Keep the previous access path active until allowed flows, denied flows, DNS, route behavior, and rollback have been verified.

### logging_guidance
Correlate identity-provider events, tailnet administrative changes, device state, route approvals, connection diagnostics, destination host logs, and application audit logs. Avoid placing reusable credentials, authentication keys, or sensitive full network inventories in classroom artifacts.

## Rollback

### lab_rollback
Remove only the four known files created by the lab, then remove the class directory if it is empty.

### lab_command
python3 - <<'PY'
from pathlib import Path
root = Path('/opt/lab-classroom/class68')
for name in ('architecture.json', 'access-tests.json', 'rollout.json', 'review.txt'):
    path = root / name
    if path.exists() and path.is_file():
        path.unlink()
try:
    root.rmdir()
except OSError:
    print('Directory retained because it is not empty:', root)
PY

### live_deployment_strategy
Preserve the independent management path.
Disable or withdraw an unexpectedly broad advertised route.
Revert to the last reviewed access policy.
Revoke an incorrectly enrolled or compromised device.
Stop client use of an unintended exit node.
Restore the previous DNS design if naming changes caused disruption.
Retest a known local path before ending the maintenance window.

### rollback_limit
The lab rollback removes only classroom artifacts. It cannot undo live tailnet changes because the lab does not make any.

## Video narration notes

Welcome to Class 68, Tailscale for Homelab Remote Access. The main design goal is not merely to make a remote packet reach your LAN. It is to give an authenticated person access to a specifically authorized service while reducing unnecessary public exposure.

Tailscale separates coordination from packet transport. Its control plane handles identities, peer information, policy, names, and connection coordination. The data plane carries encrypted packets between devices. Peers attempt a direct connection first. If their current networks prevent a usable direct path, DERP can relay the encrypted packets. A relay path may behave differently from a direct path, but it remains an encrypted peer session.

For a homelab, decide whether each server should run Tailscale directly or be reached through a subnet router. Direct enrollment gives a server its own identity and usually supports more precise policy. A subnet router is appropriate for devices that cannot run a client, but it can place an entire prefix behind one routing node. Keep advertised routes narrow and require deliberate approval. An exit node is a separate concept: it can carry a client's general traffic rather than only traffic for selected private prefixes.

Access policy should describe roles and intended services. Administrators may need a backup dashboard and appliance management interface, while a media user should not reach those destinations. Test both outcomes. A plan that checks only successful access cannot prove isolation.

Remember that routing, DNS, service availability, and application authorization are separate layers. If an address works but a name fails, investigate DNS. If the node is reachable but the application fails, inspect the destination service and its authorization. Tailscale narrows network exposure, but it does not replace updates, strong application credentials, endpoint protection, logging, or backups.

In the lab, we do not enroll the machine or alter networking. We create an architecture document, access test matrix, rollout checklist, and review report under the class directory. The validation requires a preserved management path, explicit route approval, a narrowly defined subnet, and both allowed and denied test cases. This design-first workflow gives you evidence to review before making any live change.

## References

- Tailscale, What is Tailscale?: https://tailscale.com/kb/1151/what-is-tailscale
- Tailscale, How Tailscale works: https://tailscale.com/blog/how-tailscale-works
- Tailscale, Connection types: https://tailscale.com/kb/1257/connection-types
- Tailscale, DERP servers: https://tailscale.com/kb/1232/derp-servers
- Tailscale, Access control: https://tailscale.com/kb/1018/acls
- Tailscale, Grants syntax: https://tailscale.com/kb/1324/grants
- Tailscale, Subnet routers: https://tailscale.com/kb/1019/subnets
- Tailscale, Exit nodes: https://tailscale.com/kb/1103/exit-nodes
- Tailscale, MagicDNS: https://tailscale.com/kb/1081/magicdns
- Tailscale, Device approval: https://tailscale.com/kb/1099/device-approval
- WireGuard, Protocol and cryptography: https://www.wireguard.com/protocol/

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

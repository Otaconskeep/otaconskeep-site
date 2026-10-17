# Lab: Tailscale for Homelab Remote Access

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain how Tailscale separates its coordination control plane from its encrypted data plane

## Before you start

- Basic understanding of IPv4 addressing, private subnets, routing, DNS, and network ports
- Basic Linux command-line experience
- Ability to distinguish authentication from authorization
- Familiarity with JSON and simple Python commands
- A conceptual understanding of remote-access VPNs
- Optional access to an existing Tailscale account for comparing the lesson design with a real tailnet; no account is required for the lab

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

## Verification

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

## Security

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

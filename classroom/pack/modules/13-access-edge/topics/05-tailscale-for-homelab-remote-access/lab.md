# Lab: Tailscale for Homelab Remote Access

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain the roles of the Tailscale coordination service, node identity, WireGuard tunnels, and DERP relays

## Before you start

- Basic Linux command-line navigation
- Understanding of IP addresses, subnets, routing, and ports
- A conceptual understanding of public and private networks
- Permission to inspect the local host's Tailscale status if Tailscale is installed
- Python 3 for the local policy-design validation exercise
- No Tailscale account or active tailnet is required for the safe lab

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

## Verification

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

## Security

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

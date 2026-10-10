# Lab: Authentication and Access Control

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Distinguish identification, authentication, authorization, accounting, and session management.

## Before you start

- Basic Linux command-line navigation
- Ability to read simple Python and JSON-style data structures
- Administrative permission to create and remove /opt/lab-classroom/class67/
- Python 3.9 or newer
- The parent directory /opt/lab-classroom must already exist

## Guided lab

### scope
All persistent changes are restricted to /opt/lab-classroom/class67/. The simulator does not create operating-system accounts, change host authentication, alter network controls, or modify system policy.

### steps
### step
1

### title
Create the isolated lab directory

### commands
sudo install -d -m 0750 /opt/lab-classroom/class67

### explanation
The directory is dedicated to this class and is the only location in which the lab stores files.
### step
2

### title
Create the access-control simulator

### commands
sudo tee /opt/lab-classroom/class67/access_lab.py >/dev/null <<'PY'
import json
import os
from datetime import datetime, timezone
from pathlib import Path

BASE = Path('/opt/lab-classroom/class67')
AUDIT = BASE / 'audit.jsonl'

IDENTITIES = {
    'alice': ['operator'],
    'bob': ['viewer', 'auditor'],
    'task-agent': ['viewer'],
}

PERMISSIONS = {
    'viewer': {('read', 'inventory')},
    'operator': {
        ('read', 'inventory'),
        ('update', 'inventory'),
        ('run', 'jobs'),
    },
    'auditor': {('read', 'audit')},
}

EXPLICIT_DENIALS = {
    ('task-agent', 'run', 'jobs'),
}

def record(principal, action, resource, decision, reason):
    event = {
        'time': datetime.now(timezone.utc).isoformat(),
        'principal': principal,
        'action': action,
        'resource': resource,
        'decision': decision,
        'reason': reason,
    }
    with AUDIT.open('a', encoding='utf-8') as handle:
        handle.write(json.dumps(event, sort_keys=True) + '\n')
    os.chmod(AUDIT, 0o640)

def authorize(principal, action, resource):
    if principal not in IDENTITIES:
        decision, reason = 'DENY', 'unknown-identity'
    elif (principal, action, resource) in EXPLICIT_DENIALS:
        decision, reason = 'DENY', 'explicit-denial'
    else:
        decision, reason = 'DENY', 'no-matching-grant'
        for role in IDENTITIES[principal]:
            if (action, resource) in PERMISSIONS.get(role, set()):
                decision, reason = 'ALLOW', f'role:{role}'
                break
    record(principal, action, resource, decision, reason)
    return decision, reason

def main():
    AUDIT.write_text('', encoding='utf-8')
    os.chmod(AUDIT, 0o640)
    tests = [
        ('alice', 'read', 'inventory'),
        ('alice', 'run', 'jobs'),
        ('bob', 'read', 'audit'),
        ('bob', 'update', 'inventory'),
        ('task-agent', 'run', 'jobs'),
        ('mallory', 'read', 'inventory'),
    ]
    for principal, action, resource in tests:
        decision, reason = authorize(principal, action, resource)
        print(f'{decision} principal={principal} action={action} resource={resource} reason={reason}')

if __name__ == '__main__':
    main()
PY
sudo chmod 0640 /opt/lab-classroom/class67/access_lab.py

### explanation
The simulator recognizes three principals, maps them to roles, evaluates one explicit denial, defaults to denial, and records every decision.
### step
3

### title
Run the policy tests

### commands
sudo python3 /opt/lab-classroom/class67/access_lab.py

### explanation
The fixed test set includes valid grants, missing grants, an explicit denial, and an unrecognized identity.
### step
4

### title
Inspect the audit evidence

### commands
sudo cat /opt/lab-classroom/class67/audit.jsonl
sudo wc -l /opt/lab-classroom/class67/audit.jsonl
sudo stat -c '%a %n' /opt/lab-classroom/class67/access_lab.py /opt/lab-classroom/class67/audit.jsonl

### explanation
There should be six JSON records. The source and audit files should both report mode 640.
### step
5

### title
Confirm default-deny implementation

### commands
sudo grep -n "no-matching-grant" /opt/lab-classroom/class67/access_lab.py
sudo grep -n '"decision": "DENY"' /opt/lab-classroom/class67/audit.jsonl

### explanation
The first command locates the default outcome in the program. The second displays denied decisions from the audit evidence.

## Expected results

- Alice is allowed to read inventory because the operator role grants that action and resource pair.
- Alice is allowed to run jobs because the operator role grants that action and resource pair.
- Bob is allowed to read the audit resource because the auditor role grants that permission.
- Bob is denied permission to update inventory because neither of his roles grants that operation.
- The task-agent principal is denied permission to run jobs because an explicit denial applies.
- Mallory is denied before role evaluation because the identity is not registered.
- The audit file contains six JSON lines after a complete run.
- Both the simulator source and audit file report permission mode 640.

## Verification

- [ ] Run sudo python3 /opt/lab-classroom/class67/access_lab.py and confirm that exactly three lines begin with ALLOW and exactly three lines begin with DENY.
- [ ] Run sudo wc -l /opt/lab-classroom/class67/audit.jsonl and confirm that the count is 6.
- [ ] Run sudo grep -c '"decision": "ALLOW"' /opt/lab-classroom/class67/audit.jsonl and confirm that the count is 3.
- [ ] Run sudo grep -c '"decision": "DENY"' /opt/lab-classroom/class67/audit.jsonl and confirm that the count is 3.
- [ ] Run sudo grep '"reason": "explicit-denial"' /opt/lab-classroom/class67/audit.jsonl and confirm that the matching event identifies task-agent, run, and jobs.
- [ ] Run sudo grep '"reason": "unknown-identity"' /opt/lab-classroom/class67/audit.jsonl and confirm that the matching event identifies mallory.
- [ ] Run sudo stat -c '%a' /opt/lab-classroom/class67/access_lab.py /opt/lab-classroom/class67/audit.jsonl and confirm that both output lines are 640.
- [ ] Run sudo find /opt/lab-classroom/class67 -maxdepth 1 -type f -printf '%f\n' and confirm that only access_lab.py and audit.jsonl are present.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| Creating the lab directory reports that the parent path does not exist. | The classroom parent directory was not provisioned before the lesson. | Have the homelab administrator create /opt/lab-classroom according to the classroom baseline, then repeat the directory creation step. Do not redirect the lab to an unrelated system path. |
| The shell reports permission denied while creating or reading a lab file. | The command was run without the required administrative permission, or the lab directory has unexpected ownership or mode settings. | Use the listed sudo commands and inspect the directory with sudo stat /opt/lab-classroom/class67. Restore the directory mode with sudo chmod 0750 /opt/lab-classroom/class67 if necessary. |
| Python reports a syntax or indentation error. | The here-document was copied incompletely or indentation was changed. | Recreate access_lab.py by repeating step 2 exactly, then run sudo python3 -m py_compile /opt/lab-classroom/class67/access_lab.py. |
| The audit file contains more or fewer than six lines. | The simulator was modified, execution stopped early, or a different program wrote to the file. | Recreate the simulator from step 2 and run it once. The main function resets the audit file before evaluating the six fixed cases. |
| A denied case unexpectedly reports ALLOW. | A role permission, role binding, or policy evaluation order was changed. | Compare IDENTITIES, PERMISSIONS, EXPLICIT_DENIALS, and the authorize function with the lesson version. Ensure explicit denials are evaluated before role permissions and that the initial authorization result is DENY. |
| The file mode is not 640. | The file was recreated outside the listed procedure or its mode was manually changed. | Run sudo chmod 0640 /opt/lab-classroom/class67/access_lab.py /opt/lab-classroom/class67/audit.jsonl and repeat the stat verification. |

## Security

### principles
The simulator denies requests when no exact grant exists.
Explicit denial is evaluated before role grants.
Unknown identities do not receive role evaluation.
Every test request produces an audit event.
Audit events contain decision metadata but no authentication material.
Lab files are not world-readable or world-writable.
All persistent lab changes remain under /opt/lab-classroom/class67/.

### production_cautions
The local identity registry is educational and does not perform real identity verification.
Production services must use a maintained identity provider or authentication framework appropriate to the application.
Authorization must be enforced by the service handling the protected operation, not only by a client interface.
Role changes, account disablement, and policy updates must be reflected in active sessions within an approved interval.
Administrative policy changes should themselves be authorized, reviewed, and logged.
Audit destinations should be access-controlled, monitored, retained according to policy, and protected against alteration.

## Rollback

### goal
Remove the class directory and every artifact created by this lesson without affecting any other classroom or system path.

### precheck
Run sudo find /opt/lab-classroom/class67 -maxdepth 2 -print and verify that the displayed path is the class67 directory and its expected files.

### command
sudo python3 -c "from pathlib import Path; import shutil; p=Path('/opt/lab-classroom/class67'); assert p == Path('/opt/lab-classroom/class67'); shutil.rmtree(p)"

### postcheck
Run test ! -e /opt/lab-classroom/class67 && echo 'class67 lab removed' and confirm that the message is printed.

### recovery
The audit evidence is intentionally destroyed by rollback. To recreate the lab, repeat the directory creation, file creation, and execution steps.

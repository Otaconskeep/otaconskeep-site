# Class 67: Authentication and Access Control

**Learning objective:** Distinguish identification, authentication, authorization, accounting, and session management.; Explain why successful authentication does not automatically grant access to a resource.; Implement role-based access control with default-deny behavior.; Apply explicit denial before evaluating role grants.; Recognize the security benefits of least privilege, complete mediation, separation of duties, and auditable decisions.; Verify authorization behavior with positive and negative test cases.; Remove all lab artifacts without changing files outside the assigned lab directory.
**Bloom level:** Understand / Apply
**Track:** Homelab Security and Identity · **Difficulty:** intermediate · **Duration:** ~75 minutes · **Lab risk:** low
**Build output:** Teach the distinction between identity verification and authorization, then apply default-deny, role-based access control, explicit denial, least privilege, and auditable access decisions in a contained policy simulator.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### operating_systems
Debian 12
Ubuntu Server 22.04 LTS or newer
Rocky Linux 9
Other Linux distributions with Python 3.9 or newer and standard POSIX file permissions

### runtime
Python 3.9 or newer using only the standard library

### shell
A POSIX-compatible shell with sudo, tee, grep, stat, wc, find, and test

### privilege
Administrative permission is required only to manage files inside /opt/lab-classroom/class67/.

### network
No network access is required for the lab after the required reading has been obtained.

### limitations
The simulator is an educational authorization model. It is not an identity provider, session manager, policy distribution service, or production enforcement framework.

## Learning objective

- Distinguish identification, authentication, authorization, accounting, and session management.
- Explain why successful authentication does not automatically grant access to a resource.
- Implement role-based access control with default-deny behavior.
- Apply explicit denial before evaluating role grants.
- Recognize the security benefits of least privilege, complete mediation, separation of duties, and auditable decisions.
- Verify authorization behavior with positive and negative test cases.
- Remove all lab artifacts without changing files outside the assigned lab directory.

## Why this matters

Teach the distinction between identity verification and authorization, then apply default-deny, role-based access control, explicit denial, least privilege, and auditable access decisions in a contained policy simulator.

## Prerequisites

- Basic Linux command-line navigation
- Ability to read simple Python and JSON-style data structures
- Administrative permission to create and remove /opt/lab-classroom/class67/
- Python 3.9 or newer
- The parent directory /opt/lab-classroom must already exist

## Required reading

- NIST SP 800-63-4, Digital Identity Guidelines: review the overview of identity proofing, authentication, and federation.
- OWASP Authorization Cheat Sheet: review deny-by-default, validate permissions on every request, and least-privilege guidance.
- OWASP Authentication Cheat Sheet: review authentication controls, reauthentication, and defensive response behavior.
- NIST SP 800-53 Rev. 5 controls AC-2, AC-3, AC-5, AC-6, and AU-2.

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| Identification | The act of claiming an identity, such as selecting an account name. A claim alone does not prove that the claimant controls the identity. |
| Authentication | The process of verifying an identity claim using one or more approved authenticators and a trusted verification process. |
| Authorization | The decision that determines whether an authenticated principal may perform a requested action on a particular resource. |
| Principal | An identity that can request access, including a person, service, workload, or device. |
| Role-based access control | An authorization model in which permissions are assigned to roles and principals are assigned to those roles. |
| Access control list | A list associated with a resource that identifies principals or groups and the operations they may perform. |
| Default deny | A policy stance in which access is refused unless a matching rule explicitly grants it. |
| Explicit deny | A rule that deliberately refuses a request and takes precedence over a broader grant. |
| Least privilege | Granting only the access needed to perform an approved task, for only the required scope and duration. |
| Complete mediation | Checking authorization for every access request instead of assuming that an earlier decision remains valid. |
| Separation of duties | Dividing sensitive operations among distinct roles so that one principal cannot unilaterally complete a high-impact workflow. |
| Accounting | Recording relevant security events so access decisions and administrative actions can be reviewed. |

## Instruction

Authentication and authorization solve different problems. Identification is a claim about who is making a request, while authentication evaluates whether that claim should be trusted. Authorization occurs afterward and asks whether the verified principal may perform a specific action on a specific resource. A system that verifies identity correctly can still be insecure if every authenticated principal receives excessive access.

An authorization decision should consider at least the principal, requested action, target resource, applicable policy, and current context. Context may include account state, device posture, request origin, time, or whether a stronger authentication event was recently completed. The decision should be enforced at a trusted boundary, not only hidden in a user interface. Removing a button does not prevent a direct request to the underlying service.

Role-based access control groups permissions into operational roles. This is easier to administer than assigning every permission directly to every principal, but roles can grow too broad over time. Periodic review is therefore necessary. Attribute-based policies can provide finer decisions by considering resource ownership, classification, location, or other validated attributes. Many production systems combine roles with contextual attributes.

A secure policy begins with default deny. If no rule clearly grants a request, the request is refused. Explicit denial should take precedence over a general grant when an exception must be enforced. Every request should be mediated because roles, account status, resource sensitivity, and policy can change after a session begins. Long-lived sessions must not become a way to preserve access that has already been revoked.

Least privilege limits both mistakes and hostile activity. Human administrators should use ordinary accounts for routine work and elevate only for approved tasks. Service identities should receive narrow permissions tied to their function. Shared identities weaken accountability because audit records can no longer reliably identify the actor. Separation of duties further reduces risk by requiring distinct roles for operations such as requesting, approving, and executing a sensitive change.

Audit records should capture the principal, action, resource, decision, reason, and time. They should avoid unnecessary authentication material or private data. Denied requests matter because they can reveal policy mistakes, broken automation, or attempted misuse. Logs must also be protected from unauthorized alteration. In this lab, authentication is represented only by membership in a local identity registry; it is intentionally not a production authentication system. The exercise focuses on the boundary between an accepted identity assertion and a separate authorization decision.

## Architecture

### components
A local identity registry representing principals whose identity assertion has already been accepted.
Role bindings that associate each recognized principal with one or more roles.
A permission map that associates roles with action and resource pairs.
An explicit-denial set evaluated before role grants.
A default-deny authorization engine.
A local audit file containing one JSON record for each evaluated request.

### decision_flow
Receive a principal, action, and resource.
Reject the request if the principal is not in the identity registry.
Check explicit-denial rules and refuse matching requests.
Evaluate permissions belonging to every role assigned to the principal.
Grant the request when an exact action and resource pair matches.
Deny the request when no grant matches.
Record the outcome and reason in the audit file.

### trust_boundaries
The identity registry boundary decides whether an identity assertion is recognized.
The authorization engine is the policy decision point.
The function that returns the decision is the simulated enforcement point.
The audit file is evidence and must be protected against unauthorized modification.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Add a read-only reports resource and grant it to the viewer role. Add one allowed and one denied test, then document why each result is correct.
Design separate requester and approver roles for a hypothetical backup restoration workflow. Ensure no single role can both request and approve the same restoration.
Write a short access-review procedure covering role owners, review frequency, evidence to collect, removal of stale access, and handling of exceptions.
Extend the audit event with a generated request identifier that contains no identity or authentication data, then verify that every decision has a distinct identifier.
Describe how immediate account disablement should affect existing sessions in a production application and where enforcement should occur.

## Feynman teach-back

Explain authentication as proving who is making a request and authorization as deciding what that proven identity may do.
Use a locked building analogy: presenting an accepted identity at reception does not imply that every room is available.
Explain default deny by stating that an absent rule is not permission; access requires a specific matching grant.
Explain explicit denial as a narrow stop rule that overrides a broader role grant.
Describe least privilege by asking whether removing a permission would prevent the principal from completing its approved task. If not, the permission is probably unnecessary.
Explain complete mediation by imagining that a role is revoked while a session remains open. Each new protected request must account for the current policy.
Teach back the lab flow without looking at the source: identity lookup, explicit-denial check, role-grant check, default denial, and audit recording.

## Retrieval check

1. 1. What is the difference between authentication and authorization?
2. 2. Why should an authorization system use default-deny behavior?
3. 3. In the lab, which check occurs before role permissions are evaluated?
4. 4. Why is hiding an administrative button insufficient access control?
5. 5. How does least privilege reduce security risk?
6. 6. Why should authorization be checked on every protected request?
7. 7. What information does the lab record for each access decision?
8. 8. Why are shared identities harmful to accountability?

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

## Verification checkpoints

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

## Security considerations

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

## Video narration notes

Welcome to Class 67, Authentication and Access Control. This lesson separates two ideas that are often incorrectly treated as one. Authentication determines whether an identity claim should be trusted. Authorization determines what that trusted identity may do. A successful sign-in is therefore not a universal access grant.

Our lab models a small policy decision point. Three recognized principals are assigned roles. Roles contain exact action and resource pairs. Before considering those grants, the program rejects unrecognized identities and evaluates an explicit-denial rule. If no rule grants the requested operation, the result remains denied. This is default-deny behavior.

As you run the simulator, notice that Alice can read inventory and run jobs through the operator role. Bob can read the audit resource through the auditor role but cannot update inventory. The task-agent request to run jobs is stopped by an explicit denial. Mallory is rejected because that identity is not registered. Each request produces an audit record containing the actor, operation, resource, outcome, reason, and time.

This model demonstrates several production principles even though it does not implement real identity verification. Authorization should be enforced at the protected service, checked for every request, and based on current policy. Permissions should be narrow enough to support approved duties without granting unrelated capabilities. Sensitive workflows may need multiple roles so one actor cannot request, approve, and execute the same operation.

Finally, verify both positive and negative cases. Testing only successful access leaves the most important boundary unexamined. Confirm the number of allowed and denied outcomes, inspect the explicit-denial event, check the unknown-identity event, and verify restrictive file modes. When finished, use the controlled rollback procedure to remove only the class67 directory.

## References

- NIST SP 800-63-4, Digital Identity Guidelines: https://pages.nist.gov/800-63-4/
- NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- MITRE CWE-862, Missing Authorization: https://cwe.mitre.org/data/definitions/862.html
- MITRE CWE-863, Incorrect Authorization: https://cwe.mitre.org/data/definitions/863.html

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

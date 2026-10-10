# Reading: Authentication and Access Control

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Distinguish identification, authentication, authorization, accounting, and session management.

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

## Required reading

- NIST SP 800-63-4, Digital Identity Guidelines: review the overview of identity proofing, authentication, and federation.
- OWASP Authorization Cheat Sheet: review deny-by-default, validate permissions on every request, and least-privilege guidance.
- OWASP Authentication Cheat Sheet: review authentication controls, reauthentication, and defensive response behavior.
- NIST SP 800-53 Rev. 5 controls AC-2, AC-3, AC-5, AC-6, and AU-2.

## References

- NIST SP 800-63-4, Digital Identity Guidelines: https://pages.nist.gov/800-63-4/
- NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- MITRE CWE-862, Missing Authorization: https://cwe.mitre.org/data/definitions/862.html
- MITRE CWE-863, Incorrect Authorization: https://cwe.mitre.org/data/definitions/863.html

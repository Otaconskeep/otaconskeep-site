# Lesson 13.04: Authentication and Access Control

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Distinguish identification, authentication, authorization, accounting, and session management.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Distinguish identification, authentication, authorization, accounting, and session management.

## Why this matters

Teach the distinction between identity verification and authorization, then apply default-deny, role-based access control, explicit denial, least privilege, and auditable access decisions in a contained policy simulator.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

Explain authentication as proving who is making a request and authorization as deciding what that proven identity may do.
Use a locked building analogy: presenting an accepted identity at reception does not imply that every room is available.
Explain default deny by stating that an absent rule is not permission; access requires a specific matching grant.
Explain explicit denial as a narrow stop rule that overrides a broader role grant.
Describe least privilege by asking whether removing a permission would prevent the principal from completing its approved task. If not, the permission is probably unnecessary.
Explain complete mediation by imagining that a role is revoked while a session remains open. Each new protected request must account for the current policy.
Teach back the lab flow without looking at the source: identity lookup, explicit-denial check, role-grant check, default denial, and audit recording.

## Reflection

1. What did I learn?
2. What did I struggle with?
3. How does this connect to earlier classes?

## Topic path (do in order)

| Step | Activity | Purpose |
|---|---|---|
| 1 | [Reading](./reading.md) | Learn |
| 2 | This lesson (Feynman) | Explain |
| 3 | [Lab](./lab.md) | Practice |
| 4 | [Homework](./homework.md) | Apply |
| 5 | [Quiz](./quiz.md) | Test |

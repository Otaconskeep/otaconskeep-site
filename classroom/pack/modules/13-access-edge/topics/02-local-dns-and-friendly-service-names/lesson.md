# Lesson 13.02: Local DNS and Friendly Service Names

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain the roles of DNS clients, recursive resolvers, authoritative data, caching, and search domains
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Explain the roles of DNS clients, recursive resolvers, authoritative data, caching, and search domains

## Why this matters

Teach learners how local DNS converts memorable service names into IP addresses, why a dedicated home-network namespace is preferable to improvised names, and how to test a self-contained DNS service without changing the host's system resolver configuration.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain local DNS to a family member who knows that websites have names but does not know how name resolution works.

### model_explanation
DNS is like a local contacts list for computers. Instead of remembering that the storage server uses a particular numerical address, you ask for nas.lab.home.arpa. Your computer asks a DNS server for the address stored under that name. The DNS answer only tells the computer where to try connecting; it does not guarantee that the storage service is running, that the route works, or that the service is trustworthy. In this lab, we created a tiny contacts list that can be queried only from the same machine.

### check_yourself
Can you explain why an A record does not contain an application port?
Can you explain why successful DNS resolution does not prove that a web service is healthy?
Can you explain why home.arpa is preferable to inventing a public-looking suffix?
Can you describe the difference between a full name and a short name that depends on a search domain?

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

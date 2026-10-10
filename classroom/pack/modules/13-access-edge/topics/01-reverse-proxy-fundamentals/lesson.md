# Lesson 13.01: Reverse Proxy Fundamentals

**Module:** Edge Access & VPN
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Distinguish a reverse proxy from a forward proxy.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Distinguish a reverse proxy from a forward proxy.

## Why this matters

Explain how a reverse proxy receives client requests, selects an upstream service, forwards request metadata, returns upstream responses, and creates a controlled boundary between clients and backend applications. The lab builds an isolated educational proxy and backend using only the Python standard library.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain the lab to someone who knows what a website is but has never heard of a reverse proxy.

### model_explanation
The backend is like a kitchen, and the reverse proxy is like the service counter. A customer gives an order to the counter instead of walking into the kitchen. The counter records useful information, passes the order to the kitchen, receives the finished result, and hands it back. Customers only need to know the counter address even if the kitchen later moves or several kitchens are added. If the kitchen is unavailable but the counter is still open, the counter can report a gateway error. Because customers can write misleading notes on an order, the counter must create trusted delivery information itself rather than believing every forwarding label supplied by a customer.

### self_check
Can you identify which process accepted the client connection?
Can you identify which process generated a 502 when the backend was down?
Can you explain why the backend sees the proxy as its immediate network peer?
Can you explain why forwarding headers must have a trust policy?
Can you explain why loopback binding reduces exposure?

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

# Lesson 12.08: Notifications for Downloads, Failures, and Requests

**Module:** Requests & Media Servers
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Distinguish informational download notifications from actionable failure notifications.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Distinguish informational download notifications from actionable failure notifications.

## Why this matters

Design and test a notification workflow that converts download, failure, and media-request events into useful, deduplicated messages without contacting external services or exposing sensitive data.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain the system to a new homelab operator without using the words webhook, idempotency, or deduplication.

### model_explanation
Applications report things that happened. A small processor sorts those reports by importance, turns them into short human-readable messages, and places each message in the appropriate destination. Successful downloads go to a quiet activity area, failures go to an operations area, and new requests go to a review area. Before creating a message, the processor calculates a stable label from the original event and destination. If that label was already recorded, the processor knows it has handled the event before and does not send another copy.

### check_for_understanding
Can the learner explain why a completed download and a repeated failure should not have the same urgency?
Can the learner describe how the processor recognizes a replayed event?
Can the learner identify information that belongs in diagnostic logs but not in a general notification?
Can the learner explain why successful message generation is different from successful message delivery?

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

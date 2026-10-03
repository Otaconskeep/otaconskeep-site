# Lesson 12.04: Plex versus Jellyfin and Safe Migration

**Module:** Requests & Media Servers
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain the major operational, licensing, authentication, client, and administration differences between Plex and Jellyfin.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-02-20

## Learning objective

Explain the major operational, licensing, authentication, client, and administration differences between Plex and Jellyfin.

## Why this matters

Compare Plex and Jellyfin without treating either platform as universally superior, then design and rehearse a reversible migration that preserves source media, separates application state, validates library behavior, and provides a clear rollback path.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain the migration to a household member who knows only that both applications can play movies. Use the concepts of a bookshelf, two catalogs, and a return plan.

### model_answer
The media files are the books on the bookshelf. Plex and Jellyfin are two different catalogs describing those books. We can let the new catalog read the same shelf without giving it permission to rearrange the books. We do not pour one catalog's internal database into the other because they record information differently. Instead, Jellyfin builds its own catalog, and we recreate or carefully transfer user-specific information only through methods we have tested. We check important televisions and phones, confirm restrictions and playback, and prove the books did not change. Plex and its backup remain available during a rollback window. If Jellyfin fails an important requirement, we direct everyone back to Plex while investigating.

### self_check_questions
Can you explain why media files are more portable than application databases?
Can you name three forms of state that may require manual recreation or a tested transfer tool?
Can you explain why two servers writing sidecar metadata can create ambiguity?
Can you state a measurable rollback trigger?
Can you explain why one successful browser test is insufficient?

### common_misconceptions
Open-source software is not automatically secure without updates, access control, backups, and careful exposure.
A proprietary product is not automatically easier for every household or every client.
Matching item counts do not prove matching metadata or playback behavior.
A GPU does not guarantee that every conversion operation will use hardware acceleration.
A backup archive is not validated until its integrity and recovery usefulness have been checked.

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

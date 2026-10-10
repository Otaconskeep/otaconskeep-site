# Lesson 12.04: Plex versus Jellyfin and Safe Migration

**Module:** Requests & Media Servers
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain the major architectural and operational differences between Plex and Jellyfin.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Explain the major architectural and operational differences between Plex and Jellyfin.

## Why this matters

Compare Plex and Jellyfin as self-hosted media platforms, identify migration boundaries, and practice a staged migration workflow that preserves the source system, matches media through stable identifiers, quarantines ambiguous records, and provides a tested rollback path.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain the migration to a family member who understands streaming but not databases.

### model_explanation
The video files are like books, while Plex and Jellyfin are two different librarians with different card catalogs. Moving the books does not move each librarian's notes about covers, users, bookmarks, or what someone finished reading. We let the new librarian inspect the same books and build a new catalog. We then copy bookmarks only when a reliable book number proves which title they belong to. If the number is missing or points to more than one item, we put that bookmark aside for a person to review. We keep the old librarian working until the new catalog, clients, and bookmarks have been checked. If the test fails, everyone returns to the old librarian because its catalog was never destroyed.

### check_questions
Why is a server database not equivalent to the media files?
Why is title-only matching unsafe?
Why does keeping the source unchanged make rollback simpler?
Why must playback be tested on representative clients rather than only in a browser?

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

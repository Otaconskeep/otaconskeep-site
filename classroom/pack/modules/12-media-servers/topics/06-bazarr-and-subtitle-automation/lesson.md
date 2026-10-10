# Lesson 12.06: Bazarr and Subtitle Automation

**Module:** Requests & Media Servers
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain why Bazarr depends on Sonarr and Radarr metadata instead of acting as a general-purpose filesystem scanner.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Explain why Bazarr depends on Sonarr and Radarr metadata instead of acting as a general-purpose filesystem scanner.

## Why this matters

Teach learners how Bazarr integrates with Sonarr and Radarr to discover media, select subtitle releases, manage language policies, and place subtitle sidecar files while preserving predictable paths, security boundaries, and rollback options.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain Bazarr to someone who understands a media player but has never used media automation.

### model_explanation
Sonarr and Radarr are like librarians that already know which television episodes and movies are on the shelves and where each file is stored. Bazarr asks those librarians for the catalog instead of wandering through every shelf by itself. For each catalog entry, Bazarr checks a language wish list. If a wanted subtitle is missing, it asks approved subtitle services for candidates, chooses a suitable match, and places the subtitle next to the video so a player can find it. This works only if Bazarr can reach both the librarians and the same shelves. If the librarians call a shelf /media/tv but Bazarr sees it under a different name, Bazarr needs an exact translation. Credentials open the librarians' catalogs and provider accounts, so they must be protected.

### self_check_questions
Why is successful API connectivity insufficient when Bazarr cannot see the corresponding media path?
Why should forced and hearing-impaired subtitles be modeled separately?
Why is disabling automation safer than immediately deleting subtitle files during rollback?

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

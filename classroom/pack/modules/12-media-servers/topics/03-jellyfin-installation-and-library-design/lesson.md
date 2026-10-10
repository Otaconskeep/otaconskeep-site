# Lesson 12.03: Jellyfin Installation and Library Design

**Module:** Requests & Media Servers
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Explain the roles of Jellyfin configuration, cache, metadata, transcode workspace, and media storage.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-02-20

## Learning objective

Explain the roles of Jellyfin configuration, cache, metadata, transcode workspace, and media storage.

## Why this matters

Design a maintainable Jellyfin deployment, stage a container-based installation definition, and organize media libraries without exposing the service or modifying files outside the classroom workspace.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain the design to a household member who understands folders but not containers.

### model_explanation
Jellyfin is a librarian. The configuration folder is the librarian's catalog and account book, so it needs careful backups. The cache folder is a scratch desk that can be rebuilt. The media folder is the actual collection, and the librarian is allowed to read it but not alter it. Movies, shows, and music use separate shelves with predictable labels so titles can be matched correctly. The web port is connected only to the same computer during staging, which prevents accidental network exposure. If a playback device understands the original file, Jellyfin hands it over directly. If not, Jellyfin may have to translate the file while it plays, which requires more processing power.

### check_for_understanding
Why is the configuration directory more important to back up than the cache directory?
Why is the media mount read-only?
Why does a release year improve movie matching?
Why can two clients produce different server workloads for the same media file?
Why is loopback-only publication safer during initial setup?

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

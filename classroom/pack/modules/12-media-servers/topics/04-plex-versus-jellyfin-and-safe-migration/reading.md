# Reading: Plex versus Jellyfin and Safe Migration

**Module:** Requests & Media Servers
**Activity type:** Reading (Learn)
**Objective:** Explain the major operational, licensing, authentication, client, and administration differences between Plex and Jellyfin.

## Vocabulary

| Term | Meaning |
|---|---|
| Media payload | The movie, episode, music, photo, subtitle, or other content file that the server catalogs and streams. |
| Application data | Product-specific configuration, databases, artwork caches, logs, plug-ins, credentials, and runtime state. Plex application data and Jellyfin application data are not interchangeable. |
| Library mapping | The relationship between a path visible to the media server and the content category assigned to that path. |
| Path stability | The practice of keeping the server-visible media path consistent so that scans, automation, and operational documentation do not need unnecessary changes. |
| Direct play | Delivery of a media file without changing its encoded audio or video streams. |
| Remux | Repackaging existing streams into a different container without re-encoding the audio or video. |
| Transcoding | Converting one or more streams during playback because of bandwidth, codec, container, subtitle, resolution, or client compatibility requirements. |
| Hardware acceleration | Use of supported GPU or media-engine capabilities to perform eligible decode, encode, or tone-mapping work. Availability depends on hardware, drivers, operating system, deployment method, and server configuration. |
| Sidecar metadata | Files stored near media, such as artwork, subtitles, or NFO metadata, rather than only in an application's internal database. |
| Parallel run | A migration phase in which the old and new services coexist long enough to validate the new service before cutover. |
| Cutover | The controlled point at which users and normal client traffic are directed to the replacement service. |
| Rollback trigger | A predeclared condition that requires returning users to the previous service instead of improvising under pressure. |
| Watched state | Per-user history indicating whether an item was played, partially played, or completed. Its representation is product-specific and may not transfer cleanly. |

## Instruction

Plex and Jellyfin solve the same broad problem: they index media, present libraries to clients, and stream content either directly or through conversion. They differ substantially in governance and operating model. Plex Media Server is proprietary software integrated with the wider Plex account and client ecosystem. It is often attractive when a household values broad client availability, centralized discovery, and a comparatively guided remote-use experience. Some capabilities depend on Plex Pass, supported hardware, client behavior, or current product policy. Jellyfin is free and open-source software designed around self-hosted administration. It does not require a vendor-hosted account for normal local server use, gives administrators direct control over the deployment, and does not charge to unlock server-side features. Its client maturity and platform coverage can vary, so every required television, phone, browser, streaming device, and accessibility workflow must be tested rather than assumed.

Neither choice eliminates the need to understand playback. A file that direct-plays on one client may transcode on another because of codec, container, subtitle, audio, resolution, bitrate, or protocol support. Hardware acceleration is not guaranteed merely because a GPU exists. Drivers, device permissions, server configuration, client negotiation, and feature support all matter. A sound comparison therefore uses the household's real clients and representative media instead of synthetic claims or unsupported performance numbers.

A safe migration separates media payloads from application state. Media files can usually be presented to both products because both servers can scan ordinary directory structures. Plex databases, Jellyfin databases, caches, plug-ins, tokens, and configuration files are product-specific. Copying one product's database into the other's application-data directory is not a migration method. The replacement server should receive its own clean application-data path and build its catalog through supported scanning and metadata mechanisms. Preserve the original server's application data as a restorable backup before making changes.

The media path should initially be treated as immutable. If both servers can write artwork, rename files, create sidecars, delete content, or allow plug-ins to modify the library, a comparison can become an uncontrolled multi-writer event. During evaluation, grant the candidate server read access to media and write access only to its own application-data, transcode, and cache locations. If sidecar writing is a requirement, introduce it only after testing the behavior on a separate sample library and documenting which application is authoritative.

Begin with an inventory. Record every library, source path, server-visible path, naming convention, user, managed profile, restriction, client, remote-access route, plug-in, automation integration, subtitle preference, hardware-acceleration dependency, and backup location. Classify each item as portable, reproducible, manually recreated, or not transferable. Media files and carefully managed sidecars are usually portable. Users, watched status, playlists, collections, sharing relationships, and plug-in state require special attention. Community tools or synchronization services may help with selected state, but their behavior, privacy model, user mapping, and version compatibility must be tested. A migration plan must not promise complete state preservation unless it has been demonstrated on the actual deployment.

Use a parallel-run sequence: back up the source application state; record a media integrity manifest; deploy the candidate with isolated application state; map the same media read-only; scan a representative sample; test identification, subtitles, direct play, remuxing, required transcodes, user restrictions, and each important client; compare library counts while investigating rather than blindly correcting differences; then scan the full library. Keep remote exposure disabled or tightly restricted during this phase. Cut over only when documented acceptance criteria pass. Preserve the old service and its configuration in a stopped or nonauthoritative state for a defined rollback window. A rollback is successful only if clients can return to the old service, the old application data remains usable, and no candidate-server action has damaged or reorganized the source media.

Library counts alone are not proof of correctness. Extras, merged editions, multipart items, specials, duplicates, unsupported files, and different metadata-provider decisions can produce legitimate count differences. Verification should combine file manifests, spot checks, unmatched-item review, user tests, client tests, and log review. The migration is complete when the desired service works for the household's actual requirements, backups are tested, exposure is intentional, and the retired service is handled according to a documented retention decision.

## Architecture

### components
### name
Source media storage

### role
Holds media payloads and approved sidecars. It remains unchanged during the lab and should be read-only to a candidate server during an initial real migration.
### name
Plex application state

### role
Contains Plex-specific databases, preferences, artwork caches, tokens, and plug-in or agent state.
### name
Jellyfin application state

### role
Contains Jellyfin-specific configuration, databases, metadata caches, plug-ins, and authentication state.
### name
Candidate clients

### role
Represent every browser, television, mobile device, streaming appliance, or accessibility workflow that must function after cutover.
### name
Administrative access path

### role
Provides restricted management access while the candidate service is being evaluated.
### name
Backup repository

### role
Stores a consistent backup of source application data, migration records, integrity manifests, and recovery instructions.

### data_flow
Media storage is presented to the active server and, during evaluation, to the candidate server without changing the underlying media path structure.
Each server writes only to its own application-data, cache, and transcode locations.
Clients first test the candidate through a restricted evaluation path.
After acceptance, normal client traffic is redirected to the candidate while the source remains available for the rollback window.
Integrity manifests and test records provide evidence that media payloads were not altered during evaluation.

### migration_boundaries
Do not place Plex and Jellyfin application state in the same directory.
Do not assume watched state, playlists, collections, users, or sharing permissions are natively portable.
Do not permit two metadata managers to make uncontrolled sidecar changes.
Do not retire the source until backups and rollback steps have been verified.

## Required reading

- Plex Support: Naming and Organizing Your Movie Media Files — https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/
- Plex Support: Naming and Organizing Your TV Show Files — https://support.plex.tv/articles/naming-and-organizing-your-tv-show-files/
- Plex Support: Backing Up Plex Media Server Data — https://support.plex.tv/articles/201539237-backing-up-plex-media-server-data/
- Jellyfin Documentation: Libraries — https://jellyfin.org/docs/general/server/libraries/
- Jellyfin Documentation: Backup and Restore — https://jellyfin.org/docs/general/administration/backup-and-restore/
- Jellyfin Documentation: Hardware Acceleration — https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/

## References

- Plex Support, Plex Media Server documentation — https://support.plex.tv/articles/categories/plex-media-server/
- Plex Support, Backing Up Plex Media Server Data — https://support.plex.tv/articles/201539237-backing-up-plex-media-server-data/
- Plex Support, Naming and Organizing Your Movie Media Files — https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/
- Plex Support, Naming and Organizing Your TV Show Files — https://support.plex.tv/articles/naming-and-organizing-your-tv-show-files/
- Jellyfin Documentation, Administration — https://jellyfin.org/docs/general/administration/
- Jellyfin Documentation, Libraries — https://jellyfin.org/docs/general/server/libraries/
- Jellyfin Documentation, Backup and Restore — https://jellyfin.org/docs/general/administration/backup-and-restore/
- Jellyfin Documentation, Hardware Acceleration — https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/
- Jellyfin Project Source Repository — https://github.com/jellyfin/jellyfin

# Class 59: Plex versus Jellyfin and Safe Migration

**Learning objective:** Explain the major operational, licensing, authentication, client, and administration differences between Plex and Jellyfin.; Distinguish portable media assets from product-specific application state.; Create a migration inventory covering users, libraries, paths, metadata behavior, clients, remote access, and transcoding requirements.; Design a parallel-run migration that does not permit both servers to make uncontrolled changes to the same media library.; Verify source-media integrity with manifests before and after a migration rehearsal.; Define explicit acceptance criteria, cutover criteria, and rollback triggers.; Explain why copying a Plex database directly into Jellyfin is not a supported migration strategy.; Apply least-privilege and exposure-reduction principles during evaluation and cutover.
**Bloom level:** Understand / Apply
**Track:** Media Services · **Difficulty:** intermediate · **Duration:** ~120 minutes · **Lab risk:** low
**Build output:** Compare Plex and Jellyfin without treating either platform as universally superior, then design and rehearse a reversible migration that preserves source media, separates application state, validates library behavior, and provides a clear rollback path.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-02-20
**Compatibility:** ### lab_platform
Linux environment with POSIX shell utilities, GNU-compatible find behavior, sha256sum, tar, grep, diff, and permission to write under /opt/lab-classroom/class59/.

### plex
Concepts apply broadly to supported Plex Media Server deployments, but backup procedures, features, account behavior, and client capabilities must be checked against the installed version and current official documentation.

### jellyfin
Concepts apply broadly to supported Jellyfin deployments, but library behavior, plug-in compatibility, hardware acceleration, and client capabilities vary by release and platform.

### containers
For container deployments, server-visible media paths, device mappings, user identity, application-data volumes, and read-only media settings must be validated inside the container namespace.

### limitations
The lab does not test actual media decoding, client support, metadata providers, account transfer, remote access, or hardware acceleration. Those require a controlled trial using authorized media and the household's real devices.

## Learning objective

- Explain the major operational, licensing, authentication, client, and administration differences between Plex and Jellyfin.
- Distinguish portable media assets from product-specific application state.
- Create a migration inventory covering users, libraries, paths, metadata behavior, clients, remote access, and transcoding requirements.
- Design a parallel-run migration that does not permit both servers to make uncontrolled changes to the same media library.
- Verify source-media integrity with manifests before and after a migration rehearsal.
- Define explicit acceptance criteria, cutover criteria, and rollback triggers.
- Explain why copying a Plex database directly into Jellyfin is not a supported migration strategy.
- Apply least-privilege and exposure-reduction principles during evaluation and cutover.

## Why this matters

Compare Plex and Jellyfin without treating either platform as universally superior, then design and rehearse a reversible migration that preserves source media, separates application state, validates library behavior, and provides a clear rollback path.

## Prerequisites

- Basic familiarity with Linux paths, file ownership, service accounts, and media library organization.
- Understanding of containers or system services is helpful but not required for the simulation lab.
- A writable /opt/lab-classroom/class59/ path, or permission to create it.
- Familiarity with the difference between media files, sidecar metadata, application databases, caches, and configuration files.
- No production Plex or Jellyfin instance is required. The lab intentionally uses simulated application state.

## Required reading

- Plex Support: Naming and Organizing Your Movie Media Files — https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/
- Plex Support: Naming and Organizing Your TV Show Files — https://support.plex.tv/articles/naming-and-organizing-your-tv-show-files/
- Plex Support: Backing Up Plex Media Server Data — https://support.plex.tv/articles/201539237-backing-up-plex-media-server-data/
- Jellyfin Documentation: Libraries — https://jellyfin.org/docs/general/server/libraries/
- Jellyfin Documentation: Backup and Restore — https://jellyfin.org/docs/general/administration/backup-and-restore/
- Jellyfin Documentation: Hardware Acceleration — https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

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

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Create a migration inventory for a real or hypothetical household listing libraries, paths, users, clients, restrictions, plug-ins, automations, remote-access needs, and backup locations.
Select at least ten representative media cases, including subtitles, a high-resolution item, multiple audio tracks, an episode, a movie, and any format important to the household. State what each test is intended to prove without inventing performance results.
Write five mandatory acceptance criteria and five rollback triggers. Make each one observable rather than subjective.
Classify watched state, playlists, collections, users, posters, subtitles, and sidecars as portable, reproducible, manually recreated, or requiring further research.
Draw a production architecture showing media storage, separate application-state locations, clients, administrative access, backup storage, and the intended remote-access boundary.
Document how the source service will be preserved during the rollback window and how simultaneous metadata writes will be prevented.

## Feynman teach-back

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

## Retrieval check

1. 1. Why should Plex and Jellyfin use separate application-data directories during a migration?
2. 2. Which migration asset is generally more portable: the media files or the Plex internal database, and why?
3. 3. What is the safest initial access mode for the candidate server's media mapping?
4. 4. Name four categories of state that may not transfer automatically between Plex and Jellyfin.
5. 5. Why is an equal library item count insufficient evidence of a successful migration?
6. 6. What conditions can cause one client to direct-play a file while another client requests transcoding?
7. 7. What is the purpose of creating both a checksum manifest and a path manifest?
8. 8. When should the source media server be retired?
9. 9. Why should remote exposure normally be delayed during candidate evaluation?
10. 10. What makes a rollback trigger useful rather than merely aspirational?

## Guided lab

### name
Rehearse a reversible media-server migration with immutable source evidence

### scope
This lab simulates media, application state, migration evidence, acceptance criteria, cutover, and rollback. It does not install, start, stop, expose, or modify a real Plex or Jellyfin service. Every file-system mutation is confined to /opt/lab-classroom/class59/.

### scenario
A household currently uses Plex and is evaluating Jellyfin. The household wants to preserve media, test required capabilities, and retain a reliable return path. You will create a miniature source library, record its integrity, back up simulated source state, define candidate mappings, evaluate explicit acceptance criteria, and perform a reversible logical cutover.

### steps
### step
1

### title
Create the isolated classroom structure

### commands
install -d /opt/lab-classroom/class59/media/Movies/Example_Movie_2024
install -d /opt/lab-classroom/class59/media/Shows/Example_Show/Season_01
install -d /opt/lab-classroom/class59/appdata/plex
install -d /opt/lab-classroom/class59/appdata/jellyfin
install -d /opt/lab-classroom/class59/backups
install -d /opt/lab-classroom/class59/evidence
install -d /opt/lab-classroom/class59/decision

### explanation
Separate media, source state, candidate state, backups, evidence, and cutover decisions. This models the boundaries required in production.
### step
2

### title
Create harmless simulated media and source state

### commands
printf '%s\n' 'simulated movie payload' > /opt/lab-classroom/class59/media/Movies/Example_Movie_2024/Example_Movie_2024.media
printf '%s\n' 'simulated episode one payload' > /opt/lab-classroom/class59/media/Shows/Example_Show/Season_01/Example_Show_S01E01.media
printf '%s\n' 'simulated English subtitles' > /opt/lab-classroom/class59/media/Shows/Example_Show/Season_01/Example_Show_S01E01.en.srt
printf '%s\n' 'server=plex' 'library_movies=/media/Movies' 'library_shows=/media/Shows' 'sidecar_writes=disabled' > /opt/lab-classroom/class59/appdata/plex/preferences.env
printf '%s\n' 'alice,administrator,watched-state-present' 'sam,restricted-user,watched-state-present' > /opt/lab-classroom/class59/appdata/plex/users.csv
printf '%s\n' 'active_service=plex' > /opt/lab-classroom/class59/decision/active-service.env
cp -a /opt/lab-classroom/class59/decision/active-service.env /opt/lab-classroom/class59/decision/active-service.before

### explanation
The media files contain text rather than copyrighted or playable content. The source-state files illustrate information that must be inventoried even though they are not importable Jellyfin databases.
### step
3

### title
Capture the pre-migration media integrity manifest

### commands
find /opt/lab-classroom/class59/media -type f -exec sha256sum '{}' + | sort > /opt/lab-classroom/class59/evidence/media-before.sha256
find /opt/lab-classroom/class59/media -type f -printf '%P\n' | sort > /opt/lab-classroom/class59/evidence/media-paths-before.txt

### explanation
The checksum manifest detects content changes, while the path manifest detects additions, removals, or renames.
### step
4

### title
Back up simulated Plex application state

### commands
tar -C /opt/lab-classroom/class59 -czf /opt/lab-classroom/class59/backups/plex-appdata.tgz appdata/plex
sha256sum /opt/lab-classroom/class59/backups/plex-appdata.tgz > /opt/lab-classroom/class59/evidence/plex-backup.sha256
tar -tzf /opt/lab-classroom/class59/backups/plex-appdata.tgz > /opt/lab-classroom/class59/evidence/plex-backup-contents.txt

### explanation
A backup is not trusted merely because an archive exists. Record its checksum and inspect its member list. A production backup should follow the source product's consistency guidance.
### step
5

### title
Define isolated Jellyfin candidate state and path mappings

### commands
printf '%s\n' 'server=jellyfin' 'library_movies=/media/Movies' 'library_shows=/media/Shows' 'media_access=read-only' 'sidecar_writes=disabled' > /opt/lab-classroom/class59/appdata/jellyfin/candidate.env
printf '%s\n' 'Plex,/media/Movies,Movies,source' 'Plex,/media/Shows,Shows,source' 'Jellyfin,/media/Movies,Movies,candidate' 'Jellyfin,/media/Shows,Shows,candidate' > /opt/lab-classroom/class59/evidence/library-mappings.csv
printf '%s\n' 'alice,must-be-created,administrator,manual-validation-required' 'sam,must-be-created,restricted-user,manual-validation-required' > /opt/lab-classroom/class59/evidence/user-migration.csv

### explanation
The candidate receives fresh application state but the same server-visible media paths. User identities and restrictions are explicitly recreated and validated rather than assumed to transfer.
### step
6

### title
Record acceptance criteria

### commands
printf '%s\n' 'PASS|Media paths are unchanged' 'PASS|Candidate application state is isolated' 'PASS|Candidate media access is designated read-only' 'REVIEW|Every required client has been tested' 'REVIEW|Representative direct-play behavior has been tested' 'REVIEW|Required transcoding has been tested' 'REVIEW|User restrictions have been tested' 'REVIEW|Watched-state disposition has been approved' 'REVIEW|Remote-access design has been reviewed' 'PASS|Source backup archive can be listed' > /opt/lab-classroom/class59/evidence/acceptance-checklist.txt
printf '%s\n' 'Rollback if a required client cannot play representative media.' 'Rollback if user restrictions fail.' 'Rollback if source media changes unexpectedly.' 'Rollback if authentication or remote access behaves contrary to the approved design.' 'Rollback if the source application backup cannot be validated.' > /opt/lab-classroom/class59/evidence/rollback-triggers.txt

### explanation
Items requiring a real service remain marked REVIEW. A production cutover must not reinterpret those entries as passing without evidence.
### step
7

### title
Verify that the simulated media remained unchanged

### commands
find /opt/lab-classroom/class59/media -type f -exec sha256sum '{}' + | sort > /opt/lab-classroom/class59/evidence/media-after.sha256
find /opt/lab-classroom/class59/media -type f -printf '%P\n' | sort > /opt/lab-classroom/class59/evidence/media-paths-after.txt
diff -u /opt/lab-classroom/class59/evidence/media-before.sha256 /opt/lab-classroom/class59/evidence/media-after.sha256
diff -u /opt/lab-classroom/class59/evidence/media-paths-before.txt /opt/lab-classroom/class59/evidence/media-paths-after.txt

### explanation
Both comparison commands should produce no differences and return success. Content integrity and path stability are separate checks.
### step
8

### title
Perform a logical cutover only for the simulation

### commands
printf '%s\n' 'active_service=jellyfin' > /opt/lab-classroom/class59/decision/active-service.env
printf '%s\n' 'cutover_status=simulated' 'source_retained=yes' 'rollback_window=open' > /opt/lab-classroom/class59/decision/cutover-record.env
cat /opt/lab-classroom/class59/decision/active-service.env
cat /opt/lab-classroom/class59/decision/cutover-record.env

### explanation
This changes only a classroom decision record. In production, traffic changes should occur only after every mandatory acceptance criterion passes.

## Expected results

- The classroom tree contains separate media, Plex state, Jellyfin state, backup, evidence, and decision directories.
- The Plex backup archive exists, has a recorded checksum, and lists the simulated Plex files.
- The candidate configuration uses the same server-visible media paths while declaring isolated application state and read-only media access.
- The user migration record shows that accounts, roles, restrictions, and watched-state handling require explicit validation.
- The before-and-after checksum manifests match exactly.
- The before-and-after path manifests match exactly.
- The acceptance checklist distinguishes demonstrated controls from tests that still require real servers and clients.
- The final classroom decision record identifies Jellyfin as the simulated active service while retaining the source and an open rollback window.

## Verification checkpoints

- [ ] Run: test -s /opt/lab-classroom/class59/backups/plex-appdata.tgz && echo 'backup archive exists'
- [ ] Run: sha256sum -c /opt/lab-classroom/class59/evidence/plex-backup.sha256
- [ ] Run: tar -tzf /opt/lab-classroom/class59/backups/plex-appdata.tgz
- [ ] Run: diff -u /opt/lab-classroom/class59/evidence/media-before.sha256 /opt/lab-classroom/class59/evidence/media-after.sha256; no output and exit status zero indicate matching content manifests.
- [ ] Run: diff -u /opt/lab-classroom/class59/evidence/media-paths-before.txt /opt/lab-classroom/class59/evidence/media-paths-after.txt; no output and exit status zero indicate matching path manifests.
- [ ] Run: grep '^media_access=read-only$' /opt/lab-classroom/class59/appdata/jellyfin/candidate.env
- [ ] Run: grep '^sidecar_writes=disabled$' /opt/lab-classroom/class59/appdata/jellyfin/candidate.env
- [ ] Run: grep '^active_service=jellyfin$' /opt/lab-classroom/class59/decision/active-service.env
- [ ] Review every REVIEW entry in /opt/lab-classroom/class59/evidence/acceptance-checklist.txt and confirm that none would be treated as complete in a real cutover without supporting evidence.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| Creation of /opt/lab-classroom/class59 fails with a permission error. | The learner does not have permission to create content beneath /opt/lab-classroom. | Have the lab administrator pre-create /opt/lab-classroom/class59 with appropriate ownership. Do not redirect the exercise into a production application-data or media directory. |
| The media checksum comparison shows differences. | A simulated media file was edited, renamed, added, or omitted between manifest captures. | Inspect the unified difference and the path manifests. Treat unexplained production-media changes as a rollback trigger rather than regenerating the baseline to hide them. |
| The backup checksum check fails. | The archive changed after its checksum was recorded, the checksum file points to a missing path, or storage corruption occurred. | Inspect the archive and evidence paths. Recreate the classroom backup from the unchanged simulated source state and record a new checksum only after confirming why the prior evidence failed. |
| The archive cannot be listed. | Archive creation was interrupted, the file is incomplete, or the available tar implementation does not support the selected compression option. | Confirm available disk space and tar capabilities, then recreate the archive within /opt/lab-classroom/class59/backups/. In production, also perform an isolated restore test. |
| Plex and Jellyfin report different item counts during a real evaluation. | The servers may handle extras, specials, editions, multipart media, unsupported files, duplicates, or metadata matching differently. | Compare unmatched and duplicate-item reports, inspect representative directories, and reconcile differences by cause. Do not use count equality as the only success criterion. |
| A file direct-plays in one client but transcodes in another. | Client codec, container, subtitle, audio, bitrate, or protocol support differs. | Inspect playback information and server logs for the actual client. Test the household's required clients and representative media instead of generalizing from one browser. |
| Hardware acceleration is enabled but playback still uses software conversion. | The stream is not eligible, a required feature is unsupported, device access is absent, drivers are incompatible, or the selected conversion path falls back to software. | Consult current product documentation, verify device visibility and permissions, and inspect logs for the specific playback session. Do not infer acceleration solely from a configuration toggle. |
| Watched status or playlists are missing in the candidate server. | These records are product-specific and were not transferred through a tested, supported workflow. | Use the approved migration method for the specific state, validate user identity mapping, or document manual recreation. Preserve the source during the rollback window. |
| The candidate server changes artwork or sidecar files. | The candidate has write access to media or a metadata-saving option or plug-in is writing beside the files. | Stop evaluation, identify changed files from integrity evidence, restore only from verified backups when necessary, and reconfigure the candidate to prevent media-tree writes before resuming. |

## Security considerations

### principles
Run each media server under a dedicated, nonadministrative service identity.
Give the candidate read access to media and write access only to its own configuration, database, cache, and transcode locations during initial evaluation.
Keep Plex and Jellyfin application-data directories separate and prevent one service from reading the other's credentials or tokens.
Do not expose the candidate publicly merely to simplify testing. Begin on a trusted management path and add remote access only after authentication, transport security, proxy behavior, and update procedures are reviewed.
Use unique administrator credentials and separate normal viewing accounts from administrative accounts.
Treat account tokens, API keys, claim codes, database copies, and configuration backups as secrets.
Review plug-ins as third-party code with access to server state and possibly media. Minimize plug-ins and verify maintenance status before installation.
Back up configuration and databases to storage with controlled access, integrity checks, and retention appropriate to the household.
Validate child profiles, content restrictions, library visibility, and account recovery before cutover.
Review each platform's current privacy, telemetry, account, and remote-connectivity behavior directly from current vendor or project documentation.

### threats
Unauthorized remote access caused by premature exposure or weak account controls.
Credential leakage through copied application data, logs, screenshots, or insecure backups.
Media modification caused by excessive permissions or competing metadata writers.
Privilege expansion through unnecessary plug-ins or broadly privileged containers.
Loss of availability caused by retiring the source before validating clients, backups, and recovery.

## Rollback

### production_strategy
Declare rollback triggers before cutover, including failed required clients, broken user restrictions, unexpected media changes, authentication failures, or an unusable source backup.
During the rollback window, retain the source application's verified backup and original configuration.
Prevent the source and candidate from simultaneously acting as authoritative metadata writers.
Return client traffic to the source service using the documented traffic-switching method.
Confirm source authentication, library availability, direct playback, and required remote behavior.
Capture candidate logs and migration evidence before making additional changes.
Investigate and correct the candidate in isolation, then repeat acceptance testing before another cutover.

### lab_rollback_commands
cp -a /opt/lab-classroom/class59/decision/active-service.before /opt/lab-classroom/class59/decision/active-service.env
printf '%s\n' 'rollback_status=simulated' 'active_service=plex' 'candidate_retained_for_review=yes' > /opt/lab-classroom/class59/decision/rollback-record.env
cat /opt/lab-classroom/class59/decision/active-service.env
cat /opt/lab-classroom/class59/decision/rollback-record.env

### success_condition
The classroom active-service record again identifies Plex, the candidate evidence remains available for investigation, and the media integrity manifests still match.

## Video narration notes

Welcome to Class 59. Today we are comparing Plex and Jellyfin, but the larger lesson is how to replace a stateful service without risking the data it organizes. Plex and Jellyfin both catalog and stream media. Plex is a proprietary product connected to the Plex ecosystem and centralized account model. Jellyfin is a free and open-source server administered directly by its operator. Those facts influence licensing, authentication, privacy decisions, client availability, and support expectations, but they do not select a winner for every household.

Start with requirements. List every client, user, restriction, remote-access need, subtitle workflow, plug-in, and media format that matters. Test those requirements directly. Avoid assuming that a successful browser test predicts television behavior. Playback depends on the media streams and on each client's codec, container, audio, subtitle, bandwidth, and protocol capabilities.

Next, separate media from application state. The movie and episode files are portable assets. Plex databases, Jellyfin databases, caches, credentials, and configuration are not interchangeable. The candidate server receives fresh application state. It can scan the same stable media paths, but it should initially see the media as read-only. That prevents the evaluation from becoming a competition between two metadata writers.

Before scanning, back up the source application state and record media integrity evidence. A checksum manifest detects content changes. A path manifest detects renames, additions, and removals. Validate the backup instead of trusting its filename. In a production migration, follow the application's consistency guidance and perform a recovery test.

Run both services in parallel only under controlled roles. The source remains the known-good service. The candidate is restricted and tested. Recreate users and restrictions deliberately. Treat watched status, playlists, collections, and sharing relationships as separate migration questions. If a transfer utility or synchronization service is proposed, test its version compatibility, privacy model, and user mapping before relying on it.

Define acceptance criteria before cutover. Include representative playback, required clients, user restrictions, authentication, remote access, media integrity, backup validation, and operational recovery. Also define rollback triggers. A rollback trigger should be observable, such as a required client failing playback or the media manifest changing unexpectedly.

The lab models this process without touching a real service. All created files remain under the class directory. We create simulated media, isolated Plex and Jellyfin state, a source backup, integrity manifests, a path-mapping record, and an acceptance checklist. We then change a decision file to represent cutover. Because the original decision file and source state remain available, rollback is a simple, testable operation.

The final principle is reversibility. A migration is not safe because the new interface looks correct. It is safe when the source is protected, the candidate is isolated, requirements are proven, data integrity is measured, backups are usable, and returning to the previous service is still possible.

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

## Mastery gate

- [ ] Objectives demonstrated with evidence
- [ ] Feynman complete
- [ ] Quiz self-scored ≥80%
- [ ] Lab verification boxes checked
- [ ] Rollback understood

## Reflection

1. What did I learn?
2. What did I struggle with?
3. How does this connect to earlier classes?

## Spiral hook

Return to this class whenever a later service fails for identity, process, log, remote access, update, or routing reasons covered here.

# Lab: Plex versus Jellyfin and Safe Migration

**Module:** Requests & Media Servers
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain the major operational, licensing, authentication, client, and administration differences between Plex and Jellyfin.

## Before you start

- Basic familiarity with Linux paths, file ownership, service accounts, and media library organization.
- Understanding of containers or system services is helpful but not required for the simulation lab.
- A writable /opt/lab-classroom/class59/ path, or permission to create it.
- Familiarity with the difference between media files, sidecar metadata, application databases, caches, and configuration files.
- No production Plex or Jellyfin instance is required. The lab intentionally uses simulated application state.

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

## Verification

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

## Security

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

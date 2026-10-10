# Class 59: Plex versus Jellyfin and Safe Migration

**Learning objective:** Explain the major architectural and operational differences between Plex and Jellyfin.; Distinguish portable media assets from server-specific databases, metadata, artwork caches, and preferences.; Build a migration inventory before changing a production media server.; Use stable external identifiers and explicit user mappings instead of relying only on titles.; Design a parallel migration that leaves the source service and source media unchanged.; Quarantine ambiguous records rather than silently assigning them to the wrong media item.; Verify library counts, identity matches, watched state, resume positions, permissions, and playback before cutover.; Define clear rollback criteria and retain the old server until the migration has been accepted.
**Bloom level:** Understand / Apply
**Track:** Media Services and Data Migration · **Difficulty:** intermediate · **Duration:** ~120 minutes · **Lab risk:** low
**Build output:** Compare Plex and Jellyfin as self-hosted media platforms, identify migration boundaries, and practice a staged migration workflow that preserves the source system, matches media through stable identifiers, quarantines ambiguous records, and provides a tested rollback path.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### lesson_scope
The concepts and isolated Python lab are product-version neutral. Production database locations, APIs, metadata behavior, account capabilities, plugin compatibility, backup procedures, and client features can change between releases.

### lab_platforms
Linux host with Python 3 and write access to /opt/lab-classroom/class59/.
A shell capable of processing the shown here-document syntax.

### production_validation
Consult documentation for the exact installed Plex and Jellyfin versions.
Use supported backup and restore methods for each product.
Test current clients and representative media rather than assuming codec compatibility.
Validate hardware acceleration with the actual host, device, driver, container runtime, and media workload.
Review any migration utility's source, supported versions, matching policy, authentication requirements, and rollback behavior before use.

### limitations
The lab creates a migration plan but does not call Plex or Jellyfin APIs, modify a live database, test real media decoding, or claim that all watch-state fields can be transferred between all versions.

## Learning objective

- Explain the major architectural and operational differences between Plex and Jellyfin.
- Distinguish portable media assets from server-specific databases, metadata, artwork caches, and preferences.
- Build a migration inventory before changing a production media server.
- Use stable external identifiers and explicit user mappings instead of relying only on titles.
- Design a parallel migration that leaves the source service and source media unchanged.
- Quarantine ambiguous records rather than silently assigning them to the wrong media item.
- Verify library counts, identity matches, watched state, resume positions, permissions, and playback before cutover.
- Define clear rollback criteria and retain the old server until the migration has been accepted.

## Why this matters

Compare Plex and Jellyfin as self-hosted media platforms, identify migration boundaries, and practice a staged migration workflow that preserves the source system, matches media through stable identifiers, quarantines ambiguous records, and provides a tested rollback path.

## Prerequisites

- Basic familiarity with Linux files, directories, users, groups, and permissions.
- Basic understanding of containers or system services, although this lab does not modify either.
- Familiarity with media libraries, seasons, episodes, subtitles, watch state, and resume position.
- Python 3 installed on the lab host.
- Write access to /opt/lab-classroom/class59/.

## Required reading

- Plex Support: Naming and Organizing Your TV Show Files — https://support.plex.tv/articles/naming-and-organizing-your-tv-show-files/
- Plex Support: Naming and Organizing Your Movie Media Files — https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/
- Plex Support: Move Media Content to a New Location — https://support.plex.tv/articles/201154537-move-media-content-to-a-new-location/
- Jellyfin Documentation: Movies — https://jellyfin.org/docs/general/server/media/movies/
- Jellyfin Documentation: Shows — https://jellyfin.org/docs/general/server/media/shows/
- Jellyfin Documentation: Backup and Restore — https://jellyfin.org/docs/general/administration/backup-and-restore/

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| Media asset | The movie, episode, music, subtitle, image, or other content file that a media server indexes and serves. |
| Metadata | Descriptive information such as title, release year, cast, synopsis, season number, external identifiers, and artwork. |
| Watch state | A user-specific indication that an item has been played or completed. |
| Resume position | A user-specific playback offset used to continue an unfinished item. |
| External identifier | A stable identifier issued by a metadata provider, such as a TMDB or TVDB identifier, that can help match the same work across systems. |
| Sidecar | A file stored beside media, such as a subtitle, poster, NFO document, or chapter file. |
| Direct play | Playback in which the client consumes the stored media streams without server-side conversion. |
| Direct stream | Playback in which streams may be repackaged into another container without fully converting their codecs. |
| Transcoding | Server-side conversion of one or more media streams to satisfy client, bandwidth, container, codec, or subtitle constraints. |
| Parallel migration | A migration in which the old and new servers coexist temporarily so that the new system can be tested without destroying the known-good source. |
| Quarantine | A review queue for records that cannot be matched safely and automatically. |
| Cutover | The controlled point at which users are directed to the replacement service. |

## Instruction

Plex and Jellyfin solve the same broad problem: they catalog media, retrieve or store metadata, track user activity, and deliver content to clients. They are not, however, interchangeable database front ends. Plex uses its own database schema, metadata agents, account model, application ecosystem, and cached metadata layout. Jellyfin uses its own database, configuration, metadata providers, user records, and client ecosystem. Copying one product's database into the other product's data directory is therefore not a supported migration strategy. The most portable part of a media environment is normally the media itself, especially when files use predictable names and useful sidecars. Server-specific databases, internal item identifiers, generated thumbnails, cached artwork, plugin state, and authentication data require separate treatment.

Plex commonly emphasizes a polished hosted-account experience, broad commercial client availability, and integrated discovery features. Some capabilities or client behaviors may depend on the current Plex account and product model. Jellyfin emphasizes an open-source server, local administrative control, and an ecosystem in which the operator is responsible for deployment, updates, exposure, certificates, storage, and client selection. Neither platform is automatically safer, faster, or more compatible in every homelab. Results depend on clients, codecs, subtitle formats, storage latency, hardware acceleration support, network conditions, and configuration. A migration decision should therefore be based on required clients, operational ownership, privacy expectations, remote-access design, administration effort, and tested playback behavior rather than ideology alone.

A safe migration begins with inventory. Record library roots, media counts by type, naming exceptions, sidecars, user accounts, watched items, resume positions, playlists, collections, custom posters, metadata-provider identifiers, playback devices, and any automation that can rename or write into media directories. Back up the source application's supported data set and verify that the backup can be read. Do not treat the existence of an archive as proof of recoverability. Record ownership and access requirements separately because a replacement process may run under a different numeric user or group identity.

The preferred migration pattern is parallel and reversible. Keep the source server intact. Present the media to the destination without allowing both systems to rewrite the same sidecars or rename the same files. Build small pilot libraries first. Confirm item identity, season ordering, subtitle selection, audio tracks, artwork, and representative playback. Transcoding must be tested with actual client profiles; a successful server start does not prove that device access or codec conversion works. During state transfer, match items using stable external identifiers plus episode coordinates where available. Title-only matching is unsafe because remakes, alternate titles, editions, and regional naming can collide. Map users explicitly because a display name is not necessarily a stable identity. Any record with no unique match belongs in quarantine for manual review.

Cutover should use written acceptance criteria. Examples include all expected library roots being present, known naming exceptions being resolved, selected clients completing playback, intended users being able to authenticate, and sampled watch states matching the source. Keep the source available but administratively frozen during the acceptance window so state does not diverge. Rollback means redirecting users to the unchanged source, not attempting an emergency reverse conversion of a partially modified destination. Retire the source only after backups, validation evidence, and stakeholder acceptance establish that the destination is the new system of record.

## Architecture

### components
### name
Source Plex server

### role
Known-good source of library configuration and user activity. It remains unchanged during the migration.
### name
Shared or replicated media storage

### role
Holds media assets and approved sidecars. The destination initially receives non-destructive access.
### name
Destination Jellyfin server

### role
Builds its own library database and metadata cache from the available media.
### name
Migration workspace

### role
Stores inventories, user mappings, exported neutral records, conversion plans, verification reports, and quarantine records.
### name
Clients

### role
Provide real compatibility evidence for direct play, subtitle handling, audio selection, and transcoding.

### data_flow
Inventory the source configuration, users, libraries, media naming, and state.
Back up the source using its supported backup process.
Expose or replicate media for the destination without changing the source media.
Allow Jellyfin to build its own database rather than copying the Plex database.
Match neutral state records to destination items using external identifiers and explicit user mappings.
Place unmatched or multiply matched records in quarantine.
Validate representative clients and compare sampled state.
Cut over only after acceptance; otherwise select the unchanged source again.

### trust_boundaries
Administrative interfaces must be treated as privileged control planes.
Media clients should not receive write access to server configuration or migration exports.
Migration exports may reveal usernames, viewing history, filenames, and library structure.
Hardware acceleration devices grant additional host capabilities and should be exposed only when required.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Create a written inventory template for your own environment covering library roots, item counts, sidecars, users, playlists, collections, clients, codecs, subtitles, hardware acceleration, and automation.
Define five measurable acceptance criteria for a Plex-to-Jellyfin or Jellyfin-to-Plex migration without inventing performance targets.
Design a user-mapping table that uses stable source and destination identities and includes an approval column.
List three examples that must enter quarantine rather than being automatically matched.
Draft a cutover schedule with a pilot period, state freeze, final reconciliation, acceptance window, and rollback decision point.
Research the currently supported backup and state-transfer options for the exact Plex and Jellyfin versions you operate, then record the documentation date and limitations.

## Feynman teach-back

### prompt
Explain the migration to a family member who understands streaming but not databases.

### model_explanation
The video files are like books, while Plex and Jellyfin are two different librarians with different card catalogs. Moving the books does not move each librarian's notes about covers, users, bookmarks, or what someone finished reading. We let the new librarian inspect the same books and build a new catalog. We then copy bookmarks only when a reliable book number proves which title they belong to. If the number is missing or points to more than one item, we put that bookmark aside for a person to review. We keep the old librarian working until the new catalog, clients, and bookmarks have been checked. If the test fails, everyone returns to the old librarian because its catalog was never destroyed.

### check_questions
Why is a server database not equivalent to the media files?
Why is title-only matching unsafe?
Why does keeping the source unchanged make rollback simpler?
Why must playback be tested on representative clients rather than only in a browser?

## Retrieval check

1. 1. Why should a Plex database not be copied directly into a Jellyfin data directory?
2. 2. Which matching method is safer: title-only matching or a unique external identifier combined with episode coordinates, and why?
3. 3. What is the main operational advantage of a parallel migration?
4. 4. Why should the destination initially avoid write access to shared media?
5. 5. What should happen when a source state record has no stable identifier or has multiple destination matches?
6. 6. Name four categories that should be included in a pre-migration inventory.
7. 7. Why does successful playback on one client not establish compatibility for every client?
8. 8. What is the difference between backing up data and verifying recoverability?
9. 9. When should the source server be retired?
10. 10. In the lab, why is the watched movie assigned a zero resume position while the unfinished episode retains 812 seconds?

## Guided lab

### goal
Create a neutral migration workspace, validate sample naming, convert sample watch-state records through explicit identity mappings, quarantine an unmatched record, and demonstrate a non-destructive rollback selection.

### safety_boundary
Every command in this lab creates or updates files only beneath /opt/lab-classroom/class59/. The lab does not install software, alter services, contact production servers, or modify real media.

### steps
### step
1

### title
Create the isolated fixture and source records

### commands
mkdir -p /opt/lab-classroom/class59/
python3 - <<'PY'
from pathlib import Path
import json
root = Path('/opt/lab-classroom/class59')
for name in ('source', 'destination', 'reports', 'rollback'):
    (root / name).mkdir(parents=True, exist_ok=True)
media_inventory = [
    {'path': 'Movies/Arrival (2016)/Arrival (2016).mkv', 'kind': 'movie', 'title': 'Arrival', 'year': 2016, 'external_ids': {'tmdb': '329865'}},
    {'path': 'TV/Example Show (2020)/Season 01/Example Show (2020) - S01E01 - Pilot.mkv', 'kind': 'episode', 'title': 'Example Show', 'year': 2020, 'season': 1, 'episode': 1, 'external_ids': {'tvdb': '73244'}},
    {'path': 'Movies/Unclear/Unclear.mkv', 'kind': 'movie', 'title': 'Unclear', 'year': None, 'external_ids': {}}
]
source_state = [
    {'source_user_id': 'plex-alex', 'item': {'kind': 'movie', 'external_ids': {'tmdb': '329865'}}, 'watched': True, 'resume_seconds': 0},
    {'source_user_id': 'plex-alex', 'item': {'kind': 'episode', 'external_ids': {'tvdb': '73244'}, 'season': 1, 'episode': 1}, 'watched': False, 'resume_seconds': 812},
    {'source_user_id': 'plex-alex', 'item': {'kind': 'movie', 'source_internal_id': 'legacy-77', 'external_ids': {}}, 'watched': True, 'resume_seconds': 0}
]
target_catalog = [
    {'target_item_id': 'jf-movie-100', 'kind': 'movie', 'external_ids': {'tmdb': '329865'}},
    {'target_item_id': 'jf-episode-200', 'kind': 'episode', 'external_ids': {'tvdb': '73244'}, 'season': 1, 'episode': 1}
]
user_map = {'plex-alex': 'jellyfin-alex'}
(root / 'source' / 'media-inventory.json').write_text(json.dumps(media_inventory, indent=2) + '\n', encoding='utf-8')
(root / 'source' / 'watch-state.json').write_text(json.dumps(source_state, indent=2) + '\n', encoding='utf-8')
(root / 'destination' / 'catalog.json').write_text(json.dumps(target_catalog, indent=2) + '\n', encoding='utf-8')
(root / 'destination' / 'user-map.json').write_text(json.dumps(user_map, indent=2) + '\n', encoding='utf-8')
(root / 'rollback' / 'active-server.json').write_text(json.dumps({'selected': 'plex-source', 'reason': 'initial known-good selection'}, indent=2) + '\n', encoding='utf-8')
PY
### step
2

### title
Generate an inventory quality report

### commands
python3 - <<'PY'
from pathlib import Path
import json
root = Path('/opt/lab-classroom/class59')
items = json.loads((root / 'source' / 'media-inventory.json').read_text(encoding='utf-8'))
issues = []
for item in items:
    if item.get('year') is None:
        issues.append({'path': item['path'], 'issue': 'missing_year'})
    if not item.get('external_ids'):
        issues.append({'path': item['path'], 'issue': 'missing_external_identifier'})
report = {
    'item_count': len(items),
    'movie_count': sum(i['kind'] == 'movie' for i in items),
    'episode_count': sum(i['kind'] == 'episode' for i in items),
    'issues': issues
}
(root / 'reports' / 'inventory-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
PY
### step
3

### title
Create a deterministic state-import plan

### commands
python3 - <<'PY'
from pathlib import Path
import json
root = Path('/opt/lab-classroom/class59')
source = json.loads((root / 'source' / 'watch-state.json').read_text(encoding='utf-8'))
catalog = json.loads((root / 'destination' / 'catalog.json').read_text(encoding='utf-8'))
user_map = json.loads((root / 'destination' / 'user-map.json').read_text(encoding='utf-8'))

def key(item):
    ids = item.get('external_ids', {})
    if item.get('kind') == 'movie' and ids.get('tmdb'):
        return ('movie', 'tmdb', ids['tmdb'])
    if item.get('kind') == 'episode' and ids.get('tvdb') and item.get('season') is not None and item.get('episode') is not None:
        return ('episode', 'tvdb', ids['tvdb'], int(item['season']), int(item['episode']))
    return None

index = {}
for target in catalog:
    target_key = key(target)
    if target_key is not None:
        index.setdefault(target_key, []).append(target)

actions = []
quarantine = []
for record in source:
    target_user = user_map.get(record['source_user_id'])
    record_key = key(record['item'])
    candidates = index.get(record_key, []) if record_key is not None else []
    if target_user is None:
        quarantine.append({'record': record, 'reason': 'unmapped_user'})
    elif record_key is None:
        quarantine.append({'record': record, 'reason': 'no_stable_item_key'})
    elif len(candidates) != 1:
        quarantine.append({'record': record, 'reason': 'target_match_count_' + str(len(candidates))})
    else:
        actions.append({
            'target_user_id': target_user,
            'target_item_id': candidates[0]['target_item_id'],
            'set_watched': bool(record['watched']),
            'set_resume_seconds': 0 if record['watched'] else int(record['resume_seconds']),
            'match_key': list(record_key)
        })
plan = {'policy': 'unique stable identifiers only', 'actions': actions, 'quarantine': quarantine}
(root / 'destination' / 'state-import-plan.json').write_text(json.dumps(plan, indent=2) + '\n', encoding='utf-8')
(root / 'reports' / 'state-summary.json').write_text(json.dumps({'planned_actions': len(actions), 'quarantined_records': len(quarantine)}, indent=2) + '\n', encoding='utf-8')
PY
### step
4

### title
Verify the plan without applying it to a server

### commands
python3 - <<'PY'
from pathlib import Path
import json
root = Path('/opt/lab-classroom/class59')
report = json.loads((root / 'reports' / 'inventory-report.json').read_text(encoding='utf-8'))
plan = json.loads((root / 'destination' / 'state-import-plan.json').read_text(encoding='utf-8'))
assert report['item_count'] == 3
assert report['movie_count'] == 2
assert report['episode_count'] == 1
assert len(report['issues']) == 2
assert len(plan['actions']) == 2
assert len(plan['quarantine']) == 1
assert plan['quarantine'][0]['reason'] == 'no_stable_item_key'
assert any(a['target_item_id'] == 'jf-movie-100' and a['set_watched'] is True for a in plan['actions'])
assert any(a['target_item_id'] == 'jf-episode-200' and a['set_resume_seconds'] == 812 for a in plan['actions'])
print('class59 verification passed')
PY
### step
5

### title
Exercise logical cutover and rollback markers

### commands
python3 - <<'PY'
from pathlib import Path
import json
root = Path('/opt/lab-classroom/class59')
marker = root / 'rollback' / 'active-server.json'
marker.write_text(json.dumps({'selected': 'jellyfin-destination', 'reason': 'simulated acceptance'}, indent=2) + '\n', encoding='utf-8')
marker.write_text(json.dumps({'selected': 'plex-source', 'reason': 'simulated rollback; source remained unchanged'}, indent=2) + '\n', encoding='utf-8')
print(json.loads(marker.read_text(encoding='utf-8')))
PY

## Expected results

- The workspace contains source, destination, reports, and rollback directories beneath /opt/lab-classroom/class59/.
- The inventory report records three fixture items: two movies and one episode.
- The inventory report records two quality issues for the intentionally ambiguous movie: a missing year and a missing external identifier.
- The state import plan contains exactly two actions based on unique stable identifiers.
- The watched movie action resets its resume position to zero according to the lab policy.
- The unfinished episode action preserves a resume position of 812 seconds.
- The record containing only a source-internal identifier is quarantined instead of being matched by title or guesswork.
- The final active-server marker selects the unchanged Plex source, demonstrating logical rollback.

## Verification checkpoints

- [ ] Run the verification command in lab step 4 and confirm that it prints: class59 verification passed
- [ ] Read /opt/lab-classroom/class59/reports/inventory-report.json and confirm item_count is 3, movie_count is 2, and episode_count is 1.
- [ ] Read /opt/lab-classroom/class59/reports/state-summary.json and confirm planned_actions is 2 and quarantined_records is 1.
- [ ] Read /opt/lab-classroom/class59/destination/state-import-plan.json and confirm every planned action contains a target user, target item, and match key.
- [ ] Confirm that no action was generated for source_internal_id legacy-77.
- [ ] Read /opt/lab-classroom/class59/rollback/active-server.json and confirm selected is plex-source.
- [ ] Confirm that all files produced by the lab reside beneath /opt/lab-classroom/class59/.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The first command reports permission denied. | The current account cannot create or write to /opt/lab-classroom/class59/. | Have the lab administrator provision the required directory with appropriate ownership before repeating the lab. Do not redirect the exercise into a production application directory. |
| The shell reports that python3 is not found. | Python 3 is not installed or is not available through the current command search path. | Use a lab host that satisfies the prerequisite or have the administrator install Python 3 through the platform's approved package-management process. |
| The verification reports a different action or quarantine count. | One or more fixture JSON files were edited, or a previous experiment changed the matching inputs. | Repeat step 1 to recreate the canonical fixtures, then repeat steps 2 through 4. |
| A real migration produces many unmatched records. | External identifiers are absent, metadata providers disagree, episode coordinates differ, or the destination scan has not completed. | Pause automatic application, inspect representative records, correct naming and provider mappings, rescan the pilot library, and keep unresolved records in quarantine. |
| A title appears twice after destination scanning. | Two library roots overlap, the same storage is mounted at multiple paths, or an edition was not distinguished. | Review destination library roots and naming. Remove overlap from the destination configuration only after confirming which path is canonical. |
| Watch state is assigned to the wrong user. | Users were mapped by display name rather than by an explicit reviewed mapping. | Stop the import, restore the destination from its pre-import backup, and rebuild the user mapping with unique source and destination identities. |
| Playback works on one client but transcodes or fails on another. | The clients support different containers, codecs, subtitle formats, audio formats, or bandwidth profiles. | Test each required client class with representative files and inspect the server's playback decision. Do not infer universal compatibility from one client. |
| The destination can list media but cannot play it. | The destination process has directory traversal permission but lacks file-read permission, or its storage path differs from the configured library path. | Compare the destination process identity, directory traversal rights, file-read rights, and configured mount path without changing the source server. |

## Security considerations

### principles
Treat media-server administration as privileged access and separate it from ordinary playback accounts.
Protect exports because filenames, usernames, viewing history, and resume positions can reveal sensitive personal information.
Use unique accounts and least privilege for the destination service.
Give the destination only the storage access it needs. Initial pilot access should not permit media deletion or renaming.
Do not expose both systems broadly merely to simplify migration testing.
Review third-party plugins independently; a plugin inherits access to some combination of application data, user activity, and media.
Store backups separately from the live application data and test restoration before cutover.
Avoid placing credentials, access tokens, session material, or complete production exports in the classroom workspace.

### migration_controls
Freeze metadata-writing automation during final reconciliation.
Record who approved user mappings and quarantined-record decisions.
Create a destination backup immediately before applying imported state.
Retain logs that identify the migration policy and input export version without publishing secrets.
Revoke temporary migration credentials after acceptance.

### privacy_notes
Plex and Jellyfin have different account, discovery, telemetry, and remote-access models that may change over time. Review the current product documentation and settings rather than assuming defaults. A self-hosted destination still depends on the operator to secure accounts, updates, transport protection, storage, backups, and external access.

## Rollback

### strategy
The primary rollback mechanism is preservation of the original Plex system. The destination builds a separate database, the source media is not renamed or deleted, and migration output is staged as a plan before any real API application.

### preconditions
Create and validate a supported source backup before production work.
Create a destination backup before importing user state.
Document the original library paths and access model.
Prevent both systems from making conflicting sidecar changes.
Define the acceptance window and the person authorized to choose rollback.

### triggers
Incorrect user-to-user mapping.
Material numbers of unmatched or wrongly matched items.
Loss of required client playback functionality.
Unexpected media writes, renames, or deletions.
Authentication or remote-access behavior that does not meet the migration plan.
An inability to restore the destination's pre-import backup.

### procedure
Stop applying destination state changes.
Preserve migration reports and errors for diagnosis.
Direct users back to the unchanged source service.
Mark the destination as non-authoritative and prevent further state divergence.
Restore the destination from its pre-import backup if another migration attempt will be made.
Correct naming, identity mapping, permissions, or client compatibility issues before repeating the pilot.
Do not attempt to merge divergent watch histories until an explicit conflict policy has been approved.

### lab_rollback
The lab's final step writes the active-server marker back to plex-source. All fixture data remains beneath /opt/lab-classroom/class59/ so it can be reviewed without affecting any real server.

## Video narration notes

Welcome to Class 59, Plex versus Jellyfin and Safe Migration. The central lesson is that changing media servers is not the same as moving a folder of videos. Your media files may be portable, but each server maintains its own catalog, internal identifiers, users, metadata cache, artwork, playback history, and preferences. Plex and Jellyfin are separate applications with different schemas, so their databases are not drop-in replacements for one another.

Begin with inventory. Record every library root, the number and type of items, naming exceptions, subtitles, sidecars, custom posters, users, playlists, collections, watch history, resume positions, clients, and automation. Back up the source through its supported process and prove that the backup can be read. Then create a parallel destination. Keep the source intact and avoid allowing two servers to rewrite the same media directories.

Let the destination scan a small pilot library. Match state using stable external identifiers. For episodes, include season and episode coordinates. Map each user explicitly. If a record has no reliable key or produces more than one match, quarantine it. A skipped record is visible and repairable; a confidently wrong automatic match can silently corrupt user history.

The classroom lab models this process without touching a real server. It creates a neutral inventory, identifies an intentionally ambiguous movie, and converts three source-state records into a destination plan. Two records have unique matches and become planned actions. The third has only a source-internal identifier, so it is quarantined. The plan is verified before any action is sent to an application.

Finally, treat cutover as an acceptance decision. Test representative clients, subtitles, audio tracks, direct playback, and required transcoding paths. Confirm access controls and sampled watch states. If acceptance fails, return users to the unchanged source. That is the value of a parallel migration: rollback is planned, simple, and based on preservation rather than reconstruction.

## References

- Plex Support: Creating Libraries — https://support.plex.tv/articles/200288926-creating-libraries/
- Plex Support: Naming and Organizing Your Movie Media Files — https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/
- Plex Support: Naming and Organizing Your TV Show Files — https://support.plex.tv/articles/naming-and-organizing-your-tv-show-files/
- Plex Support: Move Media Content to a New Location — https://support.plex.tv/articles/201154537-move-media-content-to-a-new-location/
- Jellyfin Documentation: Libraries — https://jellyfin.org/docs/general/server/libraries/
- Jellyfin Documentation: Movies — https://jellyfin.org/docs/general/server/media/movies/
- Jellyfin Documentation: Shows — https://jellyfin.org/docs/general/server/media/shows/
- Jellyfin Documentation: Backup and Restore — https://jellyfin.org/docs/general/administration/backup-and-restore/
- Jellyfin Documentation: Hardware Acceleration — https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/

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

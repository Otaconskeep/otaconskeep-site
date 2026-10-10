# Lab: Plex versus Jellyfin and Safe Migration

**Module:** Requests & Media Servers
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain the major architectural and operational differences between Plex and Jellyfin.

## Before you start

- Basic familiarity with Linux files, directories, users, groups, and permissions.
- Basic understanding of containers or system services, although this lab does not modify either.
- Familiarity with media libraries, seasons, episodes, subtitles, watch state, and resume position.
- Python 3 installed on the lab host.
- Write access to /opt/lab-classroom/class59/.

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

## Verification

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

## Security

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

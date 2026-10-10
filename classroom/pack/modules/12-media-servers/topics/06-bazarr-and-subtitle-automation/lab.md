# Lab: Bazarr and Subtitle Automation

**Module:** Requests & Media Servers
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain why Bazarr depends on Sonarr and Radarr metadata instead of acting as a general-purpose filesystem scanner.

## Before you start

- Basic familiarity with Sonarr and Radarr libraries
- Understanding of container bind mounts or equivalent filesystem mappings
- Ability to read JSON and run basic shell commands
- A conceptual understanding of media files, subtitle sidecar files, and language codes
- Python 3 for the isolated validation lab

## Guided lab

### name
Validate a Bazarr policy and manager path model

### scope
All created files remain under /opt/lab-classroom/class61/. No production manager, provider, or media library is contacted.

### steps
### step
1

### instruction
Create the isolated class directory.

### command
mkdir -p /opt/lab-classroom/class61
### step
2

### instruction
Create a portable policy model. This is a teaching artifact, not a Bazarr import file.

### command
cat > /opt/lab-classroom/class61/policy.json <<'EOF'
{
  "managers": {
    "sonarr": {
      "base_url": "http://sonarr:8989",
      "media_root": "/media/tv"
    },
    "radarr": {
      "base_url": "http://radarr:7878",
      "media_root": "/media/movies"
    }
  },
  "profiles": {
    "series-default": {
      "languages": ["en"],
      "forced": "allowed",
      "hearing_impaired": "preferred"
    },
    "movies-default": {
      "languages": ["en", "es"],
      "forced": "allowed",
      "hearing_impaired": "allowed"
    }
  },
  "providers_configured": false,
  "embedded_subtitles_may_satisfy_profile": true,
  "secrets_in_document": false
}
EOF
### step
3

### instruction
Create a simulated inventory representing paths reported by Sonarr and Radarr.

### command
cat > /opt/lab-classroom/class61/inventory.json <<'EOF'
{
  "items": [
    {
      "manager": "sonarr",
      "title": "North Harbor",
      "path": "/media/tv/North Harbor/Season 01/North Harbor - S01E01.mkv",
      "profile": "series-default"
    },
    {
      "manager": "radarr",
      "title": "The Quiet Circuit",
      "path": "/media/movies/The Quiet Circuit (2024)/The Quiet Circuit (2024).mkv",
      "profile": "movies-default"
    }
  ]
}
EOF
### step
4

### instruction
Create a validator that checks policy completeness, path consistency, profile references, and secret hygiene.

### command
cat > /opt/lab-classroom/class61/validate_lab.py <<'PY'
import json
from pathlib import Path, PurePosixPath

base = Path('/opt/lab-classroom/class61')
policy = json.loads((base / 'policy.json').read_text(encoding='utf-8'))
inventory = json.loads((base / 'inventory.json').read_text(encoding='utf-8'))

assert set(policy['managers']) == {'sonarr', 'radarr'}, 'Both managers must be modeled'
assert policy['providers_configured'] is False, 'The isolated lab must not enable providers'
assert policy['secrets_in_document'] is False, 'Portable policy documents must not contain secrets'
assert policy['profiles'], 'At least one language profile is required'

for profile_name, profile in policy['profiles'].items():
    assert profile['languages'], f'{profile_name} has no desired languages'
    assert len(profile['languages']) == len(set(profile['languages'])), f'{profile_name} repeats a language'
    assert profile['forced'] in {'required', 'allowed', 'ignored'}, f'{profile_name} has an invalid forced policy'
    assert profile['hearing_impaired'] in {'required', 'preferred', 'allowed', 'ignored'}, f'{profile_name} has an invalid accessibility policy'

for item in inventory['items']:
    manager_name = item['manager']
    assert manager_name in policy['managers'], f'Unknown manager: {manager_name}'
    assert item['profile'] in policy['profiles'], f"Unknown profile: {item['profile']}"
    media_root = PurePosixPath(policy['managers'][manager_name]['media_root'])
    media_path = PurePosixPath(item['path'])
    assert media_path.is_absolute(), f"Path is not absolute: {media_path}"
    assert media_path != media_root, f"Item path must identify a file: {media_path}"
    assert media_root in media_path.parents, f"{media_path} is outside {media_root}"
    assert '..' not in media_path.parts, f"Path traversal component found in {media_path}"

print('PASS: manager definitions are complete')
print('PASS: language profiles are explicit')
print('PASS: inventory paths match manager roots')
print('PASS: the design document declares no embedded secrets')
print('PASS: provider access remains disabled in the isolated lab')
PY
### step
5

### instruction
Run the validator.

### command
cd /opt/lab-classroom/class61 && python3 validate_lab.py
### step
6

### instruction
Inspect the resulting files and confirm that no artifact was created outside the class directory.

### command
find /opt/lab-classroom/class61 -maxdepth 1 -type f -printf '%f\n' | sort
### step
7

### instruction
Review policy.json and identify which settings must be translated manually into the Bazarr web interface during a future deployment.

### command
python3 -m json.tool /opt/lab-classroom/class61/policy.json

### production_translation
Add Sonarr and Radarr using their reachable URLs and separately supplied API keys.
Confirm connection tests before assigning language profiles.
Mount or otherwise expose the actual series and movie roots to Bazarr.
Create path mappings only where manager-reported paths differ from Bazarr-visible paths.
Create language profiles that reflect the tested policy.
Configure one reviewed provider at a time.
Test manual searches on a small, representative media sample before enabling automatic searches.

## Expected results

- The directory /opt/lab-classroom/class61/ contains policy.json, inventory.json, and validate_lab.py.
- The validator prints five lines beginning with PASS.
- The series item is accepted because its file path is below /media/tv.
- The movie item is accepted because its file path is below /media/movies.
- Both inventory entries reference defined language profiles.
- No provider connection, manager connection, credential, subtitle download, or media-library write occurs.

## Verification

- [ ] Run: cd /opt/lab-classroom/class61 && python3 validate_lab.py
- [ ] Run: python3 -m json.tool /opt/lab-classroom/class61/policy.json
- [ ] Run: python3 -m json.tool /opt/lab-classroom/class61/inventory.json
- [ ] Run: find /opt/lab-classroom/class61 -maxdepth 1 -type f -printf '%f\n' | sort
- [ ] Confirm that policy.json declares providers_configured as false.
- [ ] Confirm that each simulated item path begins below the media root associated with its manager.
- [ ] Confirm that no API key, provider password, session token, or cookie was added to either JSON document.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The validator reports that an item is outside its manager root. | The inventory path and configured media root use different namespaces or the item was assigned to the wrong manager. | Make the simulated path begin below the correct manager root. In a real deployment, align mounts or add a precise Bazarr path mapping. |
| The validator reports an unknown profile. | An inventory item references a profile name not defined in policy.json. | Correct the profile name or define a complete profile with languages, forced-subtitle behavior, and hearing-impaired behavior. |
| Python reports that a JSON document cannot be decoded. | The JSON was edited with a missing comma, unmatched quote, or trailing comma. | Use python3 -m json.tool on the affected file, correct the location reported by the parser, and rerun the validator. |
| Bazarr can connect to Sonarr or Radarr but reports media files as unavailable. | The manager API is reachable, but Bazarr does not have the same filesystem view or a correct path mapping. | Compare the exact manager-reported path with the path visible to Bazarr. Align the media mounts or configure a narrowly scoped prefix mapping. |
| Bazarr finds subtitles but cannot save them. | Bazarr can read the media but lacks permission to create sidecar files in the media directory. | Verify the runtime identity, directory ownership, access-control rules, and mount write mode. Grant only the access required to create and manage subtitle files. |
| Downloaded subtitles belong to the wrong release or drift out of synchronization. | Candidate matching was too permissive, the release metadata was incomplete, or the subtitle was timed for a different cut. | Raise matching requirements, prefer candidates with compatible release metadata, review provider settings, and test synchronization behavior before broad automation. |
| A desired language remains marked as missing even though the media has an embedded subtitle stream. | Embedded subtitles are not configured to satisfy the profile, the stream language metadata is absent, or the requested variant differs. | Inspect the media stream metadata and Bazarr's embedded-subtitle policy. Decide whether embedded tracks should satisfy the requirement or whether an external sidecar is required. |
| Provider searches fail while manager synchronization still works. | The provider has separate authentication, availability, quota, or account requirements. | Review the provider status and terms, verify its credentials through the Bazarr interface, and avoid repeatedly retrying a provider that is rejecting requests. |

## Security

### principles
Treat Sonarr and Radarr API keys as secrets because they permit authenticated manager access.
Treat provider usernames, passwords, tokens, cookies, and session data as secrets.
Restrict access to Bazarr's configuration directory and backups.
Do not commit exported configuration containing credentials to a source repository.
Expose the Bazarr interface only to trusted clients or place it behind a properly authenticated gateway.
Prefer isolated application networks for manager API traffic.
Use encrypted transport when traffic crosses an untrusted network.
Grant Bazarr read access to media and only the write access needed for subtitle sidecars.
Review provider terms and request limits before enabling automation.
Do not assume that a downloaded subtitle is correct merely because its language matches.

### secret_handling
The lab intentionally contains no credentials. In production, enter secrets through the protected application interface or an appropriate secret-management mechanism. Redact URLs containing tokens, provider account details, and API keys from screenshots and support bundles.

### filesystem_guidance
A subtitle-writing service can alter files visible to playback clients. Separate configuration backups from media backups, keep media roots narrowly scoped, and test with a small library subset before granting write access to an entire collection.

### external_service_considerations
Provider searches disclose at least some title or release metadata to external services. Provider accounts may be rate-limited or suspended for abusive automation. Configure conservative search behavior and honor provider rules.

## Rollback

### strategy
In a real deployment, first disable automatic subtitle searches and provider access.
Preserve the Bazarr configuration and logs until the reason for rollback is understood.
Do not automatically delete existing subtitle files; they may predate Bazarr or have been manually curated.
Restore configuration from a known backup if a policy change caused the problem.
Review subtitle sidecars individually before any media-library cleanup.

### lab_cleanup_command
python3 - <<'PY'
from pathlib import Path

target = Path('/opt/lab-classroom/class61')
expected = Path('/opt/lab-classroom/class61')
assert target.resolve() == expected.resolve(), 'Unexpected cleanup target'
if target.exists():
    for child in target.iterdir():
        if child.is_file() or child.is_symlink():
            child.unlink()
        else:
            raise RuntimeError(f'Unexpected nested entry: {child}')
    target.rmdir()
print('Lab artifacts removed')
PY

### rollback_verification
Confirm that /opt/lab-classroom/class61/ no longer exists while neighboring classroom directories remain unchanged.

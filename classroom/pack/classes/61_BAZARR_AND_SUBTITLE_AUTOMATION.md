# Class 61: Bazarr and Subtitle Automation

**Learning objective:** Explain why Bazarr depends on Sonarr and Radarr metadata instead of acting as a general-purpose filesystem scanner.; Describe the complete request flow from a media manager entry to a subtitle provider search and sidecar file.; Design identical or explicitly mapped media paths across Bazarr, Sonarr, and Radarr.; Create separate subtitle policies for series and movies.; Distinguish desired languages, forced subtitles, hearing-impaired subtitles, and embedded subtitles.; Protect manager API keys and subtitle-provider credentials.; Validate a subtitle automation design without modifying a production media library.; Plan a safe rollback that disables automation without deleting existing subtitles.
**Bloom level:** Understand / Apply
**Track:** Media Automation · **Difficulty:** intermediate · **Duration:** ~75 minutes · **Lab risk:** low
**Build output:** Teach learners how Bazarr integrates with Sonarr and Radarr to discover media, select subtitle releases, manage language policies, and place subtitle sidecar files while preserving predictable paths, security boundaries, and rollback options.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### bazarr
Concepts apply to current Bazarr deployments, but interface labels, provider availability, scoring options, and configuration storage may vary by release.

### sonarr
Applicable to supported Sonarr releases that expose API access and media-file paths to Bazarr.

### radarr
Applicable to supported Radarr releases that expose API access and media-file paths to Bazarr.

### deployment_models
Containerized applications with shared bind-mounted media paths
Virtual machines with shared network storage
Native services with consistently mounted media roots

### lab_runtime
The isolated validator requires Python 3 and standard shell utilities. It requires no Bazarr, Sonarr, Radarr, container engine, or network connection.

### caution
Consult the documentation matching the exact installed releases before changing production settings. Provider support and authentication requirements can change independently of Bazarr.

## Learning objective

- Explain why Bazarr depends on Sonarr and Radarr metadata instead of acting as a general-purpose filesystem scanner.
- Describe the complete request flow from a media manager entry to a subtitle provider search and sidecar file.
- Design identical or explicitly mapped media paths across Bazarr, Sonarr, and Radarr.
- Create separate subtitle policies for series and movies.
- Distinguish desired languages, forced subtitles, hearing-impaired subtitles, and embedded subtitles.
- Protect manager API keys and subtitle-provider credentials.
- Validate a subtitle automation design without modifying a production media library.
- Plan a safe rollback that disables automation without deleting existing subtitles.

## Why this matters

Teach learners how Bazarr integrates with Sonarr and Radarr to discover media, select subtitle releases, manage language policies, and place subtitle sidecar files while preserving predictable paths, security boundaries, and rollback options.

## Prerequisites

- Basic familiarity with Sonarr and Radarr libraries
- Understanding of container bind mounts or equivalent filesystem mappings
- Ability to read JSON and run basic shell commands
- A conceptual understanding of media files, subtitle sidecar files, and language codes
- Python 3 for the isolated validation lab

## Required reading

- Bazarr documentation home: https://wiki.bazarr.media/
- Bazarr setup documentation: https://wiki.bazarr.media/Getting-Started/Setup-Guide/
- Bazarr providers documentation: https://wiki.bazarr.media/Additional-Configuration/Providers/
- Sonarr documentation: https://wiki.servarr.com/sonarr
- Radarr documentation: https://wiki.servarr.com/radarr

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| Bazarr | A companion application for Sonarr and Radarr that searches supported subtitle providers and manages subtitle files for media known to those managers. |
| Subtitle provider | A remote service or catalog queried by Bazarr for subtitle releases. Providers have different authentication, quotas, terms, languages, and matching behavior. |
| Language profile | A policy describing which subtitle languages and variants are wanted for a set of movies or series. |
| Forced subtitle | A subtitle track intended primarily for foreign-language or otherwise untranslated dialogue within content whose main audio is understood by the viewer. |
| Hearing-impaired subtitle | A subtitle variant that may include speaker names, sound effects, music cues, and other accessibility information. |
| Sidecar subtitle | A separate subtitle file stored beside a media file, commonly using formats such as SRT, ASS, or SSA. |
| Embedded subtitle | A subtitle stream contained inside the media container rather than stored as a separate file. |
| Path mapping | A translation between the path reported by Sonarr or Radarr and the path through which Bazarr can access the same media. |
| Release matching | The process of comparing media metadata and filenames with subtitle metadata to reduce incorrect subtitle downloads. |
| API key | A secret token used by Bazarr to authenticate requests to Sonarr or Radarr. |

## Instruction

Bazarr is best understood as a subtitle companion to Sonarr and Radarr, not as an independent replacement for those applications. Sonarr supplies series, episode, and file metadata, while Radarr supplies movie and file metadata. Bazarr connects to each enabled manager through its API, imports the known media records, applies language profiles, checks which subtitles are already available, and asks configured subtitle providers for acceptable candidates. A selected subtitle is normally written as a sidecar file near the corresponding media file. The exact filename and language suffix depend on Bazarr settings, the selected language, and the subtitle format.

Path consistency is the most important architectural concern. If Sonarr reports an episode as /media/tv/Example Series/Season 01/Episode.mkv, Bazarr must be able to address that same file through its own filesystem view. The simplest design gives both applications the same internal media path. If that is impossible, an explicit path mapping must translate the manager-reported prefix to Bazarr's prefix. A mapping corrects path namespaces; it does not repair absent mounts, inaccessible storage, or insufficient permissions. Media roots should generally be readable by Bazarr, while directories in which sidecar files will be created must also permit the Bazarr process to write. Do not grant broader access merely to hide a mapping or ownership error.

Language profiles turn user intent into policy. A household might require English subtitles for all titles, Spanish subtitles for selected libraries, and English forced subtitles when available. Hearing-impaired subtitles are a separate preference rather than a synonym for ordinary subtitles. Embedded subtitle handling also needs an explicit decision: an existing embedded track may satisfy a language requirement for one household, while another may require external sidecar files for player compatibility. Apply profiles deliberately to series and movies, then test a small set before enabling broad searches.

Providers are external dependencies. Each provider may impose authentication requirements, request limits, anti-abuse controls, or content rules. Configure only providers whose terms you understand. More providers do not automatically produce better matches; they increase the number of credentials, failure modes, and candidate releases. Matching quality depends on metadata such as title, year, season, episode, release group, source, edition, and runtime. Automatic selection should therefore use conservative scoring and synchronization settings. Review initial results on representative episodes and movies before expanding automation.

Bazarr requires manager API keys, and some providers require usernames, passwords, tokens, or cookies. Treat all of these as secrets. Keep the web interface on a trusted network or behind an authenticated reverse proxy, restrict configuration storage, and avoid placing secrets in lesson notes or exported screenshots. Back up configuration before major policy changes. Disabling a provider or language profile stops future activity but does not necessarily remove subtitle files that were already written, so cleanup must be a separate, reviewed action.

The lab is intentionally a design and validation exercise. It creates a policy model, a simulated manager inventory, and a validator only under /opt/lab-classroom/class61/. It does not contact subtitle providers, expose credentials, alter a media library, or claim that the policy file can be imported directly into Bazarr. The exercise demonstrates the invariants that a real deployment must preserve: known managers, valid media roots, consistent paths, explicit language intent, and no secrets in portable design documents.

## Architecture

### components
Sonarr supplies series, episode, and episode-file metadata through its API.
Radarr supplies movie and movie-file metadata through its API.
Bazarr imports manager metadata, evaluates subtitle policies, searches providers, and manages subtitle sidecars.
Subtitle providers return candidate subtitle releases according to their own capabilities and access rules.
Shared media storage exposes the same files to the managers, Bazarr, and playback clients.
A media player reads the media file, embedded streams, and compatible sidecar subtitles.

### data_flow
Sonarr or Radarr records a media item and its file path.
Bazarr authenticates to the manager API and imports the item metadata.
Bazarr translates the reported path when a path mapping is configured.
Bazarr evaluates existing embedded and external subtitles against the assigned language profile.
Bazarr searches enabled providers when a required subtitle is missing.
Candidate releases are scored and filtered.
The selected subtitle is downloaded, optionally processed according to configured behavior, and written beside the media file.
The playback client discovers or is directed to the resulting subtitle track.

### trust_boundaries
Manager API traffic crosses from Bazarr to Sonarr or Radarr and carries an API credential.
Provider traffic leaves the homelab and may carry provider credentials and media search metadata.
The Bazarr configuration store contains sensitive integration settings.
Writable media mounts allow Bazarr to create or replace subtitle files and therefore require constrained permissions and backups.

### recommended_path_model
### sonarr_series_root
/media/tv

### radarr_movie_root
/media/movies

### bazarr_series_view
/media/tv

### bazarr_movie_view
/media/movies

### principle
Prefer identical application-visible paths. Use explicit mappings only when identical paths cannot be provided.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

### tasks
Extend the isolated policy with a second series profile that requires Spanish subtitles and ignores hearing-impaired variants.
Add another simulated Sonarr item and assign the new profile.
Modify the validator so every language value must be a nonempty lowercase string.
Write a deployment checklist covering manager connectivity, media paths, language profiles, one provider, secret storage, and rollback.
Draw a data-flow diagram showing the trust boundaries between Bazarr, the media managers, storage, providers, and playback clients.

### constraints
Create or modify homework artifacts only under /opt/lab-classroom/class61/.
Do not use real API keys or provider credentials.
Do not connect the exercise to a production media library.
Do not configure automated deletion of existing subtitle files.

### completion_criteria
The validator passes with the additional profile and item, rejects an intentionally uppercase language value, and the deployment checklist explains both path validation and credential protection.

## Feynman teach-back

### prompt
Explain Bazarr to someone who understands a media player but has never used media automation.

### model_explanation
Sonarr and Radarr are like librarians that already know which television episodes and movies are on the shelves and where each file is stored. Bazarr asks those librarians for the catalog instead of wandering through every shelf by itself. For each catalog entry, Bazarr checks a language wish list. If a wanted subtitle is missing, it asks approved subtitle services for candidates, chooses a suitable match, and places the subtitle next to the video so a player can find it. This works only if Bazarr can reach both the librarians and the same shelves. If the librarians call a shelf /media/tv but Bazarr sees it under a different name, Bazarr needs an exact translation. Credentials open the librarians' catalogs and provider accounts, so they must be protected.

### self_check_questions
Why is successful API connectivity insufficient when Bazarr cannot see the corresponding media path?
Why should forced and hearing-impaired subtitles be modeled separately?
Why is disabling automation safer than immediately deleting subtitle files during rollback?

## Retrieval check

1. 1. Why does Bazarr normally integrate with both Sonarr and Radarr instead of relying only on a recursive media-directory scan?
2. 2. What must be true about a media path reported by Sonarr or Radarr before Bazarr can manage a subtitle beside that file?
3. 3. What is the difference between a forced subtitle and a hearing-impaired subtitle?
4. 4. Why can enabling many subtitle providers at once make initial troubleshooting harder?
5. 5. If Bazarr can read a movie but cannot create its subtitle sidecar, which category of configuration should be checked first?
6. 6. Why should manager API keys and provider credentials be excluded from portable policy documents?
7. 7. What is the safest first action when rolling back unwanted automatic subtitle behavior?
8. 8. Does disabling a language profile guarantee that subtitle files previously written by Bazarr are removed?

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

## Verification checkpoints

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

## Security considerations

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

## Video narration notes

Welcome to Class 61: Bazarr and Subtitle Automation. Bazarr is a companion to Sonarr and Radarr. Sonarr tells Bazarr about series and episode files, while Radarr tells it about movies. Bazarr then compares each item with an assigned language profile, checks existing subtitles, and searches configured providers when something is missing.

The first major lesson is that API connectivity and filesystem access are separate requirements. Bazarr may successfully connect to Sonarr while still being unable to open the episode path returned by Sonarr. Prefer identical internal media paths across the applications. If identical paths are impossible, configure an exact path mapping and verify it with a real item. A mapping cannot compensate for missing storage or insufficient access.

The second lesson is to describe subtitle intent precisely. A normal subtitle, a forced subtitle, and a hearing-impaired subtitle serve different purposes. Decide whether embedded tracks satisfy your policy and whether external sidecars are needed for player compatibility. Start with a small set of representative media rather than immediately searching an entire library.

The third lesson is security. Manager API keys and provider credentials are secrets. Provider searches also cross the homelab boundary and may be subject to account rules or request limits. Enable one reviewed provider at a time, monitor the initial results, and avoid storing credentials in portable documentation.

In the lab, we remain isolated from production. We create a policy model and simulated inventory under /opt/lab-classroom/class61/. A Python validator confirms that manager definitions exist, profiles are explicit, and every simulated file path belongs to the expected root. The files are teaching artifacts and are not presented as importable Bazarr configuration.

Finally, rollback should stop new automation before changing old files. Disable searches, preserve logs and configuration, and review existing subtitles separately. This avoids deleting manually curated subtitles or files that existed before Bazarr was introduced.

## References

- Bazarr documentation: https://wiki.bazarr.media/
- Bazarr setup guide: https://wiki.bazarr.media/Getting-Started/Setup-Guide/
- Bazarr provider documentation: https://wiki.bazarr.media/Additional-Configuration/Providers/
- Servarr Sonarr documentation: https://wiki.servarr.com/sonarr
- Servarr Radarr documentation: https://wiki.servarr.com/radarr
- Language tag registry maintained by IANA: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry

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

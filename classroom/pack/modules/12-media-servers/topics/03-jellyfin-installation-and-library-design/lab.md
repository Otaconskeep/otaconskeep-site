# Lab: Jellyfin Installation and Library Design

**Module:** Requests & Media Servers
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Explain the roles of Jellyfin configuration, cache, metadata, transcode workspace, and media storage.

## Before you start

- Comfort using a Linux shell and editing text files.
- Basic understanding of containers, bind mounts, TCP ports, and file ownership.
- Python 3 for the included local validation checks.
- Optional access to Docker Compose or a compatible Compose implementation for later deployment outside the constrained classroom lab.
- At least 2 GB of free space for future Jellyfin metadata and cache growth; actual media storage requirements depend on the student's collection.

## Guided lab

### scope_guard
Every file created or changed by this lab is under /opt/lab-classroom/class58/. Do not start the Compose project during this constrained exercise because the container engine may write image and runtime state elsewhere.

### steps
### step
1

### title
Create the isolated directory tree

### commands
sudo mkdir -p /opt/lab-classroom/class58/state/config
sudo mkdir -p /opt/lab-classroom/class58/state/cache
sudo mkdir -p /opt/lab-classroom/class58/media/movies
sudo mkdir -p /opt/lab-classroom/class58/media/shows
sudo mkdir -p /opt/lab-classroom/class58/media/music
sudo mkdir -p /opt/lab-classroom/class58/notes

### explanation
Configuration, cache, media, and design notes are separated so that lifecycle and backup policies can be applied independently.
### step
2

### title
Record the intended media naming conventions

### commands
sudo tee /opt/lab-classroom/class58/notes/library-layout.txt >/dev/null <<'EOF'
Movies:
/media/movies/Movie Title (Year)/Movie Title (Year).ext

Shows:
/media/shows/Series Title (Year)/Season 01/Series Title - S01E01 - Episode Title.ext

Music:
/media/music/Artist/Album (Year)/01 - Track Title.ext

Policy:
Keep distinct media types in distinct Jellyfin libraries.
Preserve release years when titles may be ambiguous.
Keep source media read-only from the Jellyfin container.
EOF

### explanation
Documenting conventions before importing media reduces later renaming and metadata correction work.
### step
3

### title
Create non-secret deployment variables

### commands
sudo tee /opt/lab-classroom/class58/.env >/dev/null <<'EOF'
JELLYFIN_UID=1000
JELLYFIN_GID=1000
JELLYFIN_TIMEZONE=Etc/UTC
EOF

### explanation
The numeric identity must match an account that can write to configuration and cache while only reading media. These classroom values are explicit and must be reviewed before production use.
### step
4

### title
Stage the Jellyfin Compose definition

### commands
sudo tee /opt/lab-classroom/class58/compose.yaml >/dev/null <<'EOF'
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.7
    container_name: class58-jellyfin
    user: "${JELLYFIN_UID}:${JELLYFIN_GID}"
    environment:
      TZ: "${JELLYFIN_TIMEZONE}"
    ports:
      - "127.0.0.1:8096:8096/tcp"
    volumes:
      - type: bind
        source: /opt/lab-classroom/class58/state/config
        target: /config
      - type: bind
        source: /opt/lab-classroom/class58/state/cache
        target: /cache
      - type: bind
        source: /opt/lab-classroom/class58/media
        target: /media
        read_only: true
    tmpfs:
      - /tmp:size=256m
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    restart: unless-stopped
EOF

### explanation
The definition pins a reviewed Jellyfin release, publishes the web interface only on loopback, separates persistent state from cache, and grants read-only media access.
### step
5

### title
Perform a scope and policy validation

### commands
python3 - <<'PY'
from pathlib import Path
root = Path('/opt/lab-classroom/class58')
compose = root / 'compose.yaml'
text = compose.read_text()
required = [
    '/opt/lab-classroom/class58/state/config',
    '/opt/lab-classroom/class58/state/cache',
    '/opt/lab-classroom/class58/media',
    '127.0.0.1:8096:8096/tcp',
    'read_only: true',
    'no-new-privileges:true',
    'cap_drop:'
]
missing = [item for item in required if item not in text]
assert not missing, f'Missing required controls: {missing}'
for line in text.splitlines():
    stripped = line.strip()
    if stripped.startswith('source:'):
        source = Path(stripped.split(':', 1)[1].strip())
        assert source.is_absolute(), f'Non-absolute source: {source}'
        assert source == root or root in source.parents, f'Out-of-scope source: {source}'
print('PASS: required controls are present and all bind sources are in scope')
PY

### explanation
The standard-library check proves that declared host bind sources are absolute and remain inside the authorized classroom tree.
### step
6

### title
Inspect the completed installation bundle

### commands
find /opt/lab-classroom/class58 -maxdepth 3 -print | sort
sed -n '1,220p' /opt/lab-classroom/class58/compose.yaml
sed -n '1,160p' /opt/lab-classroom/class58/notes/library-layout.txt

### explanation
Review the exact files, paths, port binding, and media policy before any future production activation.

### activation_note
Production activation is intentionally excluded from this lab. An administrator should first verify the image version, ownership values, storage capacity, backup plan, reverse-proxy design, and container-engine storage scope in an approved environment.

## Expected results

- The directory /opt/lab-classroom/class58/ contains compose.yaml, .env, notes, media directories, and separate state directories.
- The validation script prints: PASS: required controls are present and all bind sources are in scope.
- The Compose definition publishes TCP port 8096 only on 127.0.0.1.
- The media bind mount is marked read-only, while configuration and cache mounts remain writable.
- The proposed library layout keeps movies, shows, and music in separate directory trees.
- No Jellyfin container, image, network, or external container-engine storage is created by the lab.

## Verification

- [ ] Run `test -f /opt/lab-classroom/class58/compose.yaml && echo PASS` and confirm PASS is printed.
- [ ] Run `test -f /opt/lab-classroom/class58/.env && echo PASS` and confirm PASS is printed.
- [ ] Run `grep -F '127.0.0.1:8096:8096/tcp' /opt/lab-classroom/class58/compose.yaml` and confirm the loopback publication is displayed.
- [ ] Run `grep -A3 'source: /opt/lab-classroom/class58/media' /opt/lab-classroom/class58/compose.yaml` and confirm the target is /media and read_only is true.
- [ ] Run `grep -F 'no-new-privileges:true' /opt/lab-classroom/class58/compose.yaml` and confirm the setting is present.
- [ ] Run `find /opt/lab-classroom/class58/media -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort` and confirm movies, music, and shows are listed.
- [ ] Re-run the Python scope validation from the lab and confirm that it reports no out-of-scope bind source.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| The initial directory creation reports permission denied. | The current account cannot create directories under /opt. | Use the shown sudo-prefixed directory and file creation commands through an authorized administrative account. Do not redirect the lab into an unrelated path because the scope checks expect the assigned classroom directory. |
| The Python validation reports a missing required control. | The Compose file was edited, copied incompletely, or contains a spelling difference. | Compare compose.yaml with the lesson definition and restore the missing loopback port, scoped mount, read-only media flag, capability drop, or privilege-escalation control. |
| The Python validation reports an out-of-scope source. | A host bind mount points outside /opt/lab-classroom/class58/. | Change the source to the corresponding state or media directory under /opt/lab-classroom/class58/ and run validation again. |
| A future Jellyfin deployment cannot write its database or cache. | JELLYFIN_UID and JELLYFIN_GID do not own or have suitable access to the configuration and cache directories. | Determine the approved service identity, update the numeric values, and grant only that identity the required write access. Keep the media tree read-only unless a documented workflow requires otherwise. |
| A future client cannot connect from another computer. | The published port is deliberately bound to the host loopback address. | Keep Jellyfin loopback-only and place an authenticated TLS reverse proxy in front of it, or perform a documented network exposure review before changing the bind address. |
| Jellyfin later identifies the wrong movie or television series. | The filename lacks a release year, season marker, episode marker, or unambiguous title. | Rename and organize the media according to Jellyfin's documented naming conventions, then rescan the affected library. |
| Playback later consumes unexpectedly high CPU. | The client is requesting transcoding because of incompatible codecs, subtitles, bitrate, resolution, or container format. | Inspect the Jellyfin playback information, test direct-play-compatible media, review client settings, and evaluate supported hardware acceleration only after ordinary playback is functional. |

## Security

Do not expose Jellyfin directly to the public Internet merely by changing the port binding. Use a maintained TLS reverse proxy, strong authentication, timely updates, and an explicit remote-access policy.
Keep source media read-only to the Jellyfin process unless a specific, reviewed feature requires write access.
Treat the configuration directory as sensitive because it contains account data, server settings, database state, and potentially authentication-related information.
Back up configuration separately from cache. A cache copy is normally less important than a consistent copy of application state.
Use a dedicated numeric service identity rather than running the application as the host administrator.
Keep Linux capabilities dropped and privilege escalation disabled unless documented functionality proves that a narrowly scoped exception is required.
Do not add broad device access for hardware transcoding. Expose only the required rendering or media device nodes after checking platform-specific Jellyfin guidance.
Do not store reverse-proxy credentials, API tokens, or private keys directly in compose.yaml or in a source-controlled environment file.
Review plugins carefully. Plugins execute within the server's trust context and can increase the attack surface.
Retain logs necessary for diagnosis while applying storage limits and protecting user viewing history according to household or organizational privacy expectations.

## Rollback

### goal
Disable the staged installation definition without deleting classroom evidence or changing anything outside the authorized directory.

### commands
cd /opt/lab-classroom/class58
if test -f compose.yaml; then sudo mv compose.yaml compose.yaml.disabled; fi
printf '%s\n' 'Class 58 deployment definition disabled; state and notes retained.' | sudo tee notes/rollback-status.txt >/dev/null

### verification
Run `test ! -f /opt/lab-classroom/class58/compose.yaml && test -f /opt/lab-classroom/class58/compose.yaml.disabled && echo PASS` and confirm PASS is printed.

### restore
To restore the staged definition, run `sudo mv /opt/lab-classroom/class58/compose.yaml.disabled /opt/lab-classroom/class58/compose.yaml` and repeat the scope validation.

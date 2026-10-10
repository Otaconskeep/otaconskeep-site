# Class 58: Jellyfin Installation and Library Design

**Learning objective:** Explain the roles of Jellyfin configuration, cache, metadata, transcode workspace, and media storage.; Create a reproducible Compose definition with explicit bind mounts and a loopback-only web port.; Design separate movie, television, and music directory structures that support reliable metadata matching.; Apply read-only media mounts and least-privilege container settings.; Distinguish direct play, remuxing, direct streaming, and transcoding.; Verify that every host-side path in the staged installation remains under the authorized lab directory.; Describe a safe path from a staged configuration to a production deployment.
**Bloom level:** Understand / Apply
**Track:** Self-Hosted Media Services · **Difficulty:** intermediate · **Duration:** ~90 minutes · **Lab risk:** low
**Build output:** Design a maintainable Jellyfin deployment, stage a container-based installation definition, and organize media libraries without exposing the service or modifying files outside the classroom workspace.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-02-20
**Compatibility:** ### jellyfin
The staged definition targets Jellyfin 10.10.7. Review current release notes and security advisories before production deployment.

### host
Designed for a Linux host with Python 3 and permission to create the assigned /opt/lab-classroom/class58/ tree.

### container_runtime
The file uses the current Compose service syntax and bind-mount long form. Runtime activation is not performed in this lab.

### clients
Modern Jellyfin web, mobile, television, and desktop clients may be used after deployment; direct-play behavior varies by client codec and subtitle support.

### hardware_acceleration
No GPU or media device is included in the baseline definition. Device configuration is platform-specific and should be added only after reviewing official guidance.

### scope
All lab-generated files remain under /opt/lab-classroom/class58/.

## Learning objective

- Explain the roles of Jellyfin configuration, cache, metadata, transcode workspace, and media storage.
- Create a reproducible Compose definition with explicit bind mounts and a loopback-only web port.
- Design separate movie, television, and music directory structures that support reliable metadata matching.
- Apply read-only media mounts and least-privilege container settings.
- Distinguish direct play, remuxing, direct streaming, and transcoding.
- Verify that every host-side path in the staged installation remains under the authorized lab directory.
- Describe a safe path from a staged configuration to a production deployment.

## Why this matters

Design a maintainable Jellyfin deployment, stage a container-based installation definition, and organize media libraries without exposing the service or modifying files outside the classroom workspace.

## Prerequisites

- Comfort using a Linux shell and editing text files.
- Basic understanding of containers, bind mounts, TCP ports, and file ownership.
- Python 3 for the included local validation checks.
- Optional access to Docker Compose or a compatible Compose implementation for later deployment outside the constrained classroom lab.
- At least 2 GB of free space for future Jellyfin metadata and cache growth; actual media storage requirements depend on the student's collection.

## Required reading

- Jellyfin documentation: Installation overview — https://jellyfin.org/docs/general/installation/
- Jellyfin documentation: Container installation — https://jellyfin.org/docs/general/installation/container/
- Jellyfin documentation: Media organization — https://jellyfin.org/docs/general/server/media/movies/
- Jellyfin documentation: Hardware acceleration — https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/
- Docker documentation: Compose file reference — https://docs.docker.com/reference/compose-file/

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| Library | A logical Jellyfin collection, such as Movies, Shows, or Music, connected to one or more filesystem paths. |
| Metadata | Descriptive information associated with media, including titles, artwork, cast, release dates, episode numbers, and summaries. |
| Direct play | Playback in which the client consumes the original media streams and container without server-side conversion. |
| Remux | Repackaging existing audio and video streams into a different container without re-encoding the streams. |
| Transcoding | Server-side decoding and re-encoding performed when a client cannot consume the original codec, bitrate, resolution, or subtitle format. |
| Bind mount | A mapping that presents a specific host directory at a chosen path inside a container. |
| Published port | A host address and port mapped to a service port inside a container. |
| Hardware acceleration | Use of a supported GPU or media engine to assist video decoding, encoding, or tone mapping. |
| Naming convention | A predictable directory and filename pattern that allows Jellyfin to identify titles, seasons, episodes, editions, and release years. |

## Instruction

Jellyfin is more than a web application pointed at a folder of files. A maintainable installation separates application state from replaceable cache data and from the media collection itself. The configuration directory contains the database, users, library definitions, artwork references, and server settings. It must be backed up consistently. The cache directory contains data that can generally be regenerated, although rebuilding it can take time. Media should be treated as an independent storage domain and mounted read-only whenever Jellyfin does not need to manage or delete source files. This separation prevents an application replacement from becoming a media migration and reduces the damage possible through an application defect or compromised process.

Library design directly affects metadata accuracy. Movies work best when each title has its own directory containing the title and release year. Television libraries should separate each series and season, while episode filenames should include season and episode numbers. Music libraries benefit from consistent artist, album, disc, and track tags in addition to orderly paths. Mixing unrelated media types in one library makes scanner behavior less predictable and complicates permissions. Extras, alternate editions, subtitles, and multi-part media should follow Jellyfin's documented naming rules rather than improvised suffixes.

Playback behavior is another design concern. Direct play usually places the least processing demand on the server because the client accepts the existing file. A remux changes the container while retaining the encoded streams. Transcoding converts one or more streams and can consume substantial CPU or accelerator resources. Whether transcoding occurs depends on the media format, subtitles, bitrate limits, network conditions, and client capabilities. Hardware acceleration should therefore be added only after basic software playback works and only with documented device permissions for the host platform.

This lab stages an installation rather than launching it. Starting a container can create image layers, logs, network state, and runtime metadata outside the classroom directory. The class restriction permits mutations only under /opt/lab-classroom/class58/, so the deployment definition is created and statically inspected without pulling an image or starting a service. The resulting bundle is suitable for review and can later be copied into an approved production workflow. Its published HTTP port is restricted to the host loopback address, its media mount is read-only, Linux capabilities are dropped, and privilege escalation is disabled. These controls are defense-in-depth measures, not substitutes for updates, authentication, backups, transport encryption, or network access policy.

## Architecture

### components
Jellyfin server container defined by a Compose file.
Persistent configuration directory at /opt/lab-classroom/class58/state/config.
Replaceable cache and transcode workspace at /opt/lab-classroom/class58/state/cache.
Read-only media tree at /opt/lab-classroom/class58/media.
Loopback-only HTTP publication at 127.0.0.1:8096.
An optional separately managed reverse proxy for authenticated remote access and TLS termination.

### data_flow
A local browser or reverse proxy connects to 127.0.0.1:8096.
Jellyfin reads account, library, and server state from /config.
Jellyfin writes temporary and regenerated data to /cache and /tmp.
Jellyfin scans /media/movies, /media/shows, and /media/music without write access to the host media tree.
A compatible client receives the original stream through direct play; incompatible media may require remuxing or transcoding.

### trust_boundaries
Client input crosses into the Jellyfin application through its HTTP interface.
The container process crosses a filesystem boundary when accessing host bind mounts.
Any future reverse proxy forms a separate security boundary and must not be assumed to make Jellyfin safe by itself.
Hardware devices, if added later, create another privileged boundary and should be exposed individually rather than broadly.

### library_layout
### movies
/media/movies/Movie Title (Year)/Movie Title (Year).ext

### shows
/media/shows/Series Title (Year)/Season 01/Series Title - S01E01 - Episode Title.ext

### music
/media/music/Artist/Album (Year)/01 - Track Title.ext

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

Create /opt/lab-classroom/class58/notes/library-plan.txt describing three planned libraries, their naming rules, expected users, and whether each library should permit deletion through Jellyfin.
Create /opt/lab-classroom/class58/notes/backup-plan.txt identifying which directories require backup, the intended backup frequency, retention goals, and a restore-test procedure.
Create /opt/lab-classroom/class58/notes/client-matrix.txt listing each intended playback client and the codecs, containers, subtitle formats, and resolutions it is expected to support. Mark unknown capabilities for testing rather than guessing.
Write a short threat model in /opt/lab-classroom/class58/notes/threat-model.txt covering account compromise, unintended public exposure, plugin risk, media deletion, and loss of the configuration database.
Review the current Jellyfin release notes before production activation and document whether the pinned image version remains acceptable.

## Feynman teach-back

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

## Retrieval check

1. Which Jellyfin directory normally deserves the highest backup priority: configuration, cache, or temporary transcode data?
2. Why is the media bind mount marked read-only in this design?
3. What does binding 8096 to 127.0.0.1 change compared with publishing it on every host interface?
4. What is the difference between direct play and transcoding?
5. Why should movies and television episodes use different directory and filename conventions?
6. Why does this constrained lab stage the Compose definition without starting it?
7. What should be checked before adding hardware acceleration to Jellyfin?
8. Why is a reverse proxy not, by itself, a complete security solution?

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

## Verification checkpoints

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

## Security considerations

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

## Video narration notes

Welcome to Class 58, Jellyfin Installation and Library Design. We begin by separating four concerns: persistent configuration, replaceable cache, source media, and network access. The configuration directory is the durable brain of the server. It includes the database, user information, library definitions, and application settings. The cache is working material that can normally be regenerated. Media is maintained separately and is mounted read-only so that the streaming service cannot casually modify the source collection.

Our media tree contains dedicated directories for movies, shows, and music. Movies use a title and release year. Shows add series, season, and episode information. Music uses artist, album, and ordered track information. These conventions are not cosmetic. They supply the scanner with structured clues and reduce incorrect metadata matches.

Next, examine the Compose definition. The image version is explicit rather than floating silently between releases. The process uses a numeric, non-administrative identity. Configuration and cache receive separate writable mounts. Media receives one read-only mount. The web interface is published on 127.0.0.1, so the staged design does not invite connections from other systems. Linux capabilities are dropped, and the process is prevented from gaining additional privileges.

The validation script reads the deployment definition and confirms that every host bind source remains under the authorized classroom directory. It also confirms the loopback port and required security controls. We do not start the container in this exercise because a container engine can create storage and runtime files outside the class directory. In production, activation should occur only after reviewing ownership, backups, image versions, storage capacity, remote-access architecture, and client playback needs.

Finally, remember that playback format matters. A compatible client can direct play the original media. An incompatible client may cause a remux or full transcode. Hardware acceleration can help supported workloads, but it should not be the first troubleshooting step. Establish correct libraries, permissions, networking, and ordinary playback before introducing host device access.

## References

- Jellyfin official documentation — https://jellyfin.org/docs/
- Jellyfin container installation documentation — https://jellyfin.org/docs/general/installation/container/
- Jellyfin movie naming documentation — https://jellyfin.org/docs/general/server/media/movies/
- Jellyfin show naming documentation — https://jellyfin.org/docs/general/server/media/shows/
- Jellyfin music documentation — https://jellyfin.org/docs/general/server/media/music/
- Jellyfin codec support documentation — https://jellyfin.org/docs/general/clients/codec-support/
- Jellyfin hardware acceleration documentation — https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/
- Docker Compose file reference — https://docs.docker.com/reference/compose-file/
- Open Container Initiative image specification — https://github.com/opencontainers/image-spec

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

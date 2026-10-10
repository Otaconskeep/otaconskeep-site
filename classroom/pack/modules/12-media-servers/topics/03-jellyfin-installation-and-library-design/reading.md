# Reading: Jellyfin Installation and Library Design

**Module:** Requests & Media Servers
**Activity type:** Reading (Learn)
**Objective:** Explain the roles of Jellyfin configuration, cache, metadata, transcode workspace, and media storage.

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

## Required reading

- Jellyfin documentation: Installation overview — https://jellyfin.org/docs/general/installation/
- Jellyfin documentation: Container installation — https://jellyfin.org/docs/general/installation/container/
- Jellyfin documentation: Media organization — https://jellyfin.org/docs/general/server/media/movies/
- Jellyfin documentation: Hardware acceleration — https://jellyfin.org/docs/general/post-install/transcoding/hardware-acceleration/
- Docker documentation: Compose file reference — https://docs.docker.com/reference/compose-file/

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

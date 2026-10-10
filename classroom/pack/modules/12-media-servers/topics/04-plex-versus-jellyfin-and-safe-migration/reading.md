# Reading: Plex versus Jellyfin and Safe Migration

**Module:** Requests & Media Servers
**Activity type:** Reading (Learn)
**Objective:** Explain the major architectural and operational differences between Plex and Jellyfin.

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

## Required reading

- Plex Support: Naming and Organizing Your TV Show Files — https://support.plex.tv/articles/naming-and-organizing-your-tv-show-files/
- Plex Support: Naming and Organizing Your Movie Media Files — https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/
- Plex Support: Move Media Content to a New Location — https://support.plex.tv/articles/201154537-move-media-content-to-a-new-location/
- Jellyfin Documentation: Movies — https://jellyfin.org/docs/general/server/media/movies/
- Jellyfin Documentation: Shows — https://jellyfin.org/docs/general/server/media/shows/
- Jellyfin Documentation: Backup and Restore — https://jellyfin.org/docs/general/administration/backup-and-restore/

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

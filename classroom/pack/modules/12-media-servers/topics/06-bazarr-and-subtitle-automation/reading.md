# Reading: Bazarr and Subtitle Automation

**Module:** Requests & Media Servers
**Activity type:** Reading (Learn)
**Objective:** Explain why Bazarr depends on Sonarr and Radarr metadata instead of acting as a general-purpose filesystem scanner.

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

## Required reading

- Bazarr documentation home: https://wiki.bazarr.media/
- Bazarr setup documentation: https://wiki.bazarr.media/Getting-Started/Setup-Guide/
- Bazarr providers documentation: https://wiki.bazarr.media/Additional-Configuration/Providers/
- Sonarr documentation: https://wiki.servarr.com/sonarr
- Radarr documentation: https://wiki.servarr.com/radarr

## References

- Bazarr documentation: https://wiki.bazarr.media/
- Bazarr setup guide: https://wiki.bazarr.media/Getting-Started/Setup-Guide/
- Bazarr provider documentation: https://wiki.bazarr.media/Additional-Configuration/Providers/
- Servarr Sonarr documentation: https://wiki.servarr.com/sonarr
- Servarr Radarr documentation: https://wiki.servarr.com/radarr
- Language tag registry maintained by IANA: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry

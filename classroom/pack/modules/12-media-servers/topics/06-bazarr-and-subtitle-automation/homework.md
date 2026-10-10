# Homework: Bazarr and Subtitle Automation

**Module:** Requests & Media Servers
**Activity type:** Homework / independent application
**Objective:** Explain why Bazarr depends on Sonarr and Radarr metadata instead of acting as a general-purpose filesystem scanner.

## Requirements

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

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz

# Lab: Hardware Transcoding and Verification

**Module:** Requests & Media Servers
**Activity type:** Lab (Practice)
**Lab risk:** medium
**Objective:** Distinguish decoding, filtering, encoding, and container muxing as separate stages of a transcoding pipeline.

## Before you start

- A Linux homelab host or virtual machine with FFmpeg and FFprobe installed.
- A supported Intel, AMD, or NVIDIA GPU exposed to the operating system.
- Permission to read the relevant GPU device and monitoring interfaces.
- The directory /opt/lab-classroom/class60/ must already exist and be writable by the learner.
- Basic familiarity with codecs, containers, shell pipelines, and media server terminology.
- At least 1 GB of free space beneath /opt/lab-classroom/class60/.
- No production media library is required or used.

## Guided lab

### scope
All created directories, media files, logs, cache files, configuration files, and temporary files remain beneath /opt/lab-classroom/class60/. Device and system inspection commands are read-only.

### shell_assumption
Run the commands in Bash. Select exactly one hardware encoding branch that matches the installed GPU.

### steps
### step
1

### title
Prepare an isolated workspace

### commands
export LAB=/opt/lab-classroom/class60
mkdir -p "$LAB/input" "$LAB/output" "$LAB/logs" "$LAB/cache" "$LAB/config" "$LAB/tmp"
export HOME="$LAB"
export XDG_CACHE_HOME="$LAB/cache"
export XDG_CONFIG_HOME="$LAB/config"
export TMPDIR="$LAB/tmp"
printf 'Workspace: %s\n' "$LAB" | tee "$LAB/logs/workspace.txt"

### notes
Stop if LAB does not print exactly /opt/lab-classroom/class60. These environment variables direct normal per-user caches and temporary artifacts into the class workspace.
### step
2

### title
Record FFmpeg capabilities and device visibility

### commands
ffmpeg -version > "$LAB/logs/ffmpeg-version.txt" 2>&1
ffmpeg -hide_banner -encoders > "$LAB/logs/ffmpeg-encoders.txt" 2>&1
grep -E 'h264_(vaapi|nvenc|qsv)|hevc_(vaapi|nvenc|qsv)|av1_(vaapi|nvenc|qsv)' "$LAB/logs/ffmpeg-encoders.txt" | tee "$LAB/logs/hardware-encoder-candidates.txt"
if test -d /dev/dri; then ls -l /dev/dri | tee "$LAB/logs/dri-devices.txt"; else printf 'No /dev/dri directory is visible.\n' | tee "$LAB/logs/dri-devices.txt"; fi
if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi | tee "$LAB/logs/nvidia-smi.txt"; else printf 'nvidia-smi is not available.\n' | tee "$LAB/logs/nvidia-smi.txt"; fi

### notes
The encoder list describes the FFmpeg build. Device listings describe exposure. Neither item alone proves that a transcode will work.
### step
3

### title
Create a reproducible source

### commands
set -o pipefail; ffmpeg -hide_banner -y -f lavfi -i 'testsrc2=size=1280x720:rate=30' -f lavfi -i 'sine=frequency=1000:sample_rate=48000' -t 30 -map 0:v:0 -map 1:a:0 -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 128k "$LAB/input/source.mp4" 2>&1 | tee "$LAB/logs/source-create.txt"
ffprobe -v error -show_format -show_streams -of json "$LAB/input/source.mp4" > "$LAB/logs/source-probe.json"
sha256sum "$LAB/input/source.mp4" > "$LAB/logs/source-sha256.txt"

### notes
The source is deliberately encoded in software. It exists only to supply a known H.264/AAC input to the hardware branch.
### step
4

### title
Optionally start vendor monitoring in a second terminal

### commands
export LAB=/opt/lab-classroom/class60; if command -v intel_gpu_top >/dev/null 2>&1; then timeout 35s intel_gpu_top -J -s 1000 -o "$LAB/logs/intel-gpu-top.json"; else printf 'intel_gpu_top is unavailable.\n' | tee "$LAB/logs/intel-monitor-unavailable.txt"; fi
export LAB=/opt/lab-classroom/class60; if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi dmon -s u -d 1 -c 35 | tee "$LAB/logs/nvidia-dmon.txt"; else printf 'nvidia-smi is unavailable.\n' | tee "$LAB/logs/nvidia-monitor-unavailable.txt"; fi
export LAB=/opt/lab-classroom/class60; for sample in $(seq 1 35); do printf '%s ' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"; cat /sys/class/drm/card*/device/gpu_busy_percent 2>/dev/null || printf 'gpu_busy_percent unavailable'; printf '\n'; sleep 1; done | tee "$LAB/logs/drm-gpu-busy.txt"

### notes
Run only the monitor appropriate to the host. A missing monitoring utility does not itself prove that acceleration is unavailable. Monitoring should overlap the selected transcode.
### step
5

### title
Run the Intel or AMD VA-API branch

### commands
export LAB=/opt/lab-classroom/class60; export HOME="$LAB" XDG_CACHE_HOME="$LAB/cache" XDG_CONFIG_HOME="$LAB/config" TMPDIR="$LAB/tmp"; set -o pipefail; ffmpeg -hide_banner -y -vaapi_device /dev/dri/renderD128 -i "$LAB/input/source.mp4" -map 0:v:0 -map 0:a:0 -vf 'format=nv12,hwupload' -c:v h264_vaapi -b:v 4M -c:a copy "$LAB/output/vaapi-hardware.mp4" 2>&1 | tee "$LAB/logs/vaapi-transcode.txt"

### notes
Use this branch only when a compatible VA-API render node and the h264_vaapi encoder are available. The format and hwupload filters prepare system-memory frames for the hardware encoder.
### step
6

### title
Run the NVIDIA NVENC branch

### commands
export LAB=/opt/lab-classroom/class60; export HOME="$LAB" XDG_CACHE_HOME="$LAB/cache" XDG_CONFIG_HOME="$LAB/config" TMPDIR="$LAB/tmp"; set -o pipefail; ffmpeg -hide_banner -y -i "$LAB/input/source.mp4" -map 0:v:0 -map 0:a:0 -c:v h264_nvenc -b:v 4M -c:a copy "$LAB/output/nvenc-hardware.mp4" 2>&1 | tee "$LAB/logs/nvenc-transcode.txt"

### notes
Use this branch only when h264_nvenc is listed and an NVIDIA device is available. This command verifies hardware encoding; it does not claim hardware decoding because no hardware decoder was explicitly selected.
### step
7

### title
Validate the selected output

### commands
export LAB=/opt/lab-classroom/class60; if test -s "$LAB/output/vaapi-hardware.mp4"; then OUTPUT="$LAB/output/vaapi-hardware.mp4"; elif test -s "$LAB/output/nvenc-hardware.mp4"; then OUTPUT="$LAB/output/nvenc-hardware.mp4"; else printf 'No non-empty hardware output was found.\n'; exit 1; fi; printf '%s\n' "$OUTPUT" | tee "$LAB/logs/selected-output.txt"; ffprobe -v error -show_format -show_streams -of json "$OUTPUT" > "$LAB/logs/output-probe.json"; ffmpeg -v error -i "$OUTPUT" -map 0:v:0 -f null -; sha256sum "$OUTPUT" > "$LAB/logs/output-sha256.txt"
grep -E 'h264_vaapi|h264_nvenc' "$LAB/logs/vaapi-transcode.txt" "$LAB/logs/nvenc-transcode.txt" 2>/dev/null | tee "$LAB/logs/hardware-encoder-log-evidence.txt"
grep -E '"codec_name": "h264"|"codec_type": "video"|"codec_type": "audio"' "$LAB/logs/output-probe.json" | tee "$LAB/logs/output-stream-summary.txt"

### notes
A complete decode to FFmpeg's null muxer checks the whole video stream without creating another media file. The output probe verifies stream structure, while the original transcode log identifies the encoder implementation.

## Expected results

- The workspace contains input, output, logs, cache, config, and tmp subdirectories beneath /opt/lab-classroom/class60/.
- The generated source.mp4 is non-empty and FFprobe reports one H.264 video stream and one audio stream.
- At least one relevant hardware encoder name appears in hardware-encoder-candidates.txt when the installed FFmpeg build supports the local platform.
- The selected hardware command exits successfully and creates either vaapi-hardware.mp4 or nvenc-hardware.mp4.
- The selected transcode log names h264_vaapi or h264_nvenc rather than libx264.
- FFprobe reports an H.264 video stream in the selected output.
- The complete output decode command produces no error message and exits successfully.
- When a compatible monitoring interface is available, its log shows activity overlapping the transcode; no universal utilization percentage or frame-rate target is assumed.
- The source and output SHA-256 records exist for artifact identification, but different hashes alone are not proof of hardware acceleration.

## Verification

- [ ] Confirm the workspace boundary with: printf '%s\n' "$LAB". It must equal /opt/lab-classroom/class60.
- [ ] Confirm the source exists with: test -s /opt/lab-classroom/class60/input/source.mp4.
- [ ] Review /opt/lab-classroom/class60/logs/hardware-encoder-candidates.txt and verify that the encoder used by the selected branch was listed before the test.
- [ ] For VA-API, verify that /dev/dri/renderD128 was visible and that the transcode log contains h264_vaapi.
- [ ] For NVIDIA, verify that nvidia-smi identified a device and that the transcode log contains h264_nvenc.
- [ ] Confirm that /opt/lab-classroom/class60/logs/output-probe.json identifies an H.264 video stream and contains no FFprobe-generated error.
- [ ] Repeat the full decode check against the selected output; a zero exit status demonstrates that FFmpeg could read the entire video stream.
- [ ] Correlate the transcode time window with intel-gpu-top.json, nvidia-dmon.txt, or drm-gpu-busy.txt when an applicable monitor is available.
- [ ] Do not treat low CPU usage, output-file existence, device-node existence, or a changed checksum as sufficient standalone proof.
- [ ] Record which stages were accelerated. The NVENC command in this lab proves hardware encoding but intentionally does not prove hardware decoding.

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| No hardware encoder candidates appear in the FFmpeg encoder list. | The installed FFmpeg build lacks the required VA-API or NVENC integration. | Use a distribution or application build that explicitly includes the needed encoder. Re-run the capability inventory before attempting the transcode. |
| The VA-API command reports that /dev/dri/renderD128 cannot be opened. | The render node is absent, the wrong render-node number was selected, the driver is not active, or the learner lacks access. | Inspect the read-only /dev/dri listing, identify the correct render node, and have the system administrator grant narrowly scoped device access through the platform's normal GPU-access mechanism. |
| The VA-API command reports an unsupported profile, entry point, or pixel format. | The GPU generation or userspace driver does not support the requested H.264 encoding mode or input surface format. | Confirm codec support for the exact GPU generation and driver, retain the nv12 conversion, and test a codec and profile that the hardware documentation lists as encodable. |
| The NVENC command reports that no capable device is found. | The GPU is not exposed, the NVIDIA driver is unavailable, or the device does not provide the requested encoding capability. | Confirm that nvidia-smi identifies the device and review the GPU's encode support in NVIDIA's official compatibility information. |
| FFmpeg recognizes h264_nvenc but reports a driver or library version error. | The FFmpeg build, NVIDIA userspace libraries, and installed driver are incompatible. | Align the FFmpeg package and NVIDIA driver stack using supported versions from the operating-system or application vendor. |
| The hardware output exists but is zero bytes or incomplete. | The encoder initialized but failed during frame processing, or a piped command failure was overlooked. | Review the complete vendor transcode log, ensure pipefail was enabled, remove only the failed output inside the class workspace during rollback, and rerun after correcting the reported cause. |
| FFprobe accepts the output, but the full decode check fails. | The container metadata is readable while one or more encoded packets are corrupt or incomplete. | Treat the job as failed. Review the transcode log for device resets, storage errors, unsupported parameters, or premature termination. |
| GPU monitoring shows no obvious activity even though the hardware encoder command succeeded. | The sampling interval missed a short job, the monitor reports a different engine, or the monitoring interface is unsupported. | Start monitoring before the transcode, use a longer representative input within the workspace, and consult vendor documentation for the field corresponding to video encode activity. |
| The command succeeds on the host but fails inside a media-server container. | The container lacks the required device node, compatible userspace library, or device access. | Compare encoder inventory and device visibility inside and outside the container. Expose only the required GPU device and compatible libraries through the container platform's documented mechanism. |
| CPU utilization remains noticeable during a successful hardware encode. | Demuxing, software decoding, audio processing, frame conversion, copying, or muxing still uses the CPU. | Identify each pipeline stage before optimizing. Do not classify the encode as a failure solely because CPU work remains. |

## Security

### principles
Grant GPU access only to the account or service that performs transcoding.
Prefer render-node access over broader privileged execution when the platform supports it.
Do not expose unrelated host devices to a media-server container.
Treat media files as untrusted input because demuxers, decoders, subtitle parsers, and metadata readers process complex binary formats.
Keep media applications and GPU drivers maintained with vendor-supported security updates.
Avoid placing credentials, production media, or private metadata in the class workspace.
Retain logs only as long as needed because real-world application logs can disclose file names, media metadata, account names, and device details.

### least_privilege
This lab does not require changing device permissions or running the transcoder as a broadly privileged service. If the learner cannot access the device, an administrator should use the platform's normal narrowly scoped GPU-access controls rather than weakening access globally.

### validation_note
Successful hardware encoding confirms functionality, not isolation. Container device exposure and host driver trust remain separate security decisions.

## Rollback

### goal
Return the class workspace to its pre-lab state without changing GPU drivers, device permissions, application packages, or production media.

### procedure
Stop any FFmpeg or monitoring process started specifically for this class.
Review /opt/lab-classroom/class60/logs/selected-output.txt if evidence must be retained.
Delete only the generated files and subdirectories beneath /opt/lab-classroom/class60/ using the classroom platform's approved file-management method.
Leave /dev/dri, system driver files, application configuration, and production libraries unchanged.
Unset LAB, HOME, XDG_CACHE_HOME, XDG_CONFIG_HOME, and TMPDIR in the current shell, or close the laboratory shell session.

### post_rollback_verification
Confirm that no class FFmpeg process remains and that no intended production service was stopped or reconfigured. The laboratory makes no persistent driver, package, permission, boot, or service changes.

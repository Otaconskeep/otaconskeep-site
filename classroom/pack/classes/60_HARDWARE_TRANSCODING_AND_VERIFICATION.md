# Class 60: Hardware Transcoding and Verification

**Learning objective:** Distinguish decoding, filtering, encoding, and container muxing as separate stages of a transcoding pipeline.; Inventory the hardware encoders compiled into the local FFmpeg installation.; Identify whether an Intel or AMD render device or an NVIDIA GPU is exposed to the host.; Create a reproducible synthetic source file without using copyrighted media.; Run one vendor-appropriate hardware encoding path while keeping all generated files inside the class workspace.; Verify acceleration using encoder logs, device visibility, output validation, and GPU activity evidence.; Recognize misleading evidence such as a valid output file, low CPU use, or a codec name without a hardware-specific encoder name.; Explain why hardware support can fail at the application, driver, permission, device exposure, codec, profile, or pixel-format layer.
**Bloom level:** Understand / Apply
**Track:** Media Services and GPU Acceleration · **Difficulty:** advanced · **Duration:** ~75 minutes · **Lab risk:** medium
**Build output:** Teach learners to identify available video acceleration capabilities, perform a controlled hardware-accelerated H.264 transcode, and verify that a hardware encoder was actually used rather than assuming acceleration from a successful output file or reduced CPU activity.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### primary_platform
Linux with FFmpeg and a supported Intel, AMD, or NVIDIA GPU

### intel
The VA-API branch is intended for Intel GPUs with a compatible kernel driver, userspace media driver, render node, and H.264 encode support.

### amd
The VA-API branch may be used with supported AMD GPUs and Mesa components when H.264 encoding is exposed through VA-API.

### nvidia
The NVENC branch requires an NVIDIA GPU with encoding support, a compatible driver, required userspace libraries, and an FFmpeg build containing h264_nvenc.

### virtualization
PCI passthrough, mediated devices, and container device exposure must present both the device interface and compatible userspace libraries. Hypervisor display adapters generally do not imply media-encode support.

### unsupported_or_not_covered
This lab does not provide a Windows Direct3D, macOS VideoToolbox, or production media-server configuration procedure.

### version_variance
Available codecs, profiles, pixel formats, monitoring fields, and command behavior vary by GPU generation, driver, operating system, and FFmpeg build. Inspect local help output and official vendor documentation when a listed option differs.

## Learning objective

- Distinguish decoding, filtering, encoding, and container muxing as separate stages of a transcoding pipeline.
- Inventory the hardware encoders compiled into the local FFmpeg installation.
- Identify whether an Intel or AMD render device or an NVIDIA GPU is exposed to the host.
- Create a reproducible synthetic source file without using copyrighted media.
- Run one vendor-appropriate hardware encoding path while keeping all generated files inside the class workspace.
- Verify acceleration using encoder logs, device visibility, output validation, and GPU activity evidence.
- Recognize misleading evidence such as a valid output file, low CPU use, or a codec name without a hardware-specific encoder name.
- Explain why hardware support can fail at the application, driver, permission, device exposure, codec, profile, or pixel-format layer.

## Why this matters

Teach learners to identify available video acceleration capabilities, perform a controlled hardware-accelerated H.264 transcode, and verify that a hardware encoder was actually used rather than assuming acceleration from a successful output file or reduced CPU activity.

## Prerequisites

- A Linux homelab host or virtual machine with FFmpeg and FFprobe installed.
- A supported Intel, AMD, or NVIDIA GPU exposed to the operating system.
- Permission to read the relevant GPU device and monitoring interfaces.
- The directory /opt/lab-classroom/class60/ must already exist and be writable by the learner.
- Basic familiarity with codecs, containers, shell pipelines, and media server terminology.
- At least 1 GB of free space beneath /opt/lab-classroom/class60/.
- No production media library is required or used.

## Required reading

- FFmpeg documentation: https://ffmpeg.org/ffmpeg.html
- FFmpeg codec documentation: https://ffmpeg.org/ffmpeg-codecs.html
- FFmpeg filter documentation, especially hardware upload and format filters: https://ffmpeg.org/ffmpeg-filters.html
- Linux DRM render-node documentation: https://www.kernel.org/doc/html/latest/gpu/drm-uapi.html
- NVIDIA Video Codec SDK documentation: https://developer.nvidia.com/video-codec-sdk

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| Transcoding | Decoding an existing media stream and encoding it into a new representation, often with a different codec, bitrate, resolution, profile, or pixel format. |
| Hardware encoder | A fixed-function or GPU-associated media engine that performs video encoding through an interface such as VA-API or NVENC. |
| Hardware decoder | A media engine that converts compressed video into frames. Hardware decoding and hardware encoding are independent capabilities. |
| VA-API | A Linux video acceleration API commonly used with Intel and AMD devices for accelerated decode, encode, and video processing. |
| NVENC | NVIDIA's dedicated hardware video encoding interface. |
| Render node | A Linux DRM device, commonly named /dev/dri/renderD128 or similarly, through which unprivileged applications can submit supported GPU work. |
| Pixel format | The in-memory organization and chroma representation of video frames, such as yuv420p or nv12. |
| Hardware upload | The transfer of frames from system memory into hardware-managed surfaces before a hardware filter or encoder consumes them. |
| Zero-copy pipeline | A pipeline designed to keep frames in hardware-managed memory between stages, reducing transfers between system memory and the GPU. |
| Software fallback | The use of a CPU encoder or decoder when the intended hardware path is unavailable, unsupported, or not selected. |
| Container | A file structure such as MP4 or Matroska that stores encoded video, audio, subtitles, timestamps, and metadata. |
| Encoder capability | The combination of codecs, profiles, bit depths, resolutions, rate-control modes, and pixel formats accepted by a specific encoder implementation. |

## Instruction

A transcoding job is a pipeline rather than one indivisible operation. The input container is demuxed, compressed packets are decoded into frames, optional filters transform those frames, an encoder produces a new compressed stream, and a muxer writes the result into an output container. Any one of these stages may run in software while another uses hardware. For example, an FFmpeg command can decode H.264 on the CPU and still encode H.264 through NVENC. That is a hardware encode, but it is not a completely hardware-resident pipeline.

Verification must therefore match the claim being made. If the claim is only that hardware encoding occurred, the strongest practical evidence is a successful invocation of an explicitly hardware-specific encoder such as h264_vaapi or h264_nvenc, accompanied by a clean FFmpeg exit, a valid decoded output, and observed activity from the associated GPU during the job. A valid output file by itself proves only that some encoding path succeeded. Low CPU utilization is also insufficient because the source may be easy to process, the host may have many cores, or the operation may be limited by storage or synchronization.

FFmpeg's encoder inventory reports what the installed FFmpeg build knows how to invoke; it does not prove that the matching device, driver, permissions, or firmware are available. Conversely, the presence of a render node proves only that a DRM interface exists. A working path requires alignment across the application build, userspace driver, kernel driver, physical or virtual device exposure, permissions, codec support, profile, resolution, and pixel format. Containers add another boundary because both device nodes and supporting driver libraries must be visible inside the container.

The lab uses a synthetic source so results are reproducible and independent of personal media. The software-created source is not a performance baseline and no expected frame rate is prescribed. Hardware generations and driver stacks vary too widely for a universal throughput target. Success is instead defined by evidence: the intended hardware encoder appears in the installed FFmpeg build, its corresponding device is accessible, FFmpeg names that encoder during the run, the process exits successfully, FFprobe recognizes the resulting stream, a complete decode test reports no error, and monitoring shows device activity when an appropriate vendor tool is available.

Hardware acceleration should also be evaluated against the media server's actual workload. Subtitle burn-in, tone mapping, scaling, unusual bit depth, unsupported profiles, or an incompatible output codec can force frame downloads or software processing. A pipeline that works for an 8-bit H.264 test source may still fail for 10-bit HEVC, AV1, HDR tone mapping, or image-based subtitles. Verification should consequently be repeated with representative but non-sensitive test material before declaring a production configuration ready.

## Architecture

### pipeline
Synthetic lavfi video and audio sources
Software source encoder creates a controlled H.264/AAC input
MP4 demuxer reads the source
Software or hardware decoder produces frames
Pixel-format conversion prepares frames for the selected hardware encoder
VA-API or NVENC encoder produces H.264 packets
MP4 muxer writes the laboratory output
FFprobe and a full decode pass validate the output

### evidence_layers
Capability evidence: FFmpeg lists the requested hardware encoder.
Exposure evidence: the expected device interface is visible and readable.
Invocation evidence: the FFmpeg log identifies the selected hardware encoder.
Runtime evidence: a vendor-appropriate monitor records GPU or video-engine activity during the job.
Artifact evidence: FFprobe recognizes the output and a complete decode test succeeds.

### workspace
/opt/lab-classroom/class60/

### data_flow
input/source.mp4 -> decoder -> frame conversion or upload -> hardware H.264 encoder -> output/vendor-hardware.mp4 -> probe and decode verification

### trust_boundary_note
GPU device access crosses from the learner process into a kernel driver and device firmware. Device access should be granted only to the account or service that requires it.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

### assignment
Draw the transcoding pipeline used by your selected branch and label each stage as software, hardware, or not conclusively verified.
Compare the official codec capabilities of your exact GPU model with the H.264 test performed in class.
Identify whether your GPU supports HEVC and AV1 encode, decode, both, or neither. Cite vendor documentation.
Choose one production-relevant complication, such as HDR tone mapping, subtitle burn-in, 10-bit input, or scaling, and explain where it would enter the pipeline.
Write a verification checklist for a media server that separates capability, device exposure, invocation, runtime activity, output validity, and playback compatibility.
Do not report performance conclusions unless you design a repeated test with controlled source material, identical output settings, thermal observations, and clearly documented measurement methods.

### deliverable
Submit the pipeline diagram, capability citations, verification checklist, selected logs from the class workspace, and a short statement describing exactly what the evidence proves and what it does not prove.

## Feynman teach-back

### prompt
Explain hardware transcoding to a learner who believes that any successful MP4 output proves the GPU performed all the work.

### model_explanation
An MP4 file is only the finished box. It does not reveal which worker packed it. FFmpeg can unpack the input, decode frames, resize them, encode them, and pack the result again. The CPU may perform every step, or a GPU media engine may perform only one step. To prove hardware encoding, we deliberately choose a hardware-specific encoder, confirm the matching device is available, preserve the encoder's log, observe the device during the job when possible, and validate the output afterward. Even then, we claim only the stage we tested. If we selected NVENC for encoding but used the normal input path, we proved hardware encoding, not hardware decoding or a zero-copy pipeline.

## Retrieval check

1. 1. Why does the presence of h264_vaapi or h264_nvenc in FFmpeg's encoder list not prove that a hardware transcode will succeed?
2. 2. What does the NVENC command in this lab prove, and what acceleration stage does it intentionally not prove?
3. 3. Why is a valid MP4 output insufficient as standalone evidence of hardware encoding?
4. 4. What is the purpose of the format=nv12,hwupload filter chain in the VA-API branch?
5. 5. Name three independent evidence layers used to verify hardware encoding.
6. 6. Why can CPU utilization remain noticeable during a valid hardware-encoded transcode?
7. 7. What does the complete decode-to-null verification test establish?
8. 8. Why should no universal frame-rate or GPU-utilization threshold be expected in this lab?
9. 9. What is software fallback, and why can it mislead an operator?
10. 10. If FFmpeg works on the host but fails inside a container, which two categories of dependencies should be checked first?

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

## Verification checkpoints

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

## Security considerations

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

## Video narration notes

Begin by showing the pipeline as separate blocks: demux, decode, filter, encode, and mux. Emphasize that saying a transcode is hardware accelerated is incomplete unless the accelerated stage is named. Open the FFmpeg encoder inventory and point out hardware-specific names such as h264_vaapi and h264_nvenc. Explain that an encoder listed in the application is a capability candidate, not proof that a local GPU can execute it.

Next, inspect device visibility. On Intel and AMD Linux systems, show the DRM render nodes. On NVIDIA systems, show the device reported by the vendor management utility. Explain that device visibility is another prerequisite rather than final proof.

Create the synthetic test source and identify its H.264 video and audio streams with FFprobe. State clearly that this initial file is encoded in software and is not a performance benchmark. Start the appropriate monitoring view in another terminal, then run exactly one hardware branch. During the VA-API example, describe how nv12 conversion and hardware upload prepare frames for the encoder. During the NVIDIA example, point out that the command selects NVENC for encoding but leaves decoding unspecified, so the resulting claim must remain limited to hardware encoding.

After the job completes, inspect the saved FFmpeg log for the hardware-specific encoder name. Probe the output, then decode the entire video stream to the null muxer. Explain why each check answers a different question: the log identifies the requested implementation, monitoring associates work with the device, FFprobe checks the stream structure, and the full decode pass checks the complete artifact.

Conclude by showing examples of weak evidence: a low CPU graph, a visible GPU device, or a playable output file. None is conclusive alone. The defensible conclusion combines capability, exposure, invocation, runtime, and artifact evidence while avoiding claims about stages that were not explicitly tested.

## References

- FFmpeg main documentation: https://ffmpeg.org/ffmpeg.html
- FFmpeg codecs documentation: https://ffmpeg.org/ffmpeg-codecs.html
- FFmpeg filters documentation: https://ffmpeg.org/ffmpeg-filters.html
- FFmpeg formats documentation: https://ffmpeg.org/ffmpeg-formats.html
- FFprobe documentation: https://ffmpeg.org/ffprobe.html
- Linux DRM userspace API documentation: https://www.kernel.org/doc/html/latest/gpu/drm-uapi.html
- Intel media driver project: https://github.com/intel/media-driver
- Mesa VA-API state tracker documentation: https://docs.mesa3d.org/gallium/state_trackers/va.html
- NVIDIA Video Codec SDK documentation: https://developer.nvidia.com/video-codec-sdk
- NVIDIA Video Encode and Decode GPU Support Matrix: https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix-new

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

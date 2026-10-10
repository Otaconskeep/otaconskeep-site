# Reading: Hardware Transcoding and Verification

**Module:** Requests & Media Servers
**Activity type:** Reading (Learn)
**Objective:** Distinguish decoding, filtering, encoding, and container muxing as separate stages of a transcoding pipeline.

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

## Required reading

- FFmpeg documentation: https://ffmpeg.org/ffmpeg.html
- FFmpeg codec documentation: https://ffmpeg.org/ffmpeg-codecs.html
- FFmpeg filter documentation, especially hardware upload and format filters: https://ffmpeg.org/ffmpeg-filters.html
- Linux DRM render-node documentation: https://www.kernel.org/doc/html/latest/gpu/drm-uapi.html
- NVIDIA Video Codec SDK documentation: https://developer.nvidia.com/video-codec-sdk

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

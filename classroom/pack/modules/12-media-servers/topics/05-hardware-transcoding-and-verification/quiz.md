# Quiz: Hardware Transcoding and Verification

**Module:** Requests & Media Servers
**Activity type:** Quiz / retrieval practice
**Target:** ≥80%
**Objective:** Distinguish decoding, filtering, encoding, and container muxing as separate stages of a transcoding pipeline.

## Questions

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

## After scoring

- Missed items → return to Reading → redo Feynman Retry → reattempt.

<!-- answer key is maintained in instructor materials / automation batch report; not printed for students -->

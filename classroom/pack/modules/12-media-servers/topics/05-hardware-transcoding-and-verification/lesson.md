# Lesson 12.05: Hardware Transcoding and Verification

**Module:** Requests & Media Servers
**Activity type:** Lesson (Orient → Recall → Learn → Explain → Reflect)
**Learning objective:** Distinguish decoding, filtering, encoding, and container muxing as separate stages of a transcoding pipeline.
**Bloom level:** Understand / Apply
**Last reviewed:** 2025-03-08

## Learning objective

Distinguish decoding, filtering, encoding, and container muxing as separate stages of a transcoding pipeline.

## Why this matters

Teach learners to identify available video acceleration capabilities, perform a controlled hardware-accelerated H.264 transcode, and verify that a hardware encoder was actually used rather than assuming acceleration from a successful output file or reduced CPU activity.

## Learn

Complete the module reading first:

- [Reading](./reading.md)

## Feynman teach-back (required)

### prompt
Explain hardware transcoding to a learner who believes that any successful MP4 output proves the GPU performed all the work.

### model_explanation
An MP4 file is only the finished box. It does not reveal which worker packed it. FFmpeg can unpack the input, decode frames, resize them, encode them, and pack the result again. The CPU may perform every step, or a GPU media engine may perform only one step. To prove hardware encoding, we deliberately choose a hardware-specific encoder, confirm the matching device is available, preserve the encoder's log, observe the device during the job when possible, and validate the output afterward. Even then, we claim only the stage we tested. If we selected NVENC for encoding but used the normal input path, we proved hardware encoding, not hardware decoding or a zero-copy pipeline.

## Reflection

1. What did I learn?
2. What did I struggle with?
3. How does this connect to earlier classes?

## Topic path (do in order)

| Step | Activity | Purpose |
|---|---|---|
| 1 | [Reading](./reading.md) | Learn |
| 2 | This lesson (Feynman) | Explain |
| 3 | [Lab](./lab.md) | Practice |
| 4 | [Homework](./homework.md) | Apply |
| 5 | [Quiz](./quiz.md) | Test |

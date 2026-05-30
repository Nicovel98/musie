#!/usr/bin/env node
/*
Automated playback fluency test using Playwright.
Usage:
  npx playwright install chromium
  node ./frontend/tools/playback-test.js <path-to-audio-file> [durationSeconds|--until-end]
Example:
  node ./frontend/tools/playback-test.js ../../music/large.mp3 30

The script launches a headless Chromium allowing autoplay, plays the provided audio muted,
and samples audio.currentTime periodically to detect stalls or pauses.
It prints a summary and exits with code 0 (ok), 2 (stalls detected), or 3 (test error).
*/

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  let audioRel = process.argv[2];
  const durationArg = process.argv[3] || '30';
  const durationSeconds = durationArg === '--until-end' ? 0 : parseInt(durationArg, 10);
  let exitCode = 0;

  if (!audioRel) {
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    audioRel = await new Promise((resolve) => {
      rl.question('Path to audio file for playback test: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  const audioPath = path.resolve(audioRel);
  if (!fs.existsSync(audioPath)) {
    console.error('Audio file not found:', audioPath);
    return 1;
  }

  const fileUrl = 'file://' + audioPath;
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    const result = await page.evaluate(
      async ({ fileUrl, durationSeconds }) => {
        const sampleMs = 200;
        const allowedDrift = 0.15; // seconds

        const audio = new Audio();
        audio.src = fileUrl;
        audio.muted = true;
        audio.preload = 'auto';
        audio.autoplay = true;

        try {
          await audio.play();
        } catch {
          // ignore; we'll still monitor currentTime
        }

        // Mark finished when the native audio element fires 'ended'. Also try to
        // attach to Howler if the app uses it so we can reliably detect song end
        // for --until-end runs.
        try {
          // @ts-ignore
          window.__playback_done = false;
          if (audio) {
            audio.addEventListener('ended', () => {
              try {
                // @ts-ignore
                window.__playback_done = true;
              } catch (e) {}
            });
          }
          try {
            // @ts-ignore
            if (window.Howler && window.Howler._howls && window.Howler._howls.length) {
              try {
                // @ts-ignore
                const hw = window.Howler._howls[0];
                if (hw && typeof hw.on === 'function') {
                  try { hw.on('end', () => { window.__playback_done = true; }); } catch (e) {}
                }
              } catch (e) {}
            }
          } catch (e) {}
        } catch (e) {}

        const samples = [];
        const start = performance.now();
        const observeUntilEnd = durationSeconds <= 0;
        const endAt = start + (observeUntilEnd ? 60 * 60 * 1000 : durationSeconds * 1000);

        while (performance.now() < endAt) {
          const now = performance.now();
          samples.push({
            t: now,
            currentTime: audio.currentTime,
            paused: audio.paused,
            ended: audio.ended,
            duration: Number.isFinite(audio.duration) ? audio.duration : 0,
          });
          // If running until end, break when either the native 'ended' fired
          // or when duration is known and currentTime is at the end.
          if (
            observeUntilEnd &&
            (typeof window.__playback_done !== 'undefined' && window.__playback_done === true || (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.25))
          )
            break;
          await new Promise((r) => setTimeout(r, sampleMs));
        }

        const deltas = [];
        for (let i = 1; i < samples.length; i++) {
          const dtTime = samples[i].currentTime - samples[i - 1].currentTime;
          const dtWall = (samples[i].t - samples[i - 1].t) / 1000;
          deltas.push({ dtTime, dtWall, paused: samples[i].paused });
        }

        const maxGap = deltas.reduce((m, d) => Math.max(m, Math.abs(d.dtWall - d.dtTime)), 0);
        const stalls = deltas.filter((d) => d.paused || d.dtTime < d.dtWall * 0.5 || Math.abs(d.dtWall - d.dtTime) > allowedDrift);

        return {
          samples: samples.length,
          deltas: deltas.length,
          maxGap,
          stalls: stalls.length,
          details: stalls.slice(0, 5),
        };
      },
      { fileUrl, durationSeconds }
    );

    console.log('Playback test summary for', fileUrl);
    console.log('  samples collected:', result.samples);
    console.log('  deltas checked:', result.deltas);
    console.log('  max wall/currentTime gap (s):', result.maxGap.toFixed(3));
    console.log('  stalls detected:', result.stalls);
    if (result.stalls > 0) {
      console.log('  example stalls:', result.details);
      exitCode = 2;
      return exitCode;
    }

    exitCode = 0;
    return exitCode;
  } catch (err) {
    console.error('Error during test:', err);
    exitCode = 3;
    return exitCode;
  } finally {
    await browser.close();
  }
}

run().then((code) => process.exit(code)).catch(() => process.exit(3));

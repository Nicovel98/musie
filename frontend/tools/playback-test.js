#!/usr/bin/env node
/*
Automated playback fluency test using Playwright.
Usage:
  npx playwright install chromium
  node ./frontend/tools/playback-test.js <path-to-audio-file> [durationSeconds]
Example:
  node ./frontend/tools/playback-test.js ../../music/large.mp3 30

The script launches a headless Chromium allowing autoplay, plays the provided audio muted,
and samples audio.currentTime periodically to detect stalls or pauses.
It prints a summary and exits with code 0 (ok) or 2 (stalls detected).
*/

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  let audioRel = process.argv[2];
  const durationArg = process.argv[3] || '30';
  const durationSeconds = durationArg === '--until-end' ? 0 : parseInt(durationArg, 10);

  if (!audioRel) {
    // ask interactively
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
    process.exit(1);
  }

  const fileUrl = 'file://' + audioPath;

  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const result = await page.evaluate(
      async ({ fileUrl, durationSeconds }) => {
        const sampleMs = 200;
        const allowedDrift = 0.15; // seconds

        const audio = new Audio();
        audio.src = fileUrl;
        audio.muted = true;
        audio.preload = 'auto';
        audio.autoplay = true;

        // try to play (some environments still may reject)
        try {
          await audio.play();
        } catch (err) {
          // ignore; we'll still monitor currentTime
        }

        const samples = [];
        const start = performance.now();

        const observeUntilEnd = durationSeconds <= 0;
        const endAt = start + (observeUntilEnd ? 60 * 60 * 1000 : durationSeconds * 1000);
        while (performance.now() < endAt) {
          const now = performance.now();
          samples.push({ t: now, currentTime: audio.currentTime, paused: audio.paused, ended: audio.ended, duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
          if (observeUntilEnd && audio.ended) break;
          if (observeUntilEnd && Number.isFinite(audio.duration) && audio.currentTime >= audio.duration - 0.25) break;
          await new Promise((r) => setTimeout(r, sampleMs));
        }

        // compute deltas
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
      await browser.close();
      process.exit(2);
    }

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err);
    await browser.close();
    process.exit(3);
  }
}

run();

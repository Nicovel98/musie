#!/usr/bin/env node
/*
Compare playback fluency with and without a simulated visualizer.
Usage:
  node ./frontend/tools/playback-compare.js <path-to-audio> [durationSeconds]

This script runs two tests (no viz, with viz) using Playwright headless Chromium and
reports stalls for each run, plus a short comparison summary.
*/

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function runScenario({ fileUrl, durationSeconds, simulateViz }) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const result = await page.evaluate(
      async ({ fileUrl, durationSeconds, simulateViz }) => {
        const sampleMs = 200;
        const allowedDrift = 0.15; // seconds

        const audio = new Audio();
        audio.src = fileUrl;
        audio.muted = true;
        audio.preload = 'auto';
        audio.autoplay = true;

        // start simulated visualizer on the main thread if requested
        let vizHandle = null;
        if (simulateViz) {
          // Simple CPU work: run small FFT-like ops each animation frame
          vizHandle = { running: true };
          const work = () => {
            if (!vizHandle.running) return;
            // allocate a small array and do some math to simulate CPU
            const n = 256;
            const arr = new Uint8Array(n);
            for (let i = 0; i < n; i++) arr[i] = (Math.sin(i) * 128 + 128) & 255;
            // reduce
            let s = 0;
            for (let i = 0; i < n; i++) s += arr[i] * Math.random();
            // schedule next frame
            requestAnimationFrame(work);
          };
          requestAnimationFrame(work);
        }

        try {
          await audio.play();
        } catch (err) {
          // ignore
        }

        const samples = [];
        const start = performance.now();
        const endAt = start + durationSeconds * 1000;
        while (performance.now() < endAt) {
          const now = performance.now();
          samples.push({ t: now, currentTime: audio.currentTime, paused: audio.paused });
          await new Promise((r) => setTimeout(r, sampleMs));
        }

        if (vizHandle) vizHandle.running = false;

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
        };
      },
      { fileUrl, durationSeconds, simulateViz }
    );

    await browser.close();
    return result;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

async function main() {
  let audioRel = process.argv[2];
  const durationSeconds = parseInt(process.argv[3] || '30', 10);

  if (!audioRel) {
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    audioRel = await new Promise((resolve) => {
      rl.question('Path to audio file for compare test: ', (answer) => {
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

  console.log('Running playback compare for', fileUrl, 'duration', durationSeconds, 's');

  console.log('\n1) Running WITHOUT simulated visualizer...');
  const noViz = await runScenario({ fileUrl, durationSeconds, simulateViz: false });
  console.log('  samples:', noViz.samples, 'deltas:', noViz.deltas, 'stalls:', noViz.stalls, 'maxGap(s):', noViz.maxGap.toFixed(3));

  console.log('\n2) Running WITH simulated visualizer (main-thread work)...');
  const withViz = await runScenario({ fileUrl, durationSeconds, simulateViz: true });
  console.log('  samples:', withViz.samples, 'deltas:', withViz.deltas, 'stalls:', withViz.stalls, 'maxGap(s):', withViz.maxGap.toFixed(3));

  console.log('\nComparison:');
  console.log('  stalls without viz:', noViz.stalls, 'with viz:', withViz.stalls);
  console.log('  maxGap w/o viz:', noViz.maxGap.toFixed(3), 's; with viz:', withViz.maxGap.toFixed(3), 's');

  if (withViz.stalls > noViz.stalls) {
    console.log('\nResult: visualizer simulation increased stalls — likely a performance impact.');
    process.exit(2);
  }

  console.log('\nResult: no increased stalls detected in this run.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running compare:', err);
  process.exit(3);
});

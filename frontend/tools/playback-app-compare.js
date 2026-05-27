#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const positionals = [];
  let untilEnd = false;

  for (const arg of argv) {
    if (arg === '--until-end') {
      untilEnd = true;
      continue;
    }

    positionals.push(arg);
  }

  const audioRel = positionals[0] || null;
  const secondArg = positionals[1] || null;
  const thirdArg = positionals[2] || null;
  let durationSeconds = 30;
  let appUrl = null;

  if (secondArg) {
    if (/^https?:\/\//i.test(secondArg)) {
      appUrl = secondArg;
    } else if (/^\d+(\.\d+)?$/.test(secondArg)) {
      durationSeconds = parseFloat(secondArg);
    } else {
      appUrl = secondArg;
    }
  }

  if (thirdArg) {
    appUrl = thirdArg;
  }

  if (untilEnd) {
    durationSeconds = 0;
  }

  return {
    audioRel,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 30,
    appUrl,
    untilEnd,
  };
}

function formatSeconds(totalSeconds) {
  const total = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

// Simple static audio server with range support
function startAudioServer(audioPath, port = 8001) {
  const server = http.createServer((req, res) => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    if (req.url !== '/test-audio') {
      res.writeHead(404, corsHeaders);
      res.end('Not found');
      return;
    }

    const stat = fs.statSync(audioPath);
    const total = stat.size;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      if (start >= total || end >= total) {
        res.writeHead(416, { ...corsHeaders, 'Content-Range': `bytes */${total}` });
        return res.end();
      }
      res.writeHead(206, {
        ...corsHeaders,
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(audioPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        ...corsHeaders,
        'Content-Length': total,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(audioPath).pipe(res);
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

function waitForUrl(url, timeout = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function ping() {
      http
        .get(url, (res) => {
          resolve();
        })
        .on('error', (err) => {
          if (Date.now() - start > timeout) return reject(new Error('timeout'));
          setTimeout(ping, 200);
        });
    })();
  });
}

async function runScenarioOnApp({ browser, appUrl, durationSeconds }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageLogs = [];
  page.on('console', (msg) => {
    try {
      pageLogs.push({ type: msg.type(), text: msg.text(), location: msg.location() });
    } catch (e) {
      try { pageLogs.push({ type: 'error', text: String(msg), location: null }); } catch {}
    }
  });
  // Navigate to the app URL from the node process (avoids destroying evaluate context)
  await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);

  // Try to auto-start playback: resume AudioContext and call play on Howler or audio element
  try {
    await page.evaluate(() => {
      try {
        const start = Date.now();
        const attempt = async () => {
          try {
            // @ts-ignore
            if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
              // @ts-ignore
              window.Howler.ctx.resume().catch(() => {});
            }

            // Try Howler play if available
            // @ts-ignore
            if (window.Howler && window.Howler._howls && window.Howler._howls.length) {
              try {
                // @ts-ignore
                window.Howler._howls[0].play();
              } catch (e) {
                // ignore
              }
            }

            const audio = document.querySelector('audio');
            if (audio && audio.paused) {
              try {
                // try to play the element
                audio.play().catch(() => {});
              } catch (e) {}
            }
          } catch (e) {}

          const audioNow = document.querySelector('audio');
          const pausedNow = audioNow ? audioNow.paused : true;
          if (Date.now() - start < 3000 && pausedNow) {
            setTimeout(attempt, 200);
          } else {
            console.debug('[audio-event] autoplay-attempt-done', { paused: pausedNow });
          }
        };
        setTimeout(attempt, 100);
      } catch (e) {}
    });
  } catch (e) {
    // ignore
  }

  // Additionally try user-gesture like clicks + Space to bypass autoplay restrictions
  try {
    const playSelectors = ['button.play', 'button[aria-label="Play"]', '[data-testid="play"]', '.player-play', '.play-btn'];
    let clicked = false;
    for (const sel of playSelectors) {
      try {
        const handle = await page.$(sel);
        if (handle) {
          await handle.click().catch(() => {});
          clicked = true;
          break;
        }
      } catch (e) {}
    }

    if (!clicked) {
      // try to find any button with 'play' text
      try {
        const buttons = await page.$$('button');
        for (const b of buttons) {
          try {
            const text = (await b.textContent()) || '';
            if (/play/i.test(text)) {
              await b.click().catch(() => {});
              clicked = true;
              break;
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    // final fallback: send Space to page
    try {
      await page.keyboard.press('Space').catch(() => {});
    } catch (e) {}

    // aggressive fallbacks: click center of viewport, dispatch PointerEvent on likely selectors, and body click
    try {
      try {
        const vp = page.viewportSize ? page.viewportSize() : null;
        if (vp && vp.width && vp.height) {
          await page.mouse.click(Math.floor(vp.width / 2), Math.floor(vp.height / 2), { button: 'left' }).catch(() => {});
        } else {
          await page.evaluate(() => document.body && document.body.click());
        }
      } catch (e) {}

      try {
        await page.evaluate(() => {
          try {
            const sel = document.querySelector('button[aria-label="Play"], button.play, .play-btn, .player-play, [data-testid="play"]');
            if (sel) {
              sel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
              sel.click();
            }
          } catch (e) {}
        });
      } catch (e) {}

      try {
        await page.focus('body');
        await page.keyboard.press('Space').catch(() => {});
      } catch (e) {}
    } catch (e) {}

    // small delay to let play start
    await page.waitForTimeout(300);
  } catch (e) {
    // ignore
  }

  const readState = async () =>
    page.evaluate(() => {
      try {
        // @ts-ignore
        if (window.Howler && window.Howler._howls && window.Howler._howls.length) {
          const hw = window.Howler._howls[0];
          if (hw && hw._sounds && hw._sounds.length) {
            const sound = hw._sounds[0];
            const node = sound && sound._node;
            const duration = typeof hw.duration === 'function' ? hw.duration() : Number(hw._duration || 0);
            const currentTime = node && typeof node.currentTime === 'number' ? node.currentTime : Number(sound?._seek || 0);
            return {
              currentTime,
              duration,
              paused: Boolean(hw._paused),
              ended: Boolean(hw._ended),
            };
          }
        }
      } catch {
        // ignore
      }

      const audio = document.querySelector('audio');
      if (audio) {
        return {
          currentTime: audio.currentTime || 0,
          duration: Number.isFinite(audio.duration) ? audio.duration : 0,
          paused: audio.paused,
          ended: audio.ended,
        };
      }

      return { currentTime: 0, duration: 0, paused: true, ended: false };
    });

  const waitForReadyState = async (timeoutMs = 5000) => {
    const start = Date.now();
    let state = await readState();

    while (Date.now() - start < timeoutMs) {
      if (state.duration > 0 || state.currentTime > 0 || state.ended || !state.paused) {
        return state;
      }

      await page.waitForTimeout(100);
      state = await readState();
    }

    return state;
  };

  const initialState = await waitForReadyState();
  const scenarioSeconds = durationSeconds > 0 ? durationSeconds : initialState.duration || 0;
  if (scenarioSeconds > 0) {
    const totalSeconds = scenarioSeconds * 2;
    const modeLabel = durationSeconds > 0 ? `${durationSeconds}s measurement window` : `until end (~${formatSeconds(scenarioSeconds)})`;
    console.log(`  Estimated total comparison time: ~${formatSeconds(totalSeconds)} + startup (${modeLabel}, 2 runs)`);
  }

  // Inject light instrumentation into the page: periodic Howler.ctx and audio snapshots
  try {
    await page.evaluate(() => {
      // @ts-ignore
      window.__playback_instrumentation = window.__playback_instrumentation || [];
      try {
        const push = (k, v) => window.__playback_instrumentation.push({ t: Date.now(), k, v });
        // record Howler.ctx.state and audio.currentTime/paused if available every 1s
        setInterval(() => {
          try {
            // @ts-ignore
            const ctxState = window.Howler && window.Howler.ctx ? window.Howler.ctx.state : null;
            // Prefer explicit debug handle if present, then Howler internal sound node (same approach as readState)
            try {
              // @ts-ignore
              if (window.__musie_debug && window.__musie_debug.mediaNode) {
                const node = window.__musie_debug.mediaNode;
                currentTime = node && typeof node.currentTime === 'number' ? node.currentTime : null;
                paused = node ? node.paused : null;
                try {
                  readyState = node.readyState;
                  networkState = node.networkState;
                  src = node.currentSrc || node.src || null;
                  if (node.buffered && node.buffered.length > 0) {
                    const start = node.buffered.start(0);
                    const end = node.buffered.end(node.buffered.length - 1);
                    buffered = { start, end };
                    if (typeof currentTime === 'number') bufferedGap = end - currentTime;
                  }
                } catch (e) {}
              }
            } catch (e) {}

            // Prefer Howler internal sound node when available (same approach as readState)
            let currentTime = null;
            let paused = null;
            let readyState = null;
            let networkState = null;
            let src = null;
            let buffered = null;
            let bufferedGap = null;

            try {
              // @ts-ignore
              if (window.Howler && window.Howler._howls && window.Howler._howls.length) {
                // @ts-ignore
                const hw = window.Howler._howls[0];
                if (hw && hw._sounds && hw._sounds.length) {
                  const sound = hw._sounds[0];
                  const node = sound && sound._node;
                  currentTime = node && typeof node.currentTime === 'number' ? node.currentTime : Number(sound?._seek || 0);
                  paused = Boolean(hw._paused);
                  try {
                    if (node) {
                      readyState = node.readyState;
                      networkState = node.networkState;
                      src = node.currentSrc || node.src || null;
                      if (node.buffered && node.buffered.length > 0) {
                        const start = node.buffered.start(0);
                        const end = node.buffered.end(node.buffered.length - 1);
                        buffered = { start, end };
                                  // Temporarily mute to bypass autoplay restrictions in headless environments
                                  try { audio.muted = true; } catch (e) {}
                                  audio.play().catch(() => {});
                                  // if it starts, unmute after a short delay
                                  const unmuteWatcher = setInterval(() => {
                                    try {
                                      if (audio.currentTime && audio.currentTime > 0 && !audio.paused) {
                                        try { audio.muted = false; } catch (e) {}
                                        clearInterval(unmuteWatcher);
                                      }
                                    } catch (e) {}
                                  }, 100);
                      }
                    }
                  } catch (e) {}
                }
              }
            } catch (e) {}

            // Fallback to querying a visible audio element
            try {
              if (currentTime === null) {
                const audio = document.querySelector('audio');
                if (audio) {
                  currentTime = typeof audio.currentTime === 'number' ? audio.currentTime : null;
                  paused = audio.paused;
                  readyState = audio.readyState;
                  networkState = audio.networkState;
                  src = audio.currentSrc || audio.src || null;
                  try {
                    if (audio.buffered && audio.buffered.length > 0) {
                      const start = audio.buffered.start(0);
                      const end = audio.buffered.end(audio.buffered.length - 1);
                      buffered = { start, end };
                      if (typeof currentTime === 'number') bufferedGap = end - currentTime;
                    }
                  } catch (e) {}
                }
              }
            } catch (e) {}

            push('snapshot', { ctxState, currentTime, paused, readyState, networkState, src, buffered, bufferedGap, perf: performance.now() });
            // keep instrumentation bounded
            // @ts-ignore
            if (window.__playback_instrumentation.length > 3000) window.__playback_instrumentation.splice(0, 1000);
          } catch (e) {}
        }, 1000);
      } catch (e) {}
    });
  } catch (e) {
    // ignore
  }

  const result = await page.evaluate(
    async ({ durationSeconds }) => {
      const sampleMs = 200;
      const allowedDrift = 0.25; // loosen drift tolerance to avoid false positives
      const samples = [];
      const start = performance.now();

      const readState = () => {
        try {
          // @ts-ignore
          if (window.Howler && window.Howler._howls && window.Howler._howls.length) {
            const hw = window.Howler._howls[0];
            if (hw && hw._sounds && hw._sounds.length) {
              const sound = hw._sounds[0];
              const node = sound && sound._node;
              const duration = typeof hw.duration === 'function' ? hw.duration() : Number(hw._duration || 0);
              const currentTime = node && typeof node.currentTime === 'number' ? node.currentTime : Number(sound?._seek || 0);
              return {
                currentTime,
                duration,
                paused: Boolean(hw._paused),
                ended: Boolean(hw._ended),
              };
            }
          }
        } catch {
          // ignore
        }
        const audio = document.querySelector('audio');
        if (audio) {
          return {
            currentTime: audio.currentTime || 0,
            duration: Number.isFinite(audio.duration) ? audio.duration : 0,
            paused: audio.paused,
            ended: audio.ended,
          };
        }
        return { currentTime: 0, duration: 0, paused: true, ended: false };
      };

      const observeUntilEnd = durationSeconds <= 0;
      const endAt = start + (observeUntilEnd ? 60 * 60 * 1000 : durationSeconds * 1000);

      while (performance.now() < endAt) {
        const state = readState();
        samples.push({ t: performance.now(), currentTime: state.currentTime, paused: state.paused, ended: state.ended, duration: state.duration });
        if (observeUntilEnd && state.ended) break;
        if (observeUntilEnd && state.duration > 0 && state.currentTime >= state.duration - 0.25) break;
        await new Promise((r) => setTimeout(r, sampleMs));
      }

      const deltas = [];
      for (let i = 1; i < samples.length; i++) {
        const dtTime = samples[i].currentTime - samples[i - 1].currentTime;
        const dtWall = (samples[i].t - samples[i - 1].t) / 1000;
        deltas.push({ dtTime, dtWall });
      }

      const maxGap = deltas.reduce((m, d) => Math.max(m, Math.abs(d.dtWall - d.dtTime)), 0);
      const stalls = deltas.filter((d) => d.dtTime < d.dtWall * 0.5 && Math.abs(d.dtWall - d.dtTime) > allowedDrift);

      // try to attach instrumentation snapshot if present
      // @ts-ignore
      const instr = (window.__playback_instrumentation && window.__playback_instrumentation.slice(-50)) || [];
      return { samples: samples.length, samplesArray: samples, deltas: deltas.length, maxGap, stalls: stalls.length, instrumentation: instr };
    },
    { durationSeconds }
  );

  // collect page console logs (filtered) and return together
  return { result, logs: pageLogs };
}

async function main() {
  const { audioRel, durationSeconds, appUrl: providedAppUrl } = parseArgs(process.argv.slice(2));
  if (!audioRel) {
    console.error('Usage: node playback-app-compare.js <path-to-audio-file> [durationSeconds|--until-end] [appUrl]');
    process.exit(1);
  }

  const audioPath = path.resolve(audioRel);
  if (!fs.existsSync(audioPath)) {
    console.error('Audio not found:', audioPath);
    process.exit(1);
  }

  // start audio server
  const audioServer = await startAudioServer(audioPath, 8001);
  console.log('Audio server running on http://localhost:8001/test-audio');
  const base = providedAppUrl ? providedAppUrl.replace(/\/$/, '') : 'http://localhost:5173';
  let dev = null;

  if (!providedAppUrl) {
    console.log('Starting dev server (prefer local vite binary if available)...');

    // Prefer local vite binary (node_modules/.bin/vite or vite.cmd)
    const frontendDir = path.resolve('.', 'frontend');
    const localBin = process.platform === 'win32' ? 'vite.cmd' : 'vite';
    const localVite = path.join(frontendDir, 'node_modules', '.bin', localBin);

    // Helper to find an executable in PATH using 'which' (unix) or 'where' (windows)
    const findInPath = (name) => {
      try {
        const tool = process.platform === 'win32' ? 'where' : 'which';
        const res = spawnSync(tool, [name], { encoding: 'utf8' });
        if (res.status === 0 && res.stdout) return res.stdout.split(/\r?\n/)[0].trim();
      } catch (e) {
        // ignore
      }
      return null;
    };

    if (fs.existsSync(localVite)) {
      dev = spawn(localVite, [], { cwd: frontendDir, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    } else {
      const candidates = process.platform === 'win32' ? ['npm.cmd', 'npx.cmd', 'pnpm.cmd', 'yarn.cmd'] : ['npm', 'npx', 'pnpm', 'yarn'];
      let found = null;
      for (const c of candidates) {
        const p = findInPath(c);
        if (p) {
          found = p;
          break;
        }
      }

      if (!found) {
        console.error('Could not find a way to run the dev server (vite/npm/npx/pnpm/yarn missing in PATH).');
        audioServer.close();
        process.exit(4);
      }

      dev = spawn(found, ['run', 'dev'], { cwd: frontendDir, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    }

    // create logs dir and file
    const logsDir = path.join(frontendDir, 'logs');
    try {
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    } catch (e) {
      // ignore
    }
    const logFile = path.join(logsDir, 'vite.log');
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    dev.stdout.on('data', (d) => {
      process.stdout.write(`[vite] ${d}`);
      logStream.write(`[vite] ${d}`);
    });
    dev.stderr.on('data', (d) => {
      process.stderr.write(`[vite err] ${d}`);
      logStream.write(`[vite err] ${d}`);
    });

    try {
      await waitForUrl('http://localhost:5173');
    } catch (err) {
      console.error('Dev server did not start in time');
      if (dev) dev.kill();
      audioServer.close();
      process.exit(3);
    }
  } else {
    console.log(`Using provided app URL, skipping dev server start: ${base}`);
  }
  const audioUrl = encodeURIComponent('http://localhost:8001/test-audio');

  const browser = await chromium.launch({ headless: process.env.PWDEBUG ? false : true, args: ['--autoplay-policy=no-user-gesture-required'] });

  console.log('\n1) Running app WITHOUT visualizer (noviz param)...');
  const urlNoViz = `${base}/?audioUrl=${audioUrl}&noviz=1`;
  const noViz = await runScenarioOnApp({ browser, appUrl: urlNoViz, durationSeconds });
  console.log('  result:', noViz.result);
  if (noViz.logs && noViz.logs.length) {
    const interesting = noViz.logs.filter(l => /\[audio-event\]|\[audio-watchdog\]/i.test(l.text)).slice(-20);
    if (interesting.length) {
      console.log('  Recent page events:');
      for (const l of interesting) console.log('   ', l.text);
    }
  }

  console.log('\n2) Running app WITH visualizer...');
  const urlWithViz = `${base}/?audioUrl=${audioUrl}`;
  const withViz = await runScenarioOnApp({ browser, appUrl: urlWithViz, durationSeconds });
  console.log('  result:', withViz.result);
  if (withViz.logs && withViz.logs.length) {
    const interesting = withViz.logs.filter(l => /\[audio-event\]|\[audio-watchdog\]/i.test(l.text)).slice(-20);
    if (interesting.length) {
      console.log('  Recent page events:');
      for (const l of interesting) console.log('   ', l.text);
    }
  }

  console.log('\nComparison:');
  console.log('  stalls w/o viz:', noViz.result.stalls, 'w/ viz:', withViz.result.stalls);
  console.log('  maxGap w/o viz:', noViz.result.maxGap.toFixed(3), 'w/ viz:', withViz.result.maxGap.toFixed(3));

  // Persist logs to frontend/logs/playback-<timestamp>-(noviz|viz).json
  try {
    const logsDir = path.join(process.cwd(), 'frontend', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const meta = { audioPath: audioPath, appUrl: base, timestamp: ts };
    const novizFile = path.join(logsDir, `playback-${ts}-noviz.json`);
    const vizFile = path.join(logsDir, `playback-${ts}-viz.json`);
    fs.writeFileSync(novizFile, JSON.stringify({ meta, result: noViz.result, logs: noViz.logs }, null, 2));
    fs.writeFileSync(vizFile, JSON.stringify({ meta, result: withViz.result, logs: withViz.logs }, null, 2));
    console.log('  Saved logs to', novizFile, 'and', vizFile);
    // Prune older logs: keep only the last 3 runs (both -noviz and -viz per timestamp)
    try {
      const files = fs.readdirSync(logsDir).filter(f => f.startsWith('playback-') && f.endsWith('.json'));
      // Group files by their timestamp segment between 'playback-' and '-viz/.json'
      const groups = {};
      for (const f of files) {
        const ts = f.replace(/^playback-/, '').replace(/-(noviz|viz)\.json$/, '');
        if (!groups[ts]) groups[ts] = [];
        groups[ts].push(f);
      }
      const allTs = Object.keys(groups).sort();
      const keepRuns = 3;
      if (allTs.length > keepRuns) {
        const toRemoveTs = allTs.slice(0, allTs.length - keepRuns);
        for (const ts of toRemoveTs) {
          for (const f of groups[ts]) {
            try { fs.unlinkSync(path.join(logsDir, f)); } catch (e) {}
          }
        }
      }
    } catch (e) {}
  } catch (e) {
    console.error('  Failed to write logs:', e && e.message ? e.message : e);
  }

  // cleanup
  if (dev) dev.kill();
  await browser.close();
  audioServer.close();

  if (withViz.stalls > noViz.stalls) process.exit(2);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(4);
});

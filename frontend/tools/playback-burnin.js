#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

function parseArgs(argv) {
  const positionals = [];
  let sampleMs = 2000;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--sample-ms') {
      const raw = argv[i + 1];
      i += 1;
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 250) sampleMs = parsed;
      continue;
    }
    positionals.push(arg);
  }

  const audioRel = positionals[0] || null;
  const cycleSeconds = Number(positionals[1] || 120);
  const cycles = Number(positionals[2] || 12);
  const appUrl = positionals[3] || null;

  return {
    audioRel,
    cycleSeconds: Number.isFinite(cycleSeconds) && cycleSeconds > 0 ? cycleSeconds : 120,
    cycles: Number.isFinite(cycles) && cycles > 0 ? Math.floor(cycles) : 12,
    appUrl,
    sampleMs,
  };
}

function formatMb(kb) {
  return (kb / 1024).toFixed(1);
}

function getRelevantProcesses() {
  try {
    const output = execSync('ps -eo pid=,rss=,pcpu=,command=', { encoding: 'utf8' });
    const lines = output.split(/\r?\n/).filter(Boolean);

    const rows = [];
    for (const line of lines) {
      const match = line.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(.+)$/);
      if (!match) continue;
      const pid = Number(match[1]);
      const rssKb = Number(match[2]);
      const cpu = Number(match[3]);
      const command = match[4];

      const isRelevant =
        /playwright|chrome|chromium|node\s+.*(vite|playback-app-compare|playback-burnin)/i.test(
          command
        );

      if (!isRelevant) continue;
      rows.push({ pid, rssKb, cpu, command });
    }

    const totalRssKb = rows.reduce((sum, r) => sum + r.rssKb, 0);
    const totalCpu = rows.reduce((sum, r) => sum + r.cpu, 0);
    return { rows, totalRssKb, totalCpu };
  } catch {
    return { rows: [], totalRssKb: 0, totalCpu: 0 };
  }
}

function runCycle({ cwd, audioRel, cycleSeconds, appUrl }) {
  return new Promise((resolve) => {
    const args = ['./tools/playback-app-compare.js', audioRel, String(cycleSeconds)];
    if (appUrl) args.push(appUrl);

    const child = spawn(process.execPath, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    let peakRssKb = 0;
    let peakCpu = 0;

    const sample = () => {
      const p = getRelevantProcesses();
      peakRssKb = Math.max(peakRssKb, p.totalRssKb);
      peakCpu = Math.max(peakCpu, p.totalCpu);
    };

    sample();
    const sampler = setInterval(sample, 2000);

    child.stdout.on('data', (chunk) => {
      const text = String(chunk);
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = String(chunk);
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      clearInterval(sampler);
      sample();
      resolve({ code: code ?? 1, stdout, stderr, peakRssKb, peakCpu });
    });
  });
}

function extractResults(run) {
  const saveMatch = run.stdout.match(/Saved logs to\s+(.+?-noviz\.json)\s+and\s+(.+?-viz\.json)/);
  if (!saveMatch) {
    return {
      novizFile: null,
      vizFile: null,
      noviz: null,
      viz: null,
    };
  }

  const novizFile = saveMatch[1].trim();
  const vizFile = saveMatch[2].trim();

  const readJson = (filePath) => {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const novizJson = readJson(novizFile);
  const vizJson = readJson(vizFile);

  return {
    novizFile,
    vizFile,
    noviz: novizJson?.result
      ? {
          stalls: novizJson.result.stalls,
          maxGap: novizJson.result.maxGap,
        }
      : null,
    viz: vizJson?.result
      ? {
          stalls: vizJson.result.stalls,
          maxGap: vizJson.result.maxGap,
        }
      : null,
  };
}

async function main() {
  const { audioRel, cycleSeconds, cycles, appUrl } = parseArgs(process.argv.slice(2));

  if (!audioRel) {
    console.error(
      'Usage: node ./tools/playback-burnin.js <audioPath> [cycleSeconds=120] [cycles=12] [appUrl]'
    );
    process.exit(1);
  }

  const cwd = process.cwd();
  const logsDir = path.join(cwd, 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const startedAt = new Date().toISOString();
  console.log('Burn-in start:', startedAt);
  console.log('Audio:', audioRel);
  console.log('Cycle seconds:', cycleSeconds, '| Cycles:', cycles);
  if (appUrl) console.log('Using app URL:', appUrl);

  const runs = [];

  for (let i = 1; i <= cycles; i += 1) {
    console.log(`\n=== Burn-in cycle ${i}/${cycles} ===`);
    const cycleStart = Date.now();
    const run = await runCycle({ cwd, audioRel, cycleSeconds, appUrl });
    const parsed = extractResults(run);
    const elapsedSec = Math.round((Date.now() - cycleStart) / 1000);

    const record = {
      cycle: i,
      exitCode: run.code,
      elapsedSec,
      peakRssKb: run.peakRssKb,
      peakCpu: run.peakCpu,
      noviz: parsed.noviz,
      viz: parsed.viz,
      novizFile: parsed.novizFile,
      vizFile: parsed.vizFile,
    };
    runs.push(record);

    console.log(
      `Cycle ${i} summary: exit=${record.exitCode}, RSS peak=${formatMb(record.peakRssKb)} MB, CPU peak=${record.peakCpu.toFixed(1)}%`
    );
    if (record.noviz && record.viz) {
      console.log(
        `  stalls noviz/viz=${record.noviz.stalls}/${record.viz.stalls}, maxGap noviz/viz=${record.noviz.maxGap.toFixed(3)}/${record.viz.maxGap.toFixed(3)}`
      );
    }

    if (record.exitCode !== 0) {
      console.error('Stopping burn-in due to non-zero exit code in cycle', i);
      break;
    }
  }

  const completed = runs.length;
  const first = runs[0] || null;
  const last = runs[runs.length - 1] || null;
  const avgPeakRssKb =
    completed > 0 ? Math.round(runs.reduce((sum, r) => sum + r.peakRssKb, 0) / completed) : 0;
  const avgPeakCpu = completed > 0 ? runs.reduce((sum, r) => sum + r.peakCpu, 0) / completed : 0;

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    audioRel,
    cycleSeconds,
    cyclesRequested: cycles,
    cyclesCompleted: completed,
    appUrl: appUrl || null,
    summary: {
      avgPeakRssKb,
      avgPeakCpu,
      firstPeakRssKb: first?.peakRssKb ?? null,
      lastPeakRssKb: last?.peakRssKb ?? null,
      rssDeltaKb:
        first && last && Number.isFinite(first.peakRssKb) && Number.isFinite(last.peakRssKb)
          ? last.peakRssKb - first.peakRssKb
          : null,
    },
    runs,
  };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(logsDir, `playback-burnin-${ts}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  console.log('\n=== Burn-in summary ===');
  console.log('Cycles completed:', completed, '/', cycles);
  console.log('Average RSS peak:', formatMb(avgPeakRssKb), 'MB');
  console.log('Average CPU peak:', avgPeakCpu.toFixed(1), '%');
  if (report.summary.rssDeltaKb != null) {
    console.log('RSS peak delta (last-first):', formatMb(report.summary.rssDeltaKb), 'MB');
  }
  console.log('Report saved to:', reportFile);

  const hadFailure = runs.some((r) => r.exitCode !== 0);
  process.exit(hadFailure ? 2 : 0);
}

main().catch((err) => {
  console.error('Burn-in error:', err);
  process.exit(3);
});

import { defineConfig } from '@playwright/test';
import { join } from 'node:path';
import { loadRun } from '../run-state.mjs';

const { state, settings } = await loadRun();

export default defineConfig({
  // A copy of visual.spec.mjs, written there by the CLI
  testDir: state.testDir,
  testMatch: 'visual.spec.mjs',
  outputDir: join(settings.outputDir, 'results'),
  snapshotDir: state.snapshotDir,
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{arg}{ext}',

  workers: settings.workers,
  fullyParallel: true,
  timeout: settings.timeout,

  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: join(settings.outputDir, 'report'), open: 'never' },
    ],
  ],

  expect: {
    timeout: 30_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixels: settings.maxDiffPixels,
    },
  },

  use: {
    browserName: 'chromium',
    ignoreHTTPSErrors: settings.ignoreHTTPSErrors,
  },

  projects: Object.entries(settings.viewports).map(([name, use]) => ({
    name,
    use,
  })),
});

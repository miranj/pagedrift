/**
 * Runs the Playwright CLI bundled with pagedrift, so that a project needs
 * no Playwright install of its own.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const suiteDir = join(import.meta.dirname, 'suite');
const specName = 'visual.spec.mjs';

export const suiteConfig = join(suiteDir, 'playwright.config.mjs');

/**
 * Writes the test spec into a directory of the project, so that test
 * locations show as paths in the project rather than in pagedrift’s
 * install location (eg. npx’s cache). Its imports still point to
 * pagedrift’s modules.
 */
export function writeSpec(dir) {
  const specUrl = pathToFileURL(join(suiteDir, specName));
  const source = readFileSync(specUrl, 'utf8').replace(
    /from '(\.[^']+|@playwright\/test)'/g,
    (_, specifier) =>
      `from '${specifier.startsWith('.') ? new URL(specifier, specUrl) : import.meta.resolve(specifier)}'`,
  );
  writeFileSync(join(dir, specName), source);
}

/**
 * Runs the Playwright CLI with the given arguments, returning its exit
 * status.
 */
export function runPlaywright(args, { cwd, env = {} } = {}) {
  const cli = fileURLToPath(import.meta.resolve('@playwright/test/cli'));
  const { status } = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });

  return status ?? 1;
}

/**
 * Whether the Chromium build this Playwright version needs is installed.
 */
export function isBrowserInstalled() {
  return existsSync(chromium.executablePath());
}

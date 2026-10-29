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
 * Installs the Chromium build this Playwright version needs.
 *
 * Playwright warns against `npx playwright install` whenever its CLI runs
 * from npx’s cache, as it always does under `npx pagedrift`, though the
 * browser it installs is the one pagedrift needs. So the CLI is loaded
 * from an inline script, with a script path that doesn’t trigger it.
 */
export function installBrowser() {
  const cli = import.meta.resolve('@playwright/test/cli');
  const { status } = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `process.argv.splice(1, 0, 'playwright'); await import(${JSON.stringify(cli)});`,
      'install',
      'chromium',
    ],
    { stdio: 'inherit' },
  );

  return status ?? 1;
}

/**
 * Whether the Chromium build this Playwright version needs is installed.
 */
export function isBrowserInstalled() {
  return existsSync(chromium.executablePath());
}

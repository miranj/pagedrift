/**
 * State of a run, shared between the CLI and the processes it starts
 * (Playwright's runner and its workers) through a JSON file, whose path is
 * passed in an environment variable.
 *
 * State: {
 *   projectDir,         root of the project being tested
 *   testDir,            where the CLI has written the test spec
 *   configFile,         copy of the project's config file, or null
 *   baseUrl,            root URL of the site, with a trailing slash
 *   uris,               URIs to test
 *   snapshotDir,        where baseline screenshots are kept
 *   capturingBaseline,  whether this is the baseline capture pass
 * }
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadSettings } from './settings.mjs';

export const runStateEnvVar = 'PAGEDRIFT_RUN_STATE';

export function writeRunState(file, state) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2));
}

/**
 * The state of the current run and the project's settings.
 */
export async function loadRun() {
  const file = process.env[runStateEnvVar];
  if (!file) {
    throw new Error('The pagedrift suite only runs through the pagedrift CLI.');
  }

  const state = JSON.parse(readFileSync(file, 'utf8'));
  const settings = await loadSettings(state.projectDir, state.configFile);

  return { state, settings };
}

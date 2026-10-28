#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { die, say } from '../src/log.mjs';
import { isBrowserInstalled, runPlaywright } from '../src/playwright.mjs';
import { regress } from '../src/regress.mjs';
import {
  findConfigFile,
  loadSettings,
  resolveBaseUrl,
} from '../src/settings.mjs';
import { collectUris, randomSeed } from '../src/uris.mjs';

const packageDir = join(import.meta.dirname, '..');
const { version } = JSON.parse(
  readFileSync(join(packageDir, 'package.json'), 'utf8'),
);

const usage = `pagedrift ${version}
Compares full-page screenshots of a locally running site between two git refs.

Usage:
  pagedrift <baseline>[..<compare>] [options] [playwright options...]
      Captures the site at <baseline>, then compares the site at <compare>
      (default: the current checkout) against it. Run in the project’s root,
      with the site running throughout.
  pagedrift uris [--seed=<n>]
      Prints the URIs that would be tested at the current checkout.
  pagedrift report
      Opens the report of the last comparison.
  pagedrift init
      Creates a pagedrift.config.mjs listing every setting.
  pagedrift install
      Installs the browser pagedrift uses (Chromium).

Options:
  --fresh          Capture all baseline screenshots again, instead of reusing
                   those from earlier runs (eg. after content changes)
  --seed=<n>       Pick the same random pages as an earlier run
  --config=<file>  Config file (default: pagedrift.config.mjs)
  -h, --help       Show this help
  -v, --version    Show the version

Other options are passed to \`playwright test\`, eg. --project=desktop,
-g <pattern>, --headed.

Examples:
  npx pagedrift dev
  npx pagedrift v1.4.0..v1.5.0 --project=desktop
`;

const projectDir = process.cwd();
const { command, options, rest } = parseArgs(process.argv.slice(2));

if (options.help) {
  console.log(usage);
  process.exit(0);
}
if (options.version) {
  console.log(version);
  process.exit(0);
}

const configFile = options.config
  ? resolve(projectDir, options.config)
  : findConfigFile(projectDir);
if (configFile && !existsSync(configFile)) {
  die(`Config file not found: ${configFile}`);
}

try {
  process.exit(await run());
} catch (error) {
  die(error.message);
}

async function run() {
  switch (command) {
    case undefined:
      console.log(usage);
      return 1;

    case 'uris': {
      const settings = await loadSettings(projectDir, configFile);
      const baseUrl = resolveBaseUrl(settings, projectDir);
      const seed = options.seed ?? settings.seed ?? randomSeed();
      const uris = await collectUris(settings, baseUrl, seed);
      // Details as # comments, so the output is itself a valid list of URIs
      // (eg. for the `uris` setting)
      console.log(`# Collected from ${new URL(settings.sitemap, baseUrl)}`);
      console.log(`# --seed=${seed}`);
      console.log(`# ${uris.length} URIs`);
      console.log(uris.map((uri) => '/' + uri).join('\n'));
      return 0;
    }

    case 'report': {
      const { outputDir } = await loadSettings(projectDir, configFile);
      const reportDir = join(outputDir, 'report');
      if (!existsSync(reportDir)) {
        die('There is no report yet. Run a comparison first.');
      }
      return runPlaywright(['show-report', reportDir]);
    }

    case 'init': {
      const file = join(projectDir, 'pagedrift.config.mjs');
      if (existsSync(file)) {
        die(`${file} already exists.`);
      }
      writeFileSync(file, starterConfig());
      say(`Created ${file}`);
      return 0;
    }

    case 'install':
      return runPlaywright(['install', 'chromium']);

    default:
      if (!isBrowserInstalled()) {
        die(
          'The browser pagedrift uses is not installed. Install it with: npx pagedrift install',
        );
      }
      return regress({
        projectDir,
        configFile,
        range: command,
        fresh: options.fresh,
        seed: options.seed,
        playwrightArgs: rest,
      });
  }
}

/**
 * Splits the arguments into the command (or range), pagedrift’s own
 * options, and the rest, which are passed to Playwright. The command or
 * range comes first, as Playwright options may take values.
 */
function parseArgs(args) {
  const options = { fresh: false };
  const rest = [];
  let command;
  if (args[0] && !args[0].startsWith('-')) {
    command = args.shift();
  }

  for (let i = 0; i < args.length; i++) {
    const [flag, inlineValue] = args[i].split(/=(.*)/s);
    const value = () => {
      const v = inlineValue ?? args[++i];
      if (v === undefined) {
        die(`${flag} needs a value`);
      }
      return v;
    };

    if (flag === '-h' || flag === '--help') {
      options.help = true;
    } else if (flag === '-v' || flag === '--version') {
      options.version = true;
    } else if (flag === '--fresh') {
      options.fresh = true;
    } else if (flag === '--seed') {
      options.seed = Number(value());
      if (!Number.isInteger(options.seed)) {
        die('--seed needs a whole number');
      }
    } else if (flag === '--config') {
      options.config = value();
    } else {
      rest.push(args[i]);
    }
  }

  return { command, options, rest };
}

/**
 * The default config file, with every setting commented out, and a header
 * for the project.
 */
function starterConfig() {
  const defaults = readFileSync(
    join(packageDir, 'pagedrift.config.default.mjs'),
    'utf8',
  );
  const body = defaults
    .slice(defaults.search(/^export default \{$/m))
    .split('\n')
    .map((line) => {
      const code = line.trim();
      const isCode =
        code !== '' &&
        !/^(\/\*\*|\*|\/\/)/.test(code) &&
        !/^(export default \{|\};)$/.test(code);
      // Settings are indented by two spaces
      return isCode ? line.replace(/^ {2}/, '  // ') : line;
    })
    .join('\n');

  return `/**
 * pagedrift settings for this project. Every setting is listed below with
 * its default value. Uncomment and change only those this project needs.
 *
 * This file is copied aside at the start of each run, so it should not
 * import other files from the project by relative path.
 */

${body}`;
}

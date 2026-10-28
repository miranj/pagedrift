/**
 * Loads the settings for a project: the defaults in
 * pagedrift.config.default.mjs, overridden by the project’s config file.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import defaults from '../pagedrift.config.default.mjs';

/** Config file names looked for in the project, in order */
const configFileNames = ['pagedrift.config.mjs', 'pagedrift.config.js'];

/**
 * The project’s config file, or null if it has none.
 */
export function findConfigFile(projectDir) {
  return (
    configFileNames
      .map((name) => join(projectDir, name))
      .find((file) => existsSync(file)) ?? null
  );
}

/**
 * Settings for a project, with `outputDir` resolved to an absolute path.
 * `baseUrl` is left as configured (see resolveBaseUrl).
 */
export async function loadSettings(projectDir, configFile) {
  let projectSettings = {};
  if (configFile) {
    const module = await import(pathToFileURL(configFile).href);
    projectSettings = module.default ?? {};
    const unknown = Object.keys(projectSettings).filter(
      (key) => !(key in defaults),
    );
    if (unknown.length) {
      throw new Error(
        `Unknown setting(s) in ${configFile}: ${unknown.join(', ')}. See pagedrift.config.default.mjs for the available ones.`,
      );
    }
  }

  const settings = { ...defaults, ...projectSettings };
  settings.outputDir = resolve(projectDir, settings.outputDir);

  return settings;
}

/**
 * Root URL of the site, with a trailing slash: the baseUrl setting, or else
 * the baseUrlEnvVar variable from the environment or the project’s .env.
 */
export function resolveBaseUrl(settings, projectDir) {
  const { baseUrlEnvVar } = settings;
  const url =
    settings.baseUrl ||
    (baseUrlEnvVar &&
      (process.env[baseUrlEnvVar] ||
        readEnvFile(join(projectDir, '.env'))[baseUrlEnvVar]));
  if (!url) {
    throw new Error(
      `Could not determine the site URL. Set ${baseUrlEnvVar ? `${baseUrlEnvVar} in .env, or ` : ''}baseUrl in pagedrift.config.mjs.`,
    );
  }

  return url.replace(/\/*$/, '/');
}

/**
 * The values in a .env file, expanding ${VAR} references the way Craft’s
 * phpdotenv does.
 */
function readEnvFile(file) {
  if (!existsSync(file)) {
    return {};
  }

  const values = parseEnv(readFileSync(file, 'utf8'));
  for (const [key, value] of Object.entries(values)) {
    values[key] = value.replace(
      /\$\{(\w+)\}/g,
      (_, name) => process.env[name] ?? values[name] ?? '',
    );
  }

  return values;
}

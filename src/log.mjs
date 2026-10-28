/**
 * Progress, warning and error messages for the command line.
 */

import { styleText } from 'node:util';

export function say(message) {
  console.log(styleText('bold', `==> ${message}`));
}

export function warn(message) {
  console.warn(styleText('yellow', `Warning: ${message}`));
}

/**
 * Prints an error and exits.
 */
export function die(message) {
  console.error(styleText('red', `Error: ${message}`));
  process.exit(1);
}

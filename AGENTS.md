See README.md

Additional notes:

- `pagedrift.config.default.mjs` should list each config option with its
  default value and a short comment. Keep this up-to-date if any new config
  option is added or removed.
- Settings merge one level deep, and `loadSettings` rejects unknown keys,
  so a new setting needs a default there to be accepted.

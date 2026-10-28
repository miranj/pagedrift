# Changelog

Follows [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added

- Compare full-page screenshots of a local site between two git refs:
  `pagedrift <baseline>[..<compare>]`.
- Sample pages at random from each sitemap, with `--seed` to repeat a run.
- Cache baseline screenshots per commit, with `--fresh` to recapture.
- Settle pages before screenshots (lazy images, lazysizes, Alpine
  x-intersect).
- Configure per project in `pagedrift.config.mjs`.
- `uris`, `report`, `init` and `install` commands.

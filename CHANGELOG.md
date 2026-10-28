# Changelog

All notable changes to pagedrift are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `pagedrift <baseline>[..<compare>]` compares full-page screenshots of a
  locally running site between two git refs, checking them out in place.
- Pages are sampled at random from each sitemap, following nested sitemap
  indexes and gzipped sitemaps, with `--seed` to repeat a run.
- Baseline screenshots are cached per commit and reused across runs;
  `--fresh` captures them again.
- Pages are settled before screenshots: lazy images (native and lazysizes)
  load, and intersection-triggered content (eg. Alpine's x-intersect)
  renders.
- Optional `pagedrift.config.mjs` per project, with every setting documented
  in `pagedrift.config.default.mjs`.
- `pagedrift uris`, `report`, `init` and `install` commands.

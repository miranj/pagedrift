# Changelog

Follows [Semantic Versioning](https://semver.org).

## [Unreleased]

### Commands

- Compare full-page screenshots of a local site between two git refs, eg.
  `pagedrift v1.4.0..v1.5.0`, or against the current checkout with
  `pagedrift production`.
- Pass options to `playwright test`, eg. `--project=desktop` or `-g`.
- See the pages that look different with `pagedrift report`.
- Preview the pages a run would test with `pagedrift uris`.
- Create a config file listing every setting with `pagedrift init`.
- Install the browser with `pagedrift install`.

### Runs

- Test a few random pages from each of the site’s sitemaps. Repeat a run
  on the same pages with `--seed`.
- Reuse baseline screenshots from earlier runs of the same commit, or
  recapture them with `--fresh`.

### Config

- Configure each project in `pagedrift.config.mjs`.
- Test a fixed list of pages on every run, alongside the random ones, with
  `uris`.
- Screenshot each page at mobile and desktop viewports, or your own, with
  `viewports`.
- Hide or mask parts of a page, like embeds and videos, in screenshots
  with `hide` and `mask`.
- Run a command after each checkout, eg. to clear the site’s caches, with
  `afterCheckout`.

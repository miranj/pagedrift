# PageDrift

Regression testing by comparing full-page screenshots across two revisions
(Playwright on Node.js).

pagedrift samples pages from a site's sitemaps, screenshots them at two git
refs of the project, and reports the pages that look different. It's built
for Craft CMS sites, but works with any site that has a sitemap and runs
locally from a git checkout.

## Requirements

- Node.js 20.12 or later
- The site running locally (on any server, eg. DDEV), from the project's
  git checkout
- No uncommitted changes to tracked files, as refs are checked out in place

## Usage

Run in the project's root. Nothing needs to be added to the project.

    # Once: install the browser
    $ npx pagedrift install

    # Compare the current checkout against dev
    $ npx pagedrift dev

    # Compare two tags; other options go to `playwright test`
    $ npx pagedrift v5.9.4..v5.9.5 -g programmes --project=desktop

    # View the differences
    $ npx pagedrift report

As with `git diff`, `<baseline>..<compare>` compares the two refs directly,
and an omitted `<compare>` means the current checkout. The project is
returned to the original checkout at the end, even if the run is stopped
with Ctrl+C.

pagedrift can also be installed in a project with
`npm install --save-dev pagedrift`.

### How pages are picked

A few pages are picked at random from each sitemap listed in
`/sitemap.xml` (only the first file of paginated sitemaps), plus `/` and
`/404`. Each run prints its seed: pass it with `--seed=<n>` to test the same
pages again. `npx pagedrift uris` prints the pages a run would test.

### Baselines

Baseline screenshots are cached per baseline commit, so repeat runs only
capture pages that are new. Add `--fresh` to capture them all again, eg.
after content changes.

Both refs share one database, so differences may come from config or
migrations as well as templates. pagedrift warns when `composer.lock`,
`config/project` or `migrations` differ between the refs.

### Generated files

Screenshots, cached baselines and the report go in `.pagedrift/` in the
project. It ignores itself in git, so needs no `.gitignore` entry.

## Configuration

By default, the site URL is `PRIMARY_SITE_URL` from the project's `.env`,
and every page URL gets `?nocache=1` to skip the site's full-page cache.

To change any setting, add a `pagedrift.config.mjs` to the project's root.
`npx pagedrift init` creates one listing every setting, commented out.
See [`pagedrift.config.default.mjs`](pagedrift.config.default.mjs) for all
of them with their defaults, eg.

```js
export default {
  urisPerSitemap: 5,
  uris: ['/', '/404', '/search?q=test'],
  hide: ['iframe', 'video', '.cookie-banner'],
  afterCheckout: 'php craft clear-caches/all',
};
```

## Development

    $ npm install
    $ npm test

    # Run the CLI from a checkout, in a project's root
    $ node path/to/pagedrift/bin/pagedrift.mjs dev

Changes are recorded in [CHANGELOG.md](CHANGELOG.md), following
[Semantic Versioning](https://semver.org).

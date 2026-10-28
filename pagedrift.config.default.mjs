/**
 * Every pagedrift setting, with its default value. Override any of them in
 * a project’s pagedrift.config.mjs (`npx pagedrift init` creates one).
 * Settings merge one level deep, eg. `viewports` replaces the defaults.
 */

export default {
  /** Root URL of the local site. null: from the baseUrlEnvVar variable */
  baseUrl: null,

  /** Environment (or .env) variable with the site URL, if baseUrl is null */
  baseUrlEnvVar: 'PRIMARY_SITE_URL',

  /** Query string added to page URLs, eg. to skip the full-page cache */
  cacheBustQuery: 'nocache=1',

  /** Accept self-signed HTTPS certificates */
  ignoreHTTPSErrors: true,

  /** Sitemap or sitemap index to sample pages from, relative to baseUrl */
  sitemap: 'sitemap.xml',

  /** Pages picked at random from each sitemap */
  urisPerSitemap: 3,

  /** Seed for picking pages, to repeat a run. null: random (see --seed) */
  seed: null,

  /** Pages always tested, relative to baseUrl */
  uris: ['/', '/404'],

  /**
   * Viewports by name, as Playwright browser context options. Each is a
   * Playwright project, eg. --project=desktop. No `isMobile`: it resizes
   * the viewport for full-page screenshots, retriggering x-intersect.
   */
  viewports: {
    mobile: { viewport: { width: 375, height: 812 }, hasTouch: true },
    desktop: { viewport: { width: 1440, height: 900 } },
  },

  /** Selectors to hide (keeping their layout box) in screenshots */
  hide: ['iframe', 'video'],

  /** Selectors to cover with a solid box in screenshots */
  mask: [],

  /** Differing pixels allowed before a page counts as changed */
  maxDiffPixels: 0,

  /** Load lazy images and scroll through pages before screenshots */
  preparePage: true,

  /** async (page, { uri, viewport }) => {}, run before each screenshot */
  beforeScreenshot: null,

  /** Pages tested in parallel */
  workers: 4,

  /** Time allowed per page, in milliseconds */
  timeout: 120_000,

  /** Shell command run after each checkout, eg. 'php craft clear-caches/all' */
  afterCheckout: null,

  /** Paths that, if changed between refs, trigger a warning */
  siteStatePaths: ['composer.lock', 'config/project', 'migrations'],

  /** Where generated files go, relative to the project */
  outputDir: '.pagedrift',
};

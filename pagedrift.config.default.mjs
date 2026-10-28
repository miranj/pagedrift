/**
 * Every pagedrift setting, with its default value.
 *
 * To change any of them for a project, add a `pagedrift.config.mjs` to the
 * project's root (`npx pagedrift init` creates one) that exports only the
 * settings to change, eg.
 *
 *   export default {
 *     urisPerSitemap: 5,
 *     afterCheckout: 'php craft clear-caches/all',
 *   };
 *
 * Settings are merged one level deep: a project's `viewports` replaces the
 * default viewports entirely, rather than adding to them.
 *
 * During a run the project's config file is copied aside and loaded from
 * there, so the same settings apply at both refs even if the file differs
 * between them. It should therefore not import other files from the project
 * by relative path.
 */

export default {
  // --- Site -----------------------------------------------------------------

  /**
   * Root URL of the site, as it is running locally. null: PRIMARY_SITE_URL
   * from the project's .env (as set up for Craft CMS).
   */
  baseUrl: null,

  /**
   * Query string added to every page URL, eg. to make the site skip its
   * full-page cache. null: none.
   */
  cacheBustQuery: 'nocache=1',

  /**
   * Whether to accept invalid HTTPS certificates, as local sites commonly
   * use self-signed ones.
   */
  ignoreHTTPSErrors: true,

  // --- Pages to test --------------------------------------------------------

  /**
   * The sitemap (or sitemap index) to sample pages from, relative to
   * baseUrl. For a sitemap index, pages are sampled from each sitemap it
   * lists, keeping only the first file of paginated sitemaps (eg.
   * sitemap-news-1.xml of sitemap-news-1.xml, sitemap-news-2.xml, ...).
   */
  sitemap: 'sitemap.xml',

  /**
   * Pages picked at random from each sitemap.
   */
  urisPerSitemap: 3,

  /**
   * Seed for picking pages at random. The same seed picks the same pages
   * from the same sitemaps, eg. to repeat an earlier run. null: a new random
   * seed for every run (printed at the start of the run). --seed overrides
   * this.
   */
  seed: null,

  /**
   * Pages always tested, as paths relative to baseUrl. `/404` is the URI of
   * Craft's pageNotFound entry: requesting it directly shows the error
   * template, even in Dev Mode where unknown URLs show Craft's exception
   * view instead.
   */
  uris: ['/', '/404'],

  // --- Screenshots ----------------------------------------------------------

  /**
   * Viewports to test every page at, by name, as Playwright browser context
   * options (https://playwright.dev/docs/api/class-testoptions). Each one is
   * a Playwright project, so --project=<name> tests just one of them.
   *
   * The mobile viewport avoids `isMobile` emulation: with it, full-page
   * screenshots resize the viewport, which retriggers intersection-based
   * content (eg. a sticky header's x-intersect) and the page never settles.
   */
  viewports: {
    mobile: { viewport: { width: 375, height: 812 }, hasTouch: true },
    desktop: { viewport: { width: 1440, height: 900 } },
  },

  /**
   * CSS selectors of elements to hide in screenshots, eg. third party
   * embeds whose content changes independently of the site's code. They're
   * hidden with visibility:hidden, so they keep their layout box and size
   * changes are still caught.
   */
  hide: ['iframe', 'video'],

  /**
   * CSS selectors of elements to cover with a solid box in screenshots, eg.
   * dates or randomised content.
   */
  mask: [],

  /**
   * Differing pixels allowed before a page counts as changed. Both sets of
   * screenshots come from the same machine and browser, so by default none
   * are.
   */
  maxDiffPixels: 0,

  /**
   * Whether to load lazy images (native `loading="lazy"` and lazysizes) and
   * scroll through each page so that intersection-triggered content (eg.
   * Alpine's x-intersect) renders before the screenshot.
   */
  preparePage: true,

  /**
   * Called with the Playwright page just before each screenshot, eg. to
   * dismiss a cookie banner:
   *
   *   async beforeScreenshot(page, { uri, viewport }) {
   *     await page.locator('#cookie-banner button').click();
   *   },
   *
   * null: none.
   */
  beforeScreenshot: null,

  // --- Running --------------------------------------------------------------

  /**
   * Pages tested in parallel. A local site is easily overwhelmed.
   */
  workers: 4,

  /**
   * Time allowed for each page, in milliseconds.
   */
  timeout: 120_000,

  /**
   * Shell command run in the project after each checkout, eg. to clear
   * caches: 'php craft clear-caches/all'. null: none.
   */
  afterCheckout: null,

  /**
   * Paths whose changes aren't applied to the running site by checking out
   * a ref alone (dependencies, project config, migrations). A warning lists
   * any that differ between the two refs, as differences in screenshots may
   * then come from them rather than from templates.
   */
  siteStatePaths: ['composer.lock', 'config/project', 'migrations'],

  /**
   * Where everything pagedrift generates goes (screenshots, cached
   * baselines, the report), relative to the project. It ignores itself in
   * git, so needs no .gitignore entry.
   */
  outputDir: '.pagedrift',
};

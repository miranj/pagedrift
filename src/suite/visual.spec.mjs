import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import { preparePage } from '../prepare.mjs';
import { loadRun } from '../run-state.mjs';
import { pageUrl } from '../uris.mjs';

const { state, settings } = await loadRun();

// Applied only while taking screenshots. Elements are hidden with
// visibility:hidden so they keep their layout box, and size changes are
// still caught.
const screenshotStyle = [
  settings.hide.length &&
    `${settings.hide.join(',\n')} { visibility: hidden !important; }`,
  '*, *::before, *::after { scroll-behavior: auto !important; }',
]
  .filter(Boolean)
  .join('\n');

// Headless Chromium says so in its user agent, and some embeds (eg. Vimeo)
// then load a Cloudflare challenge in place of their content. That keeps
// the network busy and changes how the page looks, so pass as regular
// Chrome, unless the viewport sets its own user agent.
let chromeUserAgent;
test.use({
  userAgent: async ({ browser }, use, testInfo) => {
    chromeUserAgent ??= await headedUserAgent(browser);
    await use(testInfo.project.use.userAgent ?? chromeUserAgent);
  },
});

for (const uri of state.uris) {
  test(uri || '/', async ({ page }, testInfo) => {
    // One snapshot file per URI, nested by path segment
    const name = snapshotName(uri);
    const snapshotPath = testInfo.snapshotPath(...name);
    test.skip(
      state.capturingBaseline && existsSync(snapshotPath),
      'Baseline already captured',
    );

    await page.goto(pageUrl(state.baseUrl, uri, settings.cacheBustQuery));
    if (settings.preparePage) {
      await preparePage(page);
    }
    await settings.beforeScreenshot?.(page, {
      uri,
      viewport: testInfo.project.name,
    });
    await expect(page).toHaveScreenshot(name, {
      fullPage: true,
      style: screenshotStyle,
      mask: settings.mask.map((selector) => page.locator(selector)),
    });

    // The report only includes screenshots of failures, so attach the
    // matching snapshot to passing tests too
    await testInfo.attach('screenshot', {
      path: snapshotPath,
      contentType: 'image/png',
    });
  });
}

function snapshotName(uri) {
  const segments = uri.split(/[/?]/).filter(Boolean);

  return segments.length
    ? [...segments.slice(0, -1), segments.at(-1) + '.png']
    : ['index.png'];
}

async function headedUserAgent(browser) {
  const page = await browser.newPage();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  await page.close();

  return userAgent.replace('HeadlessChrome/', 'Chrome/');
}

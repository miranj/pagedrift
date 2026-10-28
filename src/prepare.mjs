/**
 * Gets a page into a stable state for a full-page screenshot: loads lazy
 * images (native and lazysizes), and scrolls through the page so that
 * intersection-triggered content (Alpine x-intersect) renders.
 */
export async function preparePage(page) {
  await page.waitForLoadState('networkidle');

  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    document
      .querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]')
      .forEach((el) => (el.loading = 'eager'));
    if (window.lazySizes) {
      document
        .querySelectorAll('.lazyload')
        .forEach((el) => window.lazySizes.loader.unveil(el));
    }

    // Instant, not smooth: interrupted smooth scrolls can leave Chromium's
    // compositor slightly offset, which shifts fixed elements in the
    // full-page screenshot
    for (
      let y = 0;
      y < document.documentElement.scrollHeight;
      y += window.innerHeight
    ) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await sleep(50);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });

    // lazysizes starts some loads after a delay, and skips images it
    // considers out of view (eg. in carousels), so keep unveiling and
    // checking until nothing visible is waiting to load
    const isLoading = () => {
      const pendingLazy = [
        ...document.querySelectorAll('.lazyload, .lazyloading'),
      ].filter((el) => el.getClientRects().length > 0);
      pendingLazy
        .filter((el) => el.classList.contains('lazyload'))
        .forEach((el) => window.lazySizes?.loader.unveil(el));

      return (
        pendingLazy.length > 0 ||
        [...document.images].some((img) => !img.complete)
      );
    };

    await document.fonts.ready;
    const deadline = performance.now() + 10_000;
    while (isLoading() && performance.now() < deadline) {
      await sleep(100);
    }
  });

  await page.waitForLoadState('networkidle');
}

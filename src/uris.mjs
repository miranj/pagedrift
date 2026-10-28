/**
 * Builds the list of pages to test: a few randomly picked URIs from every
 * sitemap, plus the fixed URIs in the `uris` setting.
 *
 * A URI here is whatever follows the base URL in a page's URL, with no
 * assumption about where the site's root is. Pages are requested at
 * base URL + URI.
 */

import { gunzipSync } from 'node:zlib';
import { request } from '@playwright/test';
import { XMLParser } from 'fast-xml-parser';

/**
 * The same seed always picks the same URIs (for the same sitemaps).
 */
export async function collectUris(settings, baseUrl, seed) {
  const random = seededRandom(seed);
  const uris = [];

  const context = await request.newContext({
    ignoreHTTPSErrors: settings.ignoreHTTPSErrors,
  });
  try {
    const fetchSitemap = async (url) =>
      xmlParser.parse(await fetchText(context, url));

    for (const sitemap of await leafSitemaps(
      new URL(settings.sitemap, baseUrl).href,
      fetchSitemap,
    )) {
      const { urlset } = await fetchSitemap(sitemap);
      for (const loc of pick(
        locs(urlset?.url),
        settings.urisPerSitemap,
        random,
      )) {
        uris.push(toUri(loc, baseUrl));
      }
    }
  } finally {
    await context.dispose();
  }

  uris.push(...settings.uris.map(normalizeUri));

  return [...new Set(uris)];
}

/**
 * The full URL to test for a URI.
 */
export function pageUrl(baseUrl, uri, cacheBustQuery) {
  const url = baseUrl + uri;
  if (!cacheBustQuery) {
    return url;
  }

  return url + (url.includes('?') ? '&' : '?') + cacheBustQuery;
}

/**
 * The sitemaps (not sitemap indexes) to sample, following nested sitemap
 * indexes, and keeping only the first file of paginated sitemaps.
 */
async function leafSitemaps(url, fetchSitemap, seen = new Set()) {
  seen.add(url);
  const parsed = await fetchSitemap(url);
  if (!parsed.sitemapindex) {
    return [url];
  }

  const leaves = [];
  for (const loc of firstPages(locs(parsed.sitemapindex.sitemap))) {
    if (!seen.has(loc)) {
      leaves.push(...(await leafSitemaps(loc, fetchSitemap, seen)));
    }
  }

  return leaves;
}

/**
 * The first page of each paginated sitemap, and every other sitemap as is.
 * Pages of a sitemap share the same name apart from a trailing -<number>,
 * eg. sitemap-people-1.xml, sitemap-people-2.xml.
 */
export function firstPages(sitemapUrls) {
  const first = new Map();
  for (const loc of sitemapUrls) {
    const name = loc.replace(/\.xml(\.gz)?$/, '');
    const page = Number(name.match(/-(\d+)$/)?.[1] ?? 0);
    const group = name.replace(/-\d+$/, '');

    if (!first.has(group) || page < first.get(group).page) {
      first.set(group, { page, loc });
    }
  }

  return [...first.values()].map(({ loc }) => loc);
}

const xmlParser = new XMLParser({
  // Decode numeric character references (eg. &#38;) too, not only XML's
  // named entities
  htmlEntities: true,
  // Keep values as strings, even ones that look like numbers
  parseTagValue: false,
  // Keep single entries in a list, so sitemaps with one entry parse the same
  isArray: (name) => name === 'url' || name === 'sitemap',
});

/**
 * The <loc> of each <url> or <sitemap> entry.
 */
function locs(entries = []) {
  return entries.map(({ loc }) => loc.trim());
}

/**
 * Strips the base URL from a sitemap URL, leaving the URI.
 */
export function toUri(url, baseUrl) {
  // The site's root URL may be listed without its trailing slash
  if (url + '/' === baseUrl) {
    return '';
  }

  if (!url.startsWith(baseUrl)) {
    throw new Error(
      `Sitemap URL [${url}] is not under the site URL [${baseUrl}]. Set the site URL (baseUrl in pagedrift.config.mjs, or the .env variable in baseUrlEnvVar) to the URL the site generates its links with.`,
    );
  }

  return url.slice(baseUrl.length);
}

/**
 * A URI from the `uris` setting, without leading slashes.
 */
export function normalizeUri(uri) {
  return uri.trim().replace(/^\/+/, '');
}

/**
 * Picks `count` random items, keeping their original order.
 */
export function pick(items, count, random) {
  const indexes = items.map((_, i) => i);
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }

  return indexes
    .slice(0, Math.max(0, count))
    .sort((a, b) => a - b)
    .map((i) => items[i]);
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 32);
}

/**
 * mulberry32: a small, seedable PRNG returning floats in [0, 1).
 */
export function seededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * GETs a URL, following redirects, and decompressing gzipped sitemaps
 * (eg. sitemap.xml.gz).
 */
async function fetchText(context, url) {
  const response = await context.get(url, { timeout: 60_000 });
  if (!response.ok()) {
    throw new Error(`Could not fetch [${url}] (HTTP ${response.status()}).`);
  }

  const body = await response.body();
  const gzipped = body[0] === 0x1f && body[1] === 0x8b;

  return (gzipped ? gunzipSync(body) : body).toString('utf8');
}

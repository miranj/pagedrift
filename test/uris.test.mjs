import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  firstPages,
  normalizeUri,
  pageUrl,
  pick,
  seededRandom,
  toUri,
} from '../src/uris.mjs';

const baseUrl = 'https://example.test/';

describe('firstPages', () => {
  it('keeps only the first page of paginated sitemaps', () => {
    assert.deepEqual(
      firstPages([
        `${baseUrl}sitemap-people-2.xml`,
        `${baseUrl}sitemap-people-1.xml`,
        `${baseUrl}sitemap-pages.xml`,
        `${baseUrl}sitemap-news-1.xml.gz`,
        `${baseUrl}sitemap-news-2.xml.gz`,
      ]),
      [
        `${baseUrl}sitemap-people-1.xml`,
        `${baseUrl}sitemap-pages.xml`,
        `${baseUrl}sitemap-news-1.xml.gz`,
      ],
    );
  });
});

describe('pick', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('picks the same items for the same seed', () => {
    assert.deepEqual(
      pick(items, 3, seededRandom(42)),
      pick(items, 3, seededRandom(42)),
    );
  });

  it('keeps the original order', () => {
    const picked = pick(items, 4, seededRandom(7));
    assert.deepEqual(picked, [...picked].sort());
  });

  it('picks no more items than there are', () => {
    assert.deepEqual(pick(items, 10, seededRandom(1)), items);
    assert.deepEqual(pick(items, 0, seededRandom(1)), []);
  });
});

describe('toUri', () => {
  it('strips the base URL', () => {
    assert.equal(toUri(`${baseUrl}news/a`, baseUrl), 'news/a');
  });

  it('maps the root URL without a trailing slash to the empty URI', () => {
    assert.equal(toUri('https://example.test', baseUrl), '');
  });

  it('rejects URLs outside the base URL', () => {
    assert.throws(() => toUri('https://other.test/a', baseUrl), /not under/);
  });
});

describe('normalizeUri', () => {
  it('strips leading slashes', () => {
    assert.equal(normalizeUri('/'), '');
    assert.equal(normalizeUri(' //news/a '), 'news/a');
  });
});

describe('pageUrl', () => {
  it('adds the cache-busting query', () => {
    assert.equal(pageUrl(baseUrl, 'a', 'nocache=1'), `${baseUrl}a?nocache=1`);
    assert.equal(
      pageUrl(baseUrl, 'a?p=2', 'nocache=1'),
      `${baseUrl}a?p=2&nocache=1`,
    );
    assert.equal(pageUrl(baseUrl, 'a', null), `${baseUrl}a`);
  });
});

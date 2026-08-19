/**
 * Captures the project screenshots used by the hero reel.
 *
 *   npm run capture                 # 1440x900, one device pixel per CSS pixel
 *   npm run capture -- --scale 2    # same frame at 2x, for a larger surface
 *   npm run capture -- helical      # only slugs containing "helical"
 *
 * Requires the Chromium build Playwright ships against:
 *
 *   npx playwright install chromium
 *
 * Output lands in src/assets/screenshots/ so Astro's `astro:assets` pipeline
 * owns the resizing and re-encoding — these PNGs are the source of truth, not
 * what ends up being served.
 *
 * Determinism matters more than fidelity here. Both targets are Next.js sites
 * with entrance animations, so the context runs with `reducedMotion: 'reduce'`
 * and every page waits on fonts before the shutter fires; without that, reruns
 * disagree with each other by a few hundred milliseconds of fade.
 */

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { chromium } from 'playwright';

/** Viewport is 16:10, which is also the aspect the reel cards render at. */
const VIEWPORT = { width: 1440, height: 900 };

/** Grace period after the network goes quiet, for anything that settles late. */
const SETTLE_MS = 1200;

const OUT_DIR = fileURLToPath(new URL('../src/assets/screenshots/', import.meta.url));

/**
 * `scroll` is a y-offset in CSS pixels, for framing a band further down a page
 * rather than always shooting the fold.
 */
const TARGETS = [
  { slug: 'helical-home', url: 'https://helical.video/' },
  // Two bands further down the same page. `/track` and `/about` were the
  // obvious alternatives but both are a small form or a text column on an
  // otherwise empty page — at 340px wide in the reel they read as blank cards.
  { slug: 'helical-compare', url: 'https://helical.video/', scroll: 560 },
  { slug: 'helical-how-it-works', url: 'https://helical.video/', scroll: 1580 },
  { slug: 'helical-upload', url: 'https://helical.video/upload' },
  { slug: 'simple-trivia-home', url: 'https://simpletrivia.io/' },
  { slug: 'simple-trivia-workshop', url: 'https://simpletrivia.io/play/workshop' },
  { slug: 'simple-trivia-preflight', url: 'https://simpletrivia.io/play/preflight' },
  { slug: 'simple-trivia-about', url: 'https://simpletrivia.io/about' },
];

/**
 * Consent banners are the one thing that reliably ruins these frames —
 * helical.video runs CookieYes, which floats a panel over the bottom-left
 * corner of every page.
 *
 * Clicking through is preferred over hiding, because a dismissed banner also
 * stops re-rendering; the style tag is only a fallback for a widget whose
 * button never resolved.
 */
const CONSENT_BUTTONS = [
  '[data-cky-tag="reject-button"]',
  '.cky-btn-reject',
  '#cookie_action_close_header_reject',
];

/**
 * Dismissing leaves a floating "revisit consent" badge pinned to the corner,
 * so the style tag runs unconditionally rather than only as a fallback for a
 * button that never resolved.
 */
const CONSENT_CONTAINERS = [
  '.cky-consent-container',
  '.cky-modal',
  '.cky-overlay',
  '.cky-btn-revisit-wrapper',
  '#cookie-law-info-bar',
].join(', ');

async function dismissConsent(page) {
  for (const selector of CONSENT_BUTTONS) {
    const button = page.locator(selector).first();
    try {
      await button.waitFor({ state: 'visible', timeout: 2500 });
      await button.click();
      // The panel animates out; let it finish before anything else measures.
      await page.waitForTimeout(600);
      break;
    } catch {
      /* Not this widget, or it never appeared. Try the next selector. */
    }
  }

  await page.addStyleTag({
    content: `${CONSENT_CONTAINERS} { display: none !important; }`,
  });
}

/** Bare `--scale N`, plus any loose words treated as slug filters. */
function parseArgs(argv) {
  let scale = 1;
  const filters = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--scale') {
      scale = Number(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith('--scale=')) {
      scale = Number(arg.slice('--scale='.length));
    } else if (!arg.startsWith('-')) {
      filters.push(arg);
    }
  }

  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(`--scale must be a positive number, got "${scale}"`);
  }

  return { scale, filters };
}

async function capture(context, target) {
  const page = await context.newPage();
  const file = path.join(OUT_DIR, `${target.slug}.png`);

  try {
    const response = await page.goto(target.url, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });

    // Both are worth printing even on success: a 3xx that lands on a login
    // route still screenshots happily, and the only tell is the final URL.
    const status = response ? response.status() : 'no response';
    const landed = page.url();

    await dismissConsent(page);
    await page.evaluate(() => document.fonts.ready);

    if (target.scroll) {
      await page.evaluate((y) => window.scrollTo(0, y), target.scroll);
    }

    await page.waitForTimeout(SETTLE_MS);
    await page.screenshot({ path: file, type: 'png' });

    const redirected = landed !== target.url ? `  (landed on ${landed})` : '';
    console.log(`  ok   ${target.slug.padEnd(24)} ${status}${redirected}`);
    return true;
  } catch (error) {
    console.error(`  FAIL ${target.slug.padEnd(24)} ${error.message}`);
    return false;
  } finally {
    await page.close();
  }
}

async function main() {
  const { scale, filters } = parseArgs(process.argv.slice(2));

  const targets = filters.length
    ? TARGETS.filter((t) => filters.some((f) => t.slug.includes(f)))
    : TARGETS;

  if (!targets.length) {
    throw new Error(`No targets matched ${filters.join(', ')}`);
  }

  await mkdir(OUT_DIR, { recursive: true });

  console.log(
    `Capturing ${targets.length} screenshot(s) at ${VIEWPORT.width}x${VIEWPORT.height} @${scale}x`
  );

  const browser = await chromium.launch();
  // helical.video 403s anything that doesn't look like a browser, so the
  // default Chromium UA is load-bearing — don't override it.
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: scale,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });

  let failures = 0;
  try {
    for (const target of targets) {
      // Serial rather than parallel: eight concurrent cold page loads against
      // two small sites is a worse citizen than waiting a few extra seconds.
      const ok = await capture(context, target);
      if (!ok) failures += 1;
    }
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(`\nWrote to ${path.relative(process.cwd(), OUT_DIR)}`);
  if (failures) {
    console.error(`${failures} target(s) failed.`);
    process.exitCode = 1;
  }
}

await main();

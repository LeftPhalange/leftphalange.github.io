/**
 * Product screenshots.
 *
 * One pool, read three ways: the hero marquee takes a row per product
 * (`heroReelRows`), the hero showcase deals from the alternating `heroReel`
 * list, and each project panel shows its own product's shots
 * (`screenshotsFor`). Adding a screenshot below therefore lands it everywhere
 * at once.
 *
 * The PNGs are captured from the live sites by `npm run capture`
 * (scripts/capture-screenshots.mjs) — re-run it whenever either product's UI
 * changes rather than editing images by hand.
 *
 * These import from `src/assets`, not `public/`, so Astro's `astro:assets`
 * pipeline resizes and re-encodes them at build time. The 1440x900 originals
 * are the source of truth; nothing serves them at full size.
 */

import type { ImageMetadata } from 'astro';

import helicalHome from '../assets/screenshots/helical-home.png';
import helicalCompare from '../assets/screenshots/helical-compare.png';
import helicalHowItWorks from '../assets/screenshots/helical-how-it-works.png';
import helicalUpload from '../assets/screenshots/helical-upload.png';
import triviaHome from '../assets/screenshots/simple-trivia-home.png';
import triviaWorkshop from '../assets/screenshots/simple-trivia-workshop.png';
import triviaPreflight from '../assets/screenshots/simple-trivia-preflight.png';
import triviaAbout from '../assets/screenshots/simple-trivia-about.png';

export interface Screenshot {
  src: ImageMetadata;
  /**
   * Matches a `name` in projects.ts — that string is the join between the two
   * files, so renaming a project there means renaming it here too.
   */
  project: 'Helical' | 'Simple Trivia Game';
  /**
   * Which screen this is. Decoration in the hero, where it is not rendered, but
   * the project galleries show it as the caption and fold it into the alt text
   * — so write it as a screen name a reader would recognise.
   */
  label: string;
}

/**
 * Deliberately alternating between the two products. The showcase treatment
 * deals cards from this list in order, so alternating is what keeps two
 * different products in the air at once instead of a run of one.
 *
 * The marquee does not read it in this order — see `heroReelRows`.
 *
 * Order *within* a product is the order its project panel shows, so each
 * product leads with its landing page; the alternation is preserved by keeping
 * each product on the positions it already held.
 */
export const heroReel: Screenshot[] = [
  { src: helicalHome, project: 'Helical', label: 'Landing' },
  { src: triviaHome, project: 'Simple Trivia Game', label: 'Landing' },
  { src: helicalCompare, project: 'Helical', label: 'Before & after' },
  { src: triviaWorkshop, project: 'Simple Trivia Game', label: 'Trivia Workshop' },
  { src: helicalUpload, project: 'Helical', label: 'Upload' },
  { src: triviaAbout, project: 'Simple Trivia Game', label: 'About' },
  { src: helicalHowItWorks, project: 'Helical', label: 'How it works' },
  { src: triviaPreflight, project: 'Simple Trivia Game', label: 'Custom game' },
];

/**
 * Every shot of one product, in `heroReel` order.
 *
 * Takes a plain string because callers pass `project.name` from projects.ts,
 * which is typed as `string`. A name with no screenshots yet simply yields an
 * empty array, and both callers handle that by rendering nothing — which is why
 * a new project can be added there before its captures exist.
 */
export function screenshotsFor(projectName: string): Screenshot[] {
  return heroReel.filter((shot) => shot.project === projectName);
}

/**
 * The marquee's rows, one per product: everything Helical streams along the top
 * row, everything Simple Trivia along the bottom. Two distinct sets rather than
 * one list cut in half, so each row reads as a single product's story and the
 * two rows never show the same frame at the same time.
 *
 * Derived from `heroReel` rather than listed out again, so a screenshot added
 * above lands in its row automatically and the two can never drift out of sync.
 */
export const heroReelRows: Screenshot[][] = [
  screenshotsFor('Helical'),
  screenshotsFor('Simple Trivia Game'),
];

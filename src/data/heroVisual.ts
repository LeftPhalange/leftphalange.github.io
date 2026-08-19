/**
 * Which treatment the hero's screenshot media gets.
 *
 * Two complete implementations ship side by side, and this constant picks one
 * at build time — flip the value, rebuild, done. Nothing else needs editing:
 * Hero.astro renders the matching component, and each animation in
 * scripts/animations.ts is keyed to its own `data-animate` hook, so the one
 * that isn't on the page simply finds nothing and returns.
 *
 *  'marquee'  — components/HeroReel.astro. Two rows of cards streaming
 *               right-to-left, bleeding off the right viewport edge and
 *               dissolving into the background as they near the intro copy.
 *               One product per row. This is the original treatment, kept as
 *               the fallback.
 *
 *  'showcase' — components/HeroShowcase.astro. Loose, tilted cards arriving two
 *               or three at a time, growing toward the viewer and dissolving —
 *               a montage of angles across both projects.
 *
 * Both draw from data/screenshots.ts — the showcase from the alternating
 * `heroReel` list, the marquee from `heroReelRows`, which is that same list
 * split one row per product. Both are decorative: neither renders below `lg`,
 * and neither is announced.
 */

export type HeroVisual = 'marquee' | 'showcase';

export const heroVisual: HeroVisual = 'marquee';

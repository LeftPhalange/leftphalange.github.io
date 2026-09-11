/**
 * Marks the nav link whose section is currently in view.
 *
 * Deliberately NOT part of animations.ts: that module returns before touching
 * anything under `prefers-reduced-motion: reduce`, and "which section am I in"
 * is information, not decoration — it has to work for everyone. Keeping it
 * separate also means it survives a bail-out in the animation bundle.
 *
 * Plain IntersectionObserver rather than a ScrollTrigger: no scroll handler, no
 * layout reads, and no dependency on GSAP having initialised.
 *
 * The state written is `aria-current="location"` on the anchor — the canonical
 * value for "this is the part of the page you are on". The highlight is styled
 * off that same attribute in components/Nav.astro, so what is painted and what
 * is announced cannot drift apart.
 *
 * Nothing here is required to read or navigate the page: with JavaScript off no
 * link is marked, and the nav is exactly the static one that was served.
 */

/** Set by Nav.astro on every section anchor in the bar. */
const LINK_SELECTOR = 'a[data-nav-link]';

/**
 * The band, as a share of the viewport, that decides which section is current.
 *
 * Insetting the observer root from both edges leaves a thin horizontal strip
 * across the middle of the screen: a section is "current" while that strip is
 * inside it. Reading the middle of the viewport rather than its top is what
 * makes the highlight change when the section visually takes over, instead of
 * the moment its first pixel appears.
 */
const BAND_INSET = '-48%';

interface Target {
  link: HTMLAnchorElement;
  section: HTMLElement;
}

function initNavHighlight(): void {
  if (!('IntersectionObserver' in window)) return;

  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(LINK_SELECTOR),
  );

  // Links pointing at an id that is not on this page are simply skipped, so a
  // nav entry for a section that does not exist here costs nothing.
  const targets = links.reduce<Target[]>((found, link) => {
    const id = link.hash.slice(1);
    const section = id ? document.getElementById(id) : null;
    if (section) found.push({ link, section });
    return found;
  }, []);

  if (targets.length === 0) return;

  const inView = new Set<Element>();

  const sync = (): void => {
    // Resolved in document order: if the band ever straddles two sections, the
    // same one wins every time rather than whichever callback fired last.
    const current = targets.find((target) => inView.has(target.section));

    for (const target of targets) {
      if (target === current) {
        target.link.setAttribute('aria-current', 'location');
      } else {
        target.link.removeAttribute('aria-current');
      }
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      }
      sync();
    },
    { rootMargin: `${BAND_INSET} 0px ${BAND_INSET} 0px` },
  );

  for (const target of targets) observer.observe(target.section);
}

initNavHighlight();

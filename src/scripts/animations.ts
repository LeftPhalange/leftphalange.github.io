/**
 * All motion for the site. Imported once from BaseLayout.astro.
 *
 * ACCESSIBILITY CONTRACT — do not break this:
 *
 *  1. Nothing is hidden by default in CSS. There is no `opacity: 0`, no
 *     `visibility: hidden`, and no base-state transform anywhere in src/.
 *     Every start state in this file is applied at RUNTIME by GSAP, so with
 *     JavaScript disabled (or if this bundle 404s) the page renders complete.
 *
 *  2. `prefers-reduced-motion: reduce` returns before a single style is
 *     touched. Under reduced motion the page is simply the static document.
 *
 *  3. The one FOUC guard — staging the hero synchronously before the fonts
 *     settle — is JS-set, wrapped in try/catch, and backed by a watchdog that
 *     clears the staged styles if the intro never plays. It cannot strand
 *     content in an invisible state.
 *
 * Targeting is exclusively via `data-animate="..."` hooks (inventory documented
 * at the top of src/pages/index.astro). Class names are styling only.
 *
 * Only `transform` and `opacity` are animated — never layout properties.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// SplitText is NOT a named export of the main `gsap` entry; it must come from
// the subpath. GSAP 3.13+ ships the former Club plugins for free.
import SplitText from 'gsap/SplitText';
import { initHandGame } from './handGame.ts';

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ------------------------------------------------------------------ *
 * Shared tuning
 * ------------------------------------------------------------------ */

const EASE_OUT = 'power3.out';

/** Modest scroll-reveal defaults, reused by every "enter" animation. */
const REVEAL = {
  y: 26,
  opacity: 0,
  duration: 0.65,
  ease: EASE_OUT,
} as const;

/** Where an element must reach before its reveal fires. */
const REVEAL_START = 'top 85%';

/* ------------------------------------------------------------------ *
 * Hook helpers
 * ------------------------------------------------------------------ */

const hookSelector = (hook: string): string => `[data-animate="${hook}"]`;

function one<T extends HTMLElement = HTMLElement>(hook: string): T | null {
  return document.querySelector<T>(hookSelector(hook));
}

function many<T extends HTMLElement = HTMLElement>(hook: string): T[] {
  return Array.from(document.querySelectorAll<T>(hookSelector(hook)));
}

/**
 * Resolves when webfonts have settled, or after `timeoutMs` if the font
 * loading promise never comes back. Line/character splitting measured against
 * a fallback font re-wraps the moment the real font swaps in, and stale
 * ScrollTrigger positions are the classic cause of reveals that never fire —
 * so everything downstream of this waits, but nothing waits forever.
 */
function fontsSettled(timeoutMs = 1500): Promise<void> {
  const ready = document.fonts?.ready;
  if (!ready) return Promise.resolve();

  return Promise.race([
    ready.then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}

/* ------------------------------------------------------------------ *
 * Hero — plays on load, not on scroll
 * ------------------------------------------------------------------ */

interface HeroParts {
  chip: HTMLElement | null;
  title: HTMLElement | null;
  subtitle: HTMLElement | null;
  intro: HTMLElement | null;
  /** The "See my work" button below the intro copy. */
  cta: HTMLElement | null;
  linkItems: HTMLElement[];
  /**
   * The marquee reel, in `marquee` mode. Absent in `showcase` mode, and below
   * `lg`, where neither treatment is rendered. See data/heroVisual.ts.
   */
  reel: HTMLElement | null;
  /** The crossfading showcase, in `showcase` mode. The reel's counterpart. */
  showcase: HTMLElement | null;
  /** Everything staged synchronously, so the watchdog can undo it. */
  staged: HTMLElement[];
}

function collectHero(): HeroParts {
  const chip = one('hero-chip');
  const title = one('hero-title');
  const subtitle = one('hero-subtitle');
  const intro = one('hero-intro');
  const cta = one('hero-cta');
  const links = one('hero-links');
  // At most one of these is on the page; both are null below `lg`.
  const reel = one('hero-reel');
  const showcase = one('hero-showcase');

  const linkItems = links
    ? Array.from(links.querySelectorAll<HTMLElement>(':scope > li'))
    : [];

  const staged = [
    chip,
    subtitle,
    intro,
    cta,
    ...linkItems,
    title,
    reel,
    showcase,
  ].filter((el): el is HTMLElement => el !== null);

  return { chip, title, subtitle, intro, cta, linkItems, reel, showcase, staged };
}

/**
 * Applies the hero's start state immediately, before the fonts settle.
 *
 * Without this the hero would paint fully, then snap back to its start state a
 * beat later when SplitText is ready — a visible flinch. These are inline
 * styles written by JS, so the no-JS path is untouched.
 */
function stageHero(hero: HeroParts): void {
  const offset = [
    hero.chip,
    hero.subtitle,
    hero.intro,
    hero.cta,
    ...hero.linkItems,
  ].filter((el): el is HTMLElement => el !== null);

  if (offset.length) gsap.set(offset, { opacity: 0, y: 16 });
  // The title is only faded, never offset: its characters carry the movement
  // once SplitText has run.
  if (hero.title) gsap.set(hero.title, { opacity: 0 });
  // The reel drifts in from the side it travels from. Staged on the container,
  // never on the rows — those belong to the marquee tween.
  if (hero.reel) gsap.set(hero.reel, { opacity: 0, x: 40 });
  // The showcase has nowhere to travel in from, so it resolves in place. Staged
  // on the stage, never on the cards — those belong to the montage, which owns
  // their transforms; a second one here would fight it.
  if (hero.showcase) gsap.set(hero.showcase, { opacity: 0, y: 18 });
}

/** Removes every staged style, returning the hero to its natural CSS state. */
function unstageHero(hero: HeroParts): void {
  if (hero.staged.length) gsap.set(hero.staged, { clearProps: 'all' });
}

/**
 * The intro timeline. Total runtime ~1.15s — it plays on every visit, so it
 * must not feel like a preloader.
 */
function playHero(hero: HeroParts, splits: SplitText[]): void {
  const tl = gsap.timeline({ defaults: { ease: EASE_OUT } });

  if (hero.title) {
    // Fonts have settled by now, so the split measures against the real face.
    const split = SplitText.create(hero.title, {
      type: 'chars,words',
      // "auto" leaves an aria-label on the heading so assistive tech still
      // reads "Hi, I'm Ethan" rather than spelling out the character spans.
      aria: 'auto',
      // The hand animates as a whole element on its own loop. Left to the
      // split it would become a char span, and the entrance tween and the wave
      // would then be two tweens fighting over one transform.
      ignore: hookSelector('hero-wave'),
    });
    splits.push(split);

    // The heading itself is visible again; its characters now hold the reveal.
    gsap.set(hero.title, { opacity: 1 });

    tl.from(
      split.chars,
      {
        yPercent: 60,
        opacity: 0,
        duration: 0.55,
        stagger: 0.018,
      },
      0
    );

    // Re-resolved rather than reused from collectHero(): SplitText rewrites the
    // heading's markup around it.
    const wave = one('hero-wave');
    if (wave) {
      // Being split-exempt also means being reveal-exempt, so it gets the same
      // entrance by hand, landing with the last of the characters.
      const lastChar = split.chars.length * 0.018;
      tl.from(wave, { yPercent: 60, opacity: 0, duration: 0.55 }, lastChar);
      // The game borrows the same element and the same timeline: it pauses the
      // wave for the length of a run and restarts it when the hand comes home.
      initHandGame(wave, startWave(wave, lastChar + 0.75));
    }
  }

  // These were staged in stageHero(), so they animate *to* their natural
  // state and then have the inline styles cleared off entirely.
  if (hero.chip) {
    tl.to(hero.chip, { opacity: 1, y: 0, duration: 0.5, clearProps: 'all' }, 0.12);
  }
  if (hero.subtitle) {
    tl.to(hero.subtitle, { opacity: 1, y: 0, duration: 0.5, clearProps: 'all' }, 0.28);
  }
  if (hero.intro) {
    tl.to(hero.intro, { opacity: 1, y: 0, duration: 0.5, clearProps: 'all' }, 0.38);
  }
  // The CTA lands between the copy and the link row — it is the beat the eye
  // should arrive on, so it is not buried inside the links' stagger.
  if (hero.cta) {
    tl.to(hero.cta, { opacity: 1, y: 0, duration: 0.45, clearProps: 'all' }, 0.46);
  }
  if (hero.linkItems.length) {
    tl.to(
      hero.linkItems,
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, clearProps: 'all' },
      0.58
    );
  }
  // Slower and longer than the copy: the screenshots are the backdrop to the
  // intro, not a beat in it.
  if (hero.reel) {
    tl.to(hero.reel, { opacity: 1, x: 0, duration: 0.9, clearProps: 'all' }, 0.35);
  }
  if (hero.showcase) {
    tl.to(hero.showcase, { opacity: 1, y: 0, duration: 0.9, clearProps: 'all' }, 0.35);
  }
}

/* ------------------------------------------------------------------ *
 * The 👋 — a periodic wave, not a permanent one
 * ------------------------------------------------------------------ */

/**
 * Rocks the hand back and forth a few times, pauses, repeats.
 *
 * Rotation only, pivoting near the wrist at the bottom of the glyph, so the
 * hand swings rather than spinning about its centre. The swings decay and the
 * long `repeatDelay` keeps it from becoming a flashing banner in the corner of
 * the reader's eye — it should catch attention once, not hold it.
 *
 * @param delay Seconds to wait before the first wave, so it starts after the
 *              heading's entrance rather than during it.
 * @returns The looping timeline, so the easter egg (scripts/handGame.ts) can
 *          stop the wave while the hand is in play and restart it afterwards.
 */
function startWave(wave: HTMLElement, delay: number): gsap.core.Timeline {
  gsap.set(wave, { transformOrigin: '70% 80%' });

  return gsap
    .timeline({ delay, repeat: -1, repeatDelay: 3.5 })
    .to(wave, { rotate: 18, duration: 0.16, ease: 'power2.out' })
    .to(wave, { rotate: -12, duration: 0.2, ease: 'power1.inOut' })
    .to(wave, { rotate: 15, duration: 0.18, ease: 'power1.inOut' })
    .to(wave, { rotate: -8, duration: 0.18, ease: 'power1.inOut' })
    .to(wave, { rotate: 0, duration: 0.24, ease: 'power2.inOut' });
}

/* ------------------------------------------------------------------ *
 * Nav — hide on scroll down, reveal on scroll up
 * ------------------------------------------------------------------ */

function initNav(): void {
  const nav = one('nav');
  if (!nav) return;

  let hidden = false;

  /**
   * Marks the document while the bar is away, so the sticky section headings
   * can close the strip it leaves behind — `--nav-offset` in styles/global.css
   * reads this class and the headings transition between the two positions,
   * travelling with the nav instead of hanging below a gap.
   *
   * A class on <html> rather than a style written from here: the offsets then
   * live entirely in the stylesheet, and with JavaScript off the class is never
   * added, which is the correct resting state for a nav that never moves.
   */
  const markDocument = (): void => {
    document.documentElement.classList.toggle('nav-hidden', hidden);
  };

  const show = (): void => {
    if (!hidden) return;
    hidden = false;
    markDocument();
    gsap.to(nav, { yPercent: 0, duration: 0.35, ease: 'power2.out', overwrite: true });
  };

  const hide = (): void => {
    if (hidden) return;
    hidden = true;
    markDocument();
    gsap.to(nav, { yPercent: -100, duration: 0.35, ease: 'power2.in', overwrite: true });
  };

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      // Never hide near the top of the page — the bar belongs to the hero there.
      if (self.scroll() < nav.offsetHeight * 2) {
        show();
        return;
      }
      if (self.direction === 1) hide();
      else show();
    },
  });

  // A keyboard user tabbing into the hidden bar must be able to see it.
  nav.addEventListener('focusin', show);
}

/* ------------------------------------------------------------------ *
 * Section headings — word stagger on enter
 * ------------------------------------------------------------------ */

function initSectionHeadings(splits: SplitText[]): void {
  many('section-heading').forEach((heading) => {
    const h2 = heading.querySelector<HTMLElement>('h2');
    // Eyebrow and lede, whichever of them this heading actually rendered.
    const supporting = Array.from(heading.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child !== h2
    );

    const tl = gsap.timeline({
      scrollTrigger: { trigger: heading, start: REVEAL_START, once: true },
      defaults: { ease: EASE_OUT },
    });

    if (h2) {
      const split = SplitText.create(h2, { type: 'words', aria: 'auto' });
      splits.push(split);
      // SplitText sets display: inline-block on words, so yPercent is safe.
      tl.from(split.words, { yPercent: 45, opacity: 0, duration: 0.5, stagger: 0.05 }, 0);
    }

    if (supporting.length) {
      tl.from(supporting, { y: 12, opacity: 0, duration: 0.5, stagger: 0.08 }, 0.1);
    }
  });
}

/* ------------------------------------------------------------------ *
 * Work timeline — rail draw + per-entry reveal with a node pop
 * ------------------------------------------------------------------ */

function initWorkTimeline(): void {
  const rail = one('timeline-rail');
  const list = rail?.parentElement ?? null;

  if (rail && list) {
    // transformOrigin is set here rather than in CSS so no styling in src/
    // depends on this script having run.
    gsap.set(rail, { transformOrigin: 'top center' });
    gsap.fromTo(
      rail,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: list,
          start: 'top 75%',
          end: 'bottom 75%',
          scrub: 0.4,
        },
      }
    );
  }

  many('work-entry').forEach((entry) => {
    const node = entry.querySelector<HTMLElement>(hookSelector('work-node'));

    const tl = gsap.timeline({
      scrollTrigger: { trigger: entry, start: REVEAL_START, once: true },
    });

    tl.from(entry, { ...REVEAL });

    if (node) {
      // The dot lands just after its entry, roughly as the drawn rail reaches it.
      tl.from(
        node,
        { scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(2.2)' },
        0.18
      );
    }
  });
}

/* ------------------------------------------------------------------ *
 * Hero screenshots — one of two treatments, chosen in data/heroVisual.ts
 *
 * Both init functions below are always called. Each looks for its own hook and
 * returns when the other treatment is the one on the page (and when neither is,
 * below `lg`), so switching treatments needs no change here.
 * ------------------------------------------------------------------ */

/**
 * Suspends `loops` while `el` is off screen — there is nothing to see, so there
 * is no reason to pay for the frames.
 */
function pauseWhenOffscreen(el: HTMLElement, loops: gsap.core.Animation[]): void {
  ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      loops.forEach((loop) => (self.isActive ? loop.play() : loop.pause()));
    },
  });
}

/**
 * Travel speed in CSS pixels per second, before each row's `data-speed`
 * multiplier. Derived durations (rather than a hard-coded number of seconds)
 * are what keep rows of different widths moving at a matched pace.
 */
const REEL_PX_PER_SECOND = 34;

function initHeroReel(): void {
  // Below `lg` the reel is display:none and every row measures zero wide — an
  // infinite repeat on a zero duration would spin the ticker flat out. Gating
  // on matchMedia both avoids that and builds the loops if the window is later
  // resized up into range; GSAP reverts them on the way back down.
  gsap.matchMedia().add('(min-width: 1024px)', () => {
    const loops = many('hero-reel-row')
      .map((row) => {
        // HeroReel.astro renders each row's cards twice, so half the track is
        // exactly one set: translating by -50% lands the duplicate where the
        // original began, and the wrap is invisible.
        const half = row.getBoundingClientRect().width / 2;
        if (half < 1) return null;

        const speed = Number(row.dataset.speed) || 1;

        return gsap.to(row, {
          xPercent: -50,
          duration: half / (REEL_PX_PER_SECOND * speed),
          ease: 'none',
          repeat: -1,
        });
      })
      .filter((loop): loop is gsap.core.Tween => loop !== null);

    if (!loops.length) return;

    const reel = one('hero-reel');
    if (reel) pauseWhenOffscreen(reel, loops);
  });
}

/* ------------------------------------------------------------------ *
 * Hero showcase — cards arriving toward the viewer, two or three at a time
 * ------------------------------------------------------------------ */

/** Seconds between arrivals: one card enters, and `step` later the next does. */
const SHOWCASE_STEP = 1.4;
/**
 * Seconds a card is on screen, from the start of its fade-in to the end of its
 * fade-out. LIFE / STEP is therefore how many cards share the stage — keep it
 * just under three, which is a crowd without being a pile.
 */
const SHOWCASE_LIFE = 4;
const SHOWCASE_FADE_IN = 0.9;
const SHOWCASE_FADE_OUT = 1.1;
/**
 * The approach. A card grows across its whole life, on an accelerating ease, so
 * it reads as travelling toward the viewer at a constant speed rather than as a
 * box being scaled — the same reason a car looks like it speeds up as it nears.
 */
const SHOWCASE_SCALE_FROM = 0.78;
const SHOWCASE_SCALE_TO = 1.16;
/**
 * How many depth bands a card passes through as it ages, used to keep nearer
 * (bigger) cards painted over further ones — DOM order can't, because a card's
 * position in the markup has nothing to do with how long it has been on screen.
 *
 * LIFE / BANDS must stay below STEP so that two cards on screen together can
 * never land in the same band and have their order fall back to DOM order.
 */
const SHOWCASE_DEPTH_BANDS = 4;
/** Held back so the first card arrives with the stage, not ahead of it. */
const SHOWCASE_LEAD = 0.5;

function initHeroShowcase(): void {
  // Below `lg` the showcase is display:none, so there is nothing to cycle.
  // Matching the reel's gate also means the cycle is built if the window is
  // later resized up into range, and reverted on the way back down.
  gsap.matchMedia().add('(min-width: 1024px)', () => {
    const showcase = one('hero-showcase');
    const cards = many('hero-showcase-card');
    // With a single card there is no montage — leave the static screenshot be.
    if (!showcase || cards.length < 2) return;

    /** One full pass through every card. Each owns exactly one `step` slot. */
    const cycle = cards.length * SHOWCASE_STEP;
    // Clamped so a short screenshot list can't ask a card to outlive the cycle,
    // which would mean a negative wait before it comes round again.
    const life = Math.min(SHOWCASE_LIFE, cycle);

    // Hidden up front, in one call, so no card can flash at its resting size in
    // the gap between this running and its own timeline first rendering.
    gsap.set(cards, { opacity: 0 });

    const loops = cards.map((card, index) => {
      /*
        The lane wrapper (see HeroShowcase.astro) — it holds the anchor and the
        tilt, and being the positioned element, it is also what the depth
        ordering has to be written to. The card inside it is left entirely to
        GSAP.
      */
      const lane = card.parentElement ?? card;
      const driftX = Number(card.dataset.driftX) || 0;
      const driftY = Number(card.dataset.driftY) || 0;

      /*
        One self-contained loop per card rather than one timeline for all of
        them: the stagger is just this timeline's `delay`, and the wait before
        the card comes round again is `repeatDelay`, so nothing has to be
        wrapped around the end of a shared cycle. Every repeat replays the same
        life from the same start state.
      */
      const tl = gsap.timeline({
        delay: SHOWCASE_LEAD + index * SHOWCASE_STEP,
        repeat: -1,
        repeatDelay: cycle - life,
      });

      tl.set(card, { opacity: 0, scale: SHOWCASE_SCALE_FROM, x: 0, y: 0 }, 0)
        .to(card, { opacity: 1, duration: SHOWCASE_FADE_IN, ease: 'power2.out' }, 0)
        .to(
          card,
          {
            scale: SHOWCASE_SCALE_TO,
            x: driftX,
            y: driftY,
            duration: life,
            ease: 'power1.in',
          },
          0
        )
        .to(
          card,
          { opacity: 0, duration: SHOWCASE_FADE_OUT, ease: 'power2.in' },
          life - SHOWCASE_FADE_OUT
        );

      // Bands, not a tween: z-index only takes whole numbers, and stepping it
      // as the card ages is enough to keep the stack in depth order.
      for (let band = 0; band < SHOWCASE_DEPTH_BANDS; band += 1) {
        tl.set(lane, { zIndex: band + 1 }, (life / SHOWCASE_DEPTH_BANDS) * band);
      }

      return tl;
    });

    pauseWhenOffscreen(showcase, loops);
  });
}

/* ------------------------------------------------------------------ *
 * Project panels — reveal plus a scrubbed parallax on the heading
 * ------------------------------------------------------------------ */

function initProjectPanels(): void {
  many('project-panel').forEach((panel) => {
    gsap.from(panel, {
      ...REVEAL,
      scrollTrigger: { trigger: panel, start: 'top 80%', once: true },
    });

    // No dedicated hook exists for the project title; it is the only <h3> in a
    // panel. Different target from the reveal above, so the two never fight.
    const heading = panel.querySelector<HTMLElement>('h3');
    if (!heading) return;

    gsap.fromTo(
      heading,
      { y: 20 },
      {
        y: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: panel,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

/* ------------------------------------------------------------------ *
 * Remaining one-shot reveals
 * ------------------------------------------------------------------ */

function initSimpleReveals(): void {
  // One ScrollTrigger for the whole skills block rather than four.
  const skillGroups = many('skill-group');
  if (skillGroups.length) {
    gsap.from(skillGroups, {
      ...REVEAL,
      y: 20,
      duration: 0.6,
      stagger: 0.1,
      scrollTrigger: {
        trigger: skillGroups[0].parentElement ?? skillGroups[0],
        start: REVEAL_START,
        once: true,
      },
    });
  }

  (['open-source', 'education'] as const).forEach((hook) => {
    const el = one(hook);
    if (!el) return;
    gsap.from(el, {
      ...REVEAL,
      scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
    });
  });

  const footer = one('footer');
  if (footer) {
    // The footer is the last thing on the page and can be taller than the gap
    // above it, so it gets a start that is reachable without overscroll.
    gsap.from(footer, {
      ...REVEAL,
      scrollTrigger: { trigger: footer, start: 'top 95%', once: true },
    });
  }
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

function init(): void {
  // Hard gate. Under reduced motion nothing below runs, no style is written,
  // and every element sits in its natural, fully visible final state.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hero = collectHero();
  const splits: SplitText[] = [];

  /**
   * Puts the DOM back the way it was served.
   *
   * A `from` tween writes its start state the moment it is created, so a throw
   * partway through setup could otherwise strand whatever had already been set
   * up in an invisible state. Tearing down in this order — triggers, tweens,
   * splits, then every inline style GSAP wrote — guarantees it cannot.
   */
  const bailOut = (error: unknown): void => {
    console.error('[animations] disabled after an error:', error);
    try {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.globalTimeline.clear();
      splits.forEach((split) => split.revert());
      unstageHero(hero);
      gsap.set('[data-animate], [data-animate] *', { clearProps: 'all' });
    } catch {
      /* Nothing further we can do; the content is already in the document. */
    }
  };

  try {
    stageHero(hero);
  } catch (error) {
    bailOut(error);
    return;
  }

  // Insurance: if the intro never starts — an unexpected throw, a promise that
  // never settles — the staged hero styles come off and the content is legible.
  const watchdog = window.setTimeout(() => unstageHero(hero), 4000);

  void fontsSettled().then(() => {
    window.clearTimeout(watchdog);

    try {
      playHero(hero, splits);

      // Whichever treatment is not on the page no-ops. See data/heroVisual.ts.
      initHeroReel();
      initHeroShowcase();
      initNav();
      initSectionHeadings(splits);
      initWorkTimeline();
      initProjectPanels();
      initSimpleReveals();

      // Splitting headings into words changes their line boxes, and the font
      // swap changes every height on the page. Recalculate every trigger
      // position once, after all of that has happened.
      ScrollTrigger.refresh();
    } catch (error) {
      bailOut(error);
    }
  });

  // Late-loading images (company marks, project logos) shift the page too.
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

init();

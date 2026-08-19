/**
 * The 👋 easter egg: keepie-uppie with the hero's hand.
 *
 * Click the waving hand and it detaches from the heading into a fixed overlay,
 * where gravity takes over. Every click punts it back up; let it fall past the
 * bottom of the screen and the run ends, the score is banked, and the hand
 * fades back into its place in the <h1>.
 *
 * Kept out of scripts/animations.ts on purpose — that file is the site's motion
 * layer and owns the accessibility contract. This is a toy, and it is wired in
 * from one call at the end of the hero intro.
 *
 * WHAT THIS NEVER DOES:
 *
 *  1. Reflow the heading. The original hand is only ever faded — its layout box
 *     stays exactly where it was for the whole run, so "Hi, I'm Ethan" never
 *     shifts under the reader.
 *  2. Exist without JavaScript. Both the playfield and the scoreboard are built
 *     here at runtime; nothing in the served markup relates to the game.
 *  3. Run under `prefers-reduced-motion: reduce`. The caller is already behind
 *     that gate (see the top of animations.ts) — there is no second check here
 *     because there is no second entry point.
 *  4. Swallow the page. The overlay is `pointer-events: none`; only the flying
 *     hand itself takes clicks, so every link underneath stays usable mid-game.
 */

import { gsap } from 'gsap';

/* ------------------------------------------------------------------ *
 * Tuning — all in CSS pixels and seconds
 * ------------------------------------------------------------------ */

/** Downward acceleration at score 0, before the difficulty ramp. */
const GRAVITY = 2000;
/**
 * The ramp. Gravity is multiplied by 1 + min(score / RAMP_SCORE, 1), so it
 * doubles over the first `RAMP_SCORE` hits and then holds — the early game is
 * forgiving, a long run is frantic, and it never becomes impossible.
 */
const RAMP_SCORE = 30;
const GRAVITY_MAX_MULTIPLIER = 2;

/** Upward velocity applied by a hit. Negative because +y is down. */
const HIT_IMPULSE = -760;
/**
 * How hard an off-centre hit throws the hand sideways, per pixel of offset
 * between the pointer and the hand's centre. Hitting the right edge sends it
 * left, like a real bat.
 */
const HIT_SIDE_KICK = 6;
const MAX_SPEED_X = 700;
/** Degrees per second of spin, per pixel of that same offset. */
const HIT_SPIN = 4.5;
const MAX_SPIN = 520;
/** Fraction of spin retained each second — the hand settles as it flies. */
const SPIN_DAMPING = 0.45;

/** Speed retained when reflecting off an edge. */
const WALL_BOUNCE = 0.7;
/** Terminal velocity, so a long fall stays hittable rather than a blur. */
const MAX_SPEED_Y = 1900;

/** Largest physics step integrated at once, in seconds (~30fps). */
const MAX_STEP = 1 / 30;

/** How much bigger the hand plays than it sits in the heading. */
const PLAY_SCALE = 1.15;

const BEST_KEY = 'handGame:best';

/* ------------------------------------------------------------------ *
 * Best score — persisted, but never load-bearing
 * ------------------------------------------------------------------ */

/**
 * Both accessors are wrapped: Safari in private mode throws on setItem, and a
 * storage-blocking extension can throw on read. A lost high score is not worth
 * taking the game down for.
 */
function readBest(): number {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const value = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeBest(value: number): void {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* Storage unavailable. The score still counts for this session. */
  }
}

/* ------------------------------------------------------------------ *
 * Scoreboard
 * ------------------------------------------------------------------ */

interface Hud {
  root: HTMLElement;
  score: HTMLElement;
  best: HTMLElement;
  label: HTMLElement;
}

/**
 * Builds the corner scoreboard.
 *
 * `aria-hidden`, deliberately: a score that changes on every click would either
 * be silent (pointless in the tree) or announced on every click (unbearable).
 * The game carries no document meaning, so it stays out of the tree entirely.
 */
function buildHud(best: number): Hud {
  const root = document.createElement('div');
  root.className = 'hand-game-hud';
  root.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'hand-game-hud-label';
  label.textContent = 'Score';

  const score = document.createElement('span');
  score.className = 'hand-game-hud-score';
  score.textContent = '0';

  const bestEl = document.createElement('span');
  bestEl.className = 'hand-game-hud-best';
  bestEl.textContent = best > 0 ? `Best ${best}` : '';

  const row = document.createElement('div');
  row.className = 'hand-game-hud-row';
  row.append(label, score);
  root.append(row, bestEl);

  document.body.append(root);
  return { root, score, best: bestEl, label };
}

/* ------------------------------------------------------------------ *
 * The game
 * ------------------------------------------------------------------ */

/**
 * Wires the easter egg onto the hero's hand.
 *
 * @param hand The `[data-animate="hero-wave"]` span inside the <h1>. It stays
 *             in the document throughout; only its opacity is touched.
 * @param wave The looping wave timeline, paused for the duration of a run and
 *             restarted when the hand comes home.
 */
export function initHandGame(hand: HTMLElement, wave: gsap.core.Timeline): void {
  let best = readBest();

  /** Non-null exactly while a run is in progress. */
  let run: Run | null = null;

  interface Run {
    field: HTMLElement;
    flier: HTMLElement;
    hud: Hud;
    /** Top-left of the flier, in viewport coordinates. */
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    spin: number;
    width: number;
    height: number;
    score: number;
    /** Set the moment the hand is lost, so the frame loop stops integrating. */
    over: boolean;
  }

  /* -------------------------------------------------------------- *
   * Rendering
   * -------------------------------------------------------------- */

  const draw = (state: Run): void => {
    state.flier.style.transform =
      `translate3d(${state.x}px, ${state.y}px, 0)` +
      ` rotate(${state.rotation}deg) scale(${PLAY_SCALE})`;
  };

  /* -------------------------------------------------------------- *
   * Frame loop
   * -------------------------------------------------------------- */

  /**
   * One physics step, driven by GSAP's ticker rather than a second
   * requestAnimationFrame loop — the ticker is already running for the rest of
   * the page, hands us the frame delta, and pauses with the tab.
   */
  const frame = (_time: number, deltaMs: number): void => {
    const state = run;
    if (!state || state.over) return;

    try {
      // Clamped: coming back to a backgrounded tab hands us a delta of several
      // seconds, and integrating that in one step would teleport the hand
      // through the floor before it could ever be drawn.
      const dt = Math.min(deltaMs / 1000, MAX_STEP);

      const ramp = Math.min(state.score / RAMP_SCORE, 1);
      const gravity = GRAVITY * (1 + ramp * (GRAVITY_MAX_MULTIPLIER - 1));

      state.vy = Math.min(state.vy + gravity * dt, MAX_SPEED_Y);
      state.x += state.vx * dt;
      state.y += state.vy * dt;

      state.rotation += state.spin * dt;
      // Exponential decay, framerate-independent: the same fraction is shed per
      // second whether we are running at 60fps or 144.
      state.spin *= Math.pow(SPIN_DAMPING, dt);

      const maxX = window.innerWidth - state.width;

      // Side walls reflect. Without them a hard sideways hit would park the
      // hand off-screen where it can never be clicked, and the run would end by
      // timeout rather than by dropping it.
      if (state.x < 0) {
        state.x = 0;
        state.vx = Math.abs(state.vx) * WALL_BOUNCE;
        state.spin = -state.spin * WALL_BOUNCE;
      } else if (state.x > maxX) {
        state.x = maxX;
        state.vx = -Math.abs(state.vx) * WALL_BOUNCE;
        state.spin = -state.spin * WALL_BOUNCE;
      }

      // The ceiling reflects too, so an over-enthusiastic hit doesn't send the
      // hand out of sight for a second and a half.
      if (state.y < 0) {
        state.y = 0;
        state.vy = Math.abs(state.vy) * WALL_BOUNCE;
      }

      draw(state);

      // The floor is the bottom edge of the viewport: once the hand's top has
      // passed it, nothing of it is visible and it cannot be recovered.
      if (state.y > window.innerHeight) {
        end(state);
      }
    } catch (error) {
      console.error('[handGame] stopped after an error:', error);
      // Tear down rather than throw again on every subsequent frame.
      if (run) end(run);
    }
  };

  /* -------------------------------------------------------------- *
   * Hits
   * -------------------------------------------------------------- */

  const bump = (state: Run, pointerX: number): void => {
    state.score += 1;
    state.hud.score.textContent = String(state.score);

    // A brief pop on the number, overwritten each time so rapid hits don't
    // stack half-finished scale tweens on top of each other.
    gsap.fromTo(
      state.hud.score,
      { scale: 1.35 },
      { scale: 1, duration: 0.28, ease: 'back.out(3)', overwrite: true }
    );

    state.vy = HIT_IMPULSE;

    // Where the hit landed relative to the hand's centre. Catch it on the right
    // and it goes left — the further out, the harder, and the faster it spins.
    const centre = state.x + state.width / 2;
    const offset = centre - pointerX;

    state.vx = gsap.utils.clamp(
      -MAX_SPEED_X,
      MAX_SPEED_X,
      state.vx * 0.4 + offset * HIT_SIDE_KICK
    );
    state.spin = gsap.utils.clamp(-MAX_SPIN, MAX_SPIN, -offset * HIT_SPIN);

    draw(state);
  };

  /* -------------------------------------------------------------- *
   * Start / end
   * -------------------------------------------------------------- */

  const start = (event: PointerEvent): void => {
    // The hand is measured *before* anything is hidden, so the flier appears at
    // exactly the pixel the real one occupied — no jump on the first frame.
    const box = hand.getBoundingClientRect();
    const fontSize = window.getComputedStyle(hand).fontSize;

    // The loop is killed rather than paused: it holds a rotation on the hand,
    // and a paused timeline would fight the fade-back-in at the end.
    wave.pause(0);
    gsap.set(hand, { rotate: 0, opacity: 0 });

    const field = document.createElement('div');
    field.className = 'hand-game-field';
    field.setAttribute('aria-hidden', 'true');

    const flier = document.createElement('span');
    flier.className = 'hand-game-hand';
    flier.textContent = '👋';
    flier.style.fontSize = fontSize;
    flier.style.width = `${box.width}px`;
    flier.style.height = `${box.height}px`;

    field.append(flier);
    document.body.append(field);

    const hud = buildHud(best);

    const state: Run = {
      field,
      flier,
      hud,
      x: box.left,
      y: box.top,
      vx: 0,
      vy: 0,
      rotation: 0,
      spin: 0,
      width: box.width,
      height: box.height,
      score: 0,
      over: false,
    };

    run = state;
    draw(state);

    gsap.fromTo(hud.root, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35 });

    flier.addEventListener('pointerdown', hit);
    window.addEventListener('resize', clampToViewport);
    gsap.ticker.add(frame);

    // The click that started the run is also its first hit, so the hand leaps
    // out of the heading rather than dribbling out of it.
    bump(state, event.clientX);
  };

  const end = (state: Run): void => {
    state.over = true;
    run = null;

    gsap.ticker.remove(frame);
    state.flier.removeEventListener('pointerdown', hit);
    window.removeEventListener('resize', clampToViewport);

    const final = state.score;
    if (final > best) {
      best = final;
      writeBest(best);
    }

    state.hud.label.textContent = 'Game over';
    state.hud.best.textContent = best > 0 ? `Best ${best}` : '';

    // The playfield goes immediately — the hand is already off-screen, and a
    // lingering overlay would keep intercepting clicks it no longer owns.
    state.field.remove();

    // The scoreboard holds just long enough to read, then leaves with it.
    gsap.to(state.hud.root, {
      opacity: 0,
      y: 12,
      duration: 0.4,
      delay: 1.5,
      onComplete: () => state.hud.root.remove(),
    });

    // Home. The fade is what makes it read as returning rather than as having
    // been there all along.
    gsap.to(hand, {
      opacity: 1,
      duration: 0.55,
      ease: 'power2.out',
      onComplete: () => {
        // Only resume if another run has not already started in the meantime.
        if (!run) wave.restart(true);
      },
    });
  };

  /** Keeps the hand reachable when the window shrinks out from under it. */
  const clampToViewport = (): void => {
    const state = run;
    if (!state) return;

    state.x = gsap.utils.clamp(0, Math.max(0, window.innerWidth - state.width), state.x);
    draw(state);
  };

  /* -------------------------------------------------------------- *
   * Input
   * -------------------------------------------------------------- */

  /**
   * `pointerdown` rather than `click`: it fires on press instead of release, so
   * fast play feels responsive, and one listener covers mouse, pen, and touch.
   */
  const hit = (event: PointerEvent): void => {
    event.preventDefault();
    const state = run;
    if (!state || state.over) return;
    bump(state, event.clientX);
  };

  hand.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    // Ignore clicks on the heading's hand while its double is already in play.
    if (run) return;
    start(event);
  });
}

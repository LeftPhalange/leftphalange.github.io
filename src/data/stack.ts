/**
 * The tools that show up again and again across the résumé — the hero's icon
 * strip.
 *
 * Curated, not generated. `work.ts` and `projects.ts` between them name over
 * thirty technologies, and a wall of thirty marks says nothing; this is the
 * shorter list of what is actually reached for on both sides of the résumé,
 * professional and personal. Each entry below is carried by at least one job or
 * project, and most by several:
 *
 *   TypeScript   Aegis Health, Helical, this site
 *   JavaScript   Itential (platform extensions)
 *   Python       Aegis Health, Itential, Helical's edge worker
 *   React        Aegis Health, and under both Next.js apps
 *   Next.js      Simple Trivia Game, Helical
 *   Tailwind     Simple Trivia Game, this site
 *   Node.js      Itential, and Nest.js on Simple Trivia Game
 *   Django       Aegis Health
 *   PostgreSQL   Simple Trivia Game, Helical
 *   Docker       Itential
 *   AWS          Aegis Health (API Gateway, Lambda)
 *   Git          everywhere
 *
 * Ordering is by kind — languages, then frontend, then backend, then data and
 * infrastructure — so the row reads as a stack rather than a bag.
 *
 * The full list of skills still lives in skills.ts and renders as text pills
 * further down the page; this is the at-a-glance version, and the two are meant
 * to be edited together when the longer list changes.
 */

/**
 * Which mark to draw. A plain name rather than a component or path, so this
 * module stays pure data — components/icons/StackIcon.astro owns the mapping,
 * the same split site.ts uses for its link icons.
 */
export type StackIconName =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'react'
  | 'nextjs'
  | 'tailwind'
  | 'nodejs'
  | 'django'
  | 'postgresql'
  | 'docker'
  | 'aws'
  | 'git';

export interface StackItem {
  /** Display name. Not rendered visibly — it is the mark's accessible name. */
  name: string;
  icon: StackIconName;
}

export const stack: StackItem[] = [
  { name: 'TypeScript', icon: 'typescript' },
  { name: 'JavaScript', icon: 'javascript' },
  { name: 'Python', icon: 'python' },
  { name: 'React', icon: 'react' },
  { name: 'Next.js', icon: 'nextjs' },
  { name: 'Tailwind CSS', icon: 'tailwind' },
  { name: 'Node.js', icon: 'nodejs' },
  { name: 'Django', icon: 'django' },
  { name: 'PostgreSQL', icon: 'postgresql' },
  { name: 'Docker', icon: 'docker' },
  { name: 'AWS', icon: 'aws' },
  { name: 'Git', icon: 'git' },
];

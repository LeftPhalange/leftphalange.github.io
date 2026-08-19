/**
 * Personal products and open-source contributions.
 *
 * Projects render as large alternating full-bleed panels; the open-source item
 * is a separate, deliberately compact credential row.
 */

export type ProjectStatus = 'shipped' | 'in-development';

export interface Project {
  /** Stable id, also used as the DOM id for deep links. */
  id: string;
  name: string;
  url: string;
  /** One-sentence positioning line, rendered large under the name. */
  tagline: string;
  /** Longer description of what was actually built. */
  body: string;
  stack: string[];
  /** Site-root path to an SVG mark, or null when none exists. */
  logo: string | null;
  status: ProjectStatus;
}

export const projects: Project[] = [
  {
    id: 'simple-trivia',
    name: 'Simple Trivia Game',
    url: 'https://simpletrivia.io',
    tagline:
      'Beautiful and engaging quizzing game with trivia questions marketplace, online multiplayer, and solo play.',
    body: 'Full-stack trivia platform with real-time WebSocket gameplay via Socket.IO, a Question Editor supporting custom and curated question sets, a moderated community Trivia Workshop, friend system, and guest play.',
    stack: ['Next.js', 'Nest.js', 'Tailwind', 'PostgreSQL', 'Socket.io'],
    logo: '/logos/simple_trivia.svg',
    status: 'shipped',
  },
  {
    id: 'helical',
    name: 'Helical',
    url: 'https://helical.video',
    tagline:
      'Online service that runs digital video through VHS tape and back into a deliverable that can be uploaded anywhere for any purpose.',
    body: 'An automated round-trip digital-to-VHS-to-digital service giving personal and commercial video projects an authentic analog look — a customer-facing web portal, a Python edge-worker pipeline for hardware playout and digitization, and an approval-based order flow with deliverable generation and payment capture.',
    stack: [
      'Next.js',
      'tRPC',
      'TypeScript',
      'Python',
      'ffmpeg',
      'PostgreSQL',
      'Prisma',
      'Cloudflare R2',
    ],
    logo: '/logos/helical.svg',
    status: 'in-development',
  },
];

export interface OpenSourceContribution {
  /** owner/name form, rendered as the headline. */
  repo: string;
  url: string;
  description: string;
}

export const openSource: OpenSourceContribution = {
  repo: 'microsoft/vscode',
  url: 'https://github.com/microsoft/vscode',
  description:
    'Merged PR adding the Open Active Diff Side command to the Command Palette.',
};

/**
 * Professional experience, reverse chronological.
 *
 * `logo` is nullable on purpose: when no mark exists, WorkEntry falls back to a
 * text monogram built from `monogram`. Do not point a missing logo at another
 * company's file — that bug is why the old data.json showed Itential's mark on
 * the Aegis card.
 */

export interface WorkEntry {
  /** Stable id, also used as the DOM id for deep links. */
  id: string;
  role: string;
  company: string;
  companyUrl: string;
  location: string;
  /** Display string, e.g. "September 2025 – July 2026". */
  dates: string;
  /** Machine-readable start for <time datetime>. */
  startDate: string;
  /** Machine-readable end for <time datetime>. */
  endDate: string;
  /** Site-root path to an SVG mark, or null when none exists. */
  logo: string | null;
  /** Initials rendered when `logo` is null. */
  monogram: string;
  bullets: string[];
  tech: string[];
}

export const work: WorkEntry[] = [
  {
    id: 'aegis-health-services',
    role: 'Full-Stack Software Engineer',
    company: 'Aegis Health Services',
    companyUrl: 'https://aegishealth.com',
    location: 'Atlanta, GA',
    dates: 'September 2025 – July 2026',
    startDate: '2025-09',
    endDate: '2026-07',
    logo: '/logos/aegis_health.svg',
    monogram: 'AH',
    bullets: [
      'Engineered features across a clinical case management platform serving a large network of partner labs across Pharmacogenomics, Pathology, and Infectious Disease review workflows using React, Django, and AWS (API Gateway, Lambda)',
      'Rearchitected the clinician compensation backend, cutting projected costs by 65% as case volume doubled; supported flat and time-tiered pay schemes and enabled Finance to self-serve rate changes via an admin panel',
      'Collaborated with the clinical director to engineer an AI-powered pharmacogenomics summarization pipeline using GPT, automating a clinically required workflow across a high volume of monthly reports and reducing manual reference review time per case',
      'Engineered a new case type enabling a recurring-consult product line, snapshotting patient clinical context (medications, prior recommendations) per encounter to preserve an immutable record of what the clinician saw at each review',
      'Built an internal partner/patient intake API on AWS (API Gateway, Lambda); owned a core status-tracking component managing state transitions as an immutable event log, and implemented an async, queue-based handoff between backend systems to trigger downstream storage of clinical findings summaries',
    ],
    tech: ['React', 'Django', 'AWS', 'Python', 'TypeScript'],
  },
  {
    id: 'itential',
    role: 'Network Automation Engineer',
    company: 'Itential',
    companyUrl: 'https://itential.com',
    location: 'Atlanta, GA',
    dates: 'August 2021 – September 2025',
    startDate: '2021-08',
    endDate: '2025-09',
    logo: '/logos/itential.svg',
    monogram: 'IT',
    bullets: [
      "Delivered network automation solutions on the Itential platform for Fortune 500 clients including Verizon, Johnson & Johnson, Lumen, Northern Trust, and British Telecom, developing custom JavaScript and Python extensions to address use cases beyond the platform's native capabilities",
      "Identified a 20-hour bottleneck in Verizon's 5G router config conversion utility (Nokia/Alcatel-Lucent/Cisco → Ciena) for ~10,000 devices; parallelized the workload across processes, cutting runtime to 2 hours",
      "Built an Itential-driven F5 load balancer upgrade automation for Northern Trust's 1,000+ appliance production fleet, implementing HA-aware orchestration (upgrade secondary, role-swap, upgrade primary), pre/post-check guardrails, SFTP-based firmware distribution, and ServiceNow change-management integration; gathered requirements directly with Northern Trust's network engineering team and F5 solutions architect",
    ],
    tech: ['JavaScript', 'Python', 'Node.js', 'Docker', 'Linux'],
  },
];

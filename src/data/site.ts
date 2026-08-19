/**
 * Site-wide identity and contact data.
 *
 * This module is the source of truth for the person behind the site. There is
 * no JSON file and no CMS — edit here and the static build picks it up.
 *
 * Privacy: a phone number is deliberately NOT stored or rendered anywhere.
 */

/**
 * Which mark a link is drawn with. A name rather than a component reference,
 * so this module stays pure data — components/icons/LinkIcon.astro owns the
 * name-to-component mapping.
 */
export type LinkIconName = 'linkedin' | 'github' | 'resume' | 'email';

export interface SiteLink {
  /** Human label, used as the visible text and the accessible name. */
  label: string;
  /** Absolute URL, site-root path, or mailto: URI. */
  href: string;
  /** True when the link leaves the site and needs target/rel handling. */
  external: boolean;
  /** Which mark to draw beside the label. */
  icon: LinkIconName;
}

export interface Site {
  name: string;
  location: string;
  /** Short availability line rendered in the hero chip. */
  availability: string;
  /** True while open to new roles — drives the accent dot in the hero. */
  available: boolean;
  email: string;
  links: {
    linkedin: SiteLink;
    github: SiteLink;
    resume: SiteLink;
    email: SiteLink;
  };
}

export const site: Site = {
  name: 'Ethan Bovard',
  location: 'Atlanta, GA',
  availability: 'Open to new opportunities',
  available: true,
  email: 'career@ethanbovard.com',
  links: {
    linkedin: {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/ethan-bovard',
      external: true,
      icon: 'linkedin',
    },
    github: {
      label: 'GitHub',
      href: 'https://github.com/LeftPhalange',
      external: true,
      icon: 'github',
    },
    resume: {
      label: 'Resume',
      href: '/Resume_Portfolio.pdf',
      external: true,
      icon: 'resume',
    },
    email: {
      label: 'Email',
      href: 'mailto:career@ethanbovard.com',
      external: false,
      icon: 'email',
    },
  },
};

/** Ordered list used by the hero and footer link rows. */
export const primaryLinks: SiteLink[] = [
  site.links.linkedin,
  site.links.github,
  site.links.resume,
  site.links.email,
];

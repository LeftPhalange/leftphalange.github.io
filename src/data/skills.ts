/** Skill groups and education. Rendered as labeled rows of text pills. */

export interface SkillGroup {
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    label: 'Languages',
    items: ['JavaScript', 'TypeScript', 'Python', 'C#'],
  },
  {
    label: 'Technologies',
    items: [
      'Git',
      'Docker',
      'Terraform',
      'VS Code',
      'GPT',
      'CI/CD',
      'Agile',
      'AWS',
    ],
  },
  {
    label: 'Backend',
    items: [
      'Django',
      'RabbitMQ',
      'Node.js',
      'MongoDB',
      'PostgreSQL',
      'FastAPI',
      'Redis',
    ],
  },
  {
    label: 'Frontend',
    items: ['React', 'Motion', 'Tailwind CSS', 'HTML', 'CSS', 'Vite'],
  },
];

export interface Education {
  institution: string;
  degree: string;
  dates: string;
  /** Machine-readable start/end for <time datetime>. */
  startDate: string;
  endDate: string;
  location: string;
}

export const education: Education = {
  institution: 'Georgia State University',
  degree: 'BSc Computer Science',
  dates: 'Aug 2016 – May 2021',
  startDate: '2016-08',
  endDate: '2021-05',
  location: 'Atlanta, GA',
};

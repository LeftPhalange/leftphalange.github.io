# ethanbovard.com

Source for my personal portfolio site, served at [ethanbovard.com](https://ethanbovard.com).

## Tech

- [Astro](https://astro.build) 7
- [Tailwind CSS](https://tailwindcss.com) v4
- [GSAP](https://gsap.com) for animation
- TypeScript
- Hosted on GitHub Pages, built and deployed by GitHub Actions

## Local development

```bash
npm install
npm run dev      # start the dev server
npm run build    # build to ./dist
npm run preview  # preview the production build locally
```

Requires Node 22.12 or newer.

## Content

Site content lives in typed modules under `src/data/` (`site.ts`, `work.ts`,
`projects.ts`, `skills.ts`). Edit those files to update copy, work history,
projects, and skills.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site
and publishes it to GitHub Pages. The workflow can also be run manually from the
Actions tab.

`public/CNAME` holds the custom domain and is copied verbatim into the build
output. **Do not delete it** — removing it will drop the custom domain on the
next deploy.

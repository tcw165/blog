# c@d3, and shar3

Technical notes by **TC Wang** (`tcw165`). This repository is now an [Astro](https://astro.build) static site. The previous Jekyll/GitHub Pages theme has been removed.

Live project Pages URL (after Actions deploy is enabled):

`https://tcw165.github.io/boyw165.github.io/`

## Local development

```bash
npm install
npm run dev
```

The GitHub Pages project base path is `/boyw165.github.io/`. Preview the production build the same way CI does:

```bash
npm run build
npm run preview
```

Then open `http://localhost:4321/boyw165.github.io/`.

## Content

- Posts live in `src/content/posts/{category}/` as an Astro Content Collection.
- Dates come from the original Jekyll filenames (`YYYY-MM-DD-slug.md`).
- Categories are unchanged: Algorithms, Android, Machine Learning, Probability.
- Images from `/images/` and leftover `jekyll-postfiles` assets under `_posts/probability/` are in `public/images/`.

## GitHub Pages

1. Merge this branch to `master`.
2. In the repository: **Settings → Pages**.
3. Set **Source** to **GitHub Actions** (not “Deploy from a branch”).
4. Confirm the `Deploy Astro site to GitHub Pages` workflow succeeds.
5. Visit `https://tcw165.github.io/boyw165.github.io/`.

The workflow builds every pull request (`npm ci`, `astro check`, `astro build`) and deploys only from `master`.

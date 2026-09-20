import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';

import { rehype_diagram_focus } from './src/plugins/rehype-diagram-focus.mjs';
import { remark_mermaid } from './src/plugins/remark-mermaid.mjs';
import { rewrite_image_paths } from './src/plugins/rewrite-image-paths.mjs';

// Repo is tcw165/blog, so GitHub project Pages is /blog/.
const site_base = '/blog/';

export default defineConfig({
  site: 'https://tcw165.github.io',
  base: site_base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [
      remark_mermaid,
      remarkMath,
      [rewrite_image_paths, { base: site_base }],
    ],
    rehypePlugins: [rehypeSlug, rehypeKatex, rehype_diagram_focus],
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
  },
});

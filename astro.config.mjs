import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';

import { rewrite_image_paths } from './src/plugins/rewrite-image-paths.mjs';

const site_base = '/boyw165.github.io/';

export default defineConfig({
  site: 'https://tcw165.github.io',
  base: site_base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkMath, [rewrite_image_paths, { base: site_base }]],
    rehypePlugins: [rehypeSlug, rehypeKatex],
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
  },
});

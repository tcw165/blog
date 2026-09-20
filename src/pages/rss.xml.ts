import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { get_posts, post_slug } from '../lib/posts';
import { site_config, with_base } from '../lib/site';

export async function GET(context: APIContext) {
  const posts = await get_posts();

  const site =
    context.site != null
      ? new URL(import.meta.env.BASE_URL, context.site).href
      : 'https://tcw165.github.io/blog/';

  return rss({
    title: site_config.title,
    description: site_config.description,
    site,
    items: posts.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.pubDate,
      description: entry.data.description ?? entry.data.categories.join(', '),
      categories: [...entry.data.categories, ...entry.data.tags],
      link: with_base(`posts/${post_slug(entry)}/`),
    })),
  });
}

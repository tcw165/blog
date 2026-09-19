import { getCollection, type CollectionEntry } from 'astro:content';

import { category_slug } from './site';

export type PostEntry = CollectionEntry<'posts'>;

export function post_slug(entry: PostEntry): string {
  const segments = entry.id.split('/');
  return segments[segments.length - 1] ?? entry.id;
}

export async function get_posts(): Promise<PostEntry[]> {
  const posts = await getCollection('posts');
  return posts.sort(
    (left, right) => right.data.pubDate.valueOf() - left.data.pubDate.valueOf(),
  );
}

export async function get_posts_by_category(
  slug: string,
): Promise<{ category: string; posts: PostEntry[] }> {
  const posts = await get_posts();
  const match = posts.filter((entry) =>
    entry.data.categories.some((category) => category_slug(category) === slug),
  );
  const category =
    match[0]?.data.categories.find((item) => category_slug(item) === slug) ??
    slug;
  return { category, posts: match };
}

export async function get_categories(): Promise<
  { name: string; slug: string; count: number }[]
> {
  const posts = await get_posts();
  const counts = new Map<string, { name: string; count: number }>();

  for (const entry of posts) {
    for (const name of entry.data.categories) {
      const slug = category_slug(name);
      const current = counts.get(slug);
      counts.set(slug, { name, count: (current?.count ?? 0) + 1 });
    }
  }

  return [...counts.entries()]
    .map(([slug, value]) => ({ slug, name: value.name, count: value.count }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function extract_headings(
  markdown: string,
): { depth: number; text: string; id: string }[] {
  const headings: { depth: number; text: string; id: string }[] = [];
  const lines = markdown.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const atx = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(lines[index] ?? '');
    if (atx) {
      const text = strip_inline_markup(atx[2] ?? '');
      headings.push({
        depth: atx[1]?.length ?? 2,
        text,
        id: slugify(text),
      });
      continue;
    }

    const next = lines[index + 1] ?? '';
    if (/^-+$/.test(next.trim()) && (lines[index] ?? '').trim()) {
      const text = strip_inline_markup((lines[index] ?? '').trim());
      headings.push({ depth: 2, text, id: slugify(text) });
    }
  }

  return headings;
}

function strip_inline_markup(value: string): string {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

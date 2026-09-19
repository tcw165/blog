export const site_config = {
  title: 'c@d3, and shar3',
  description:
    'A blog for sharing software infrastructure, algorithms, Machine Learning and fun technology.',
  author: 'TC Wang',
  github_username: 'tcw165',
  github_repo: 'boyw165.github.io',
  email: 'boyw165@gmail.com',
};

export function with_base(path: string = ''): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.replace(/^\//, '');
  if (!normalized) {
    return base;
  }
  return `${base}${normalized}`;
}

export function category_slug(category: string): string {
  return category.trim().toLowerCase().replace(/\s+/g, '-');
}

export function format_date(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

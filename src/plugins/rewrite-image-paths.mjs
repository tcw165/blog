import { visit } from 'unist-util-visit';

/**
 * Prefix root-relative image URLs with the GitHub Pages project base path.
 * Local `/images/...` paths would otherwise 404 on project Pages.
 */
export function rewrite_image_paths(options = {}) {
  const base = options.base ?? '/';
  const normalized_base = base.endsWith('/') ? base.slice(0, -1) : base;

  return (tree) => {
    visit(tree, 'image', (node) => {
      if (typeof node.url === 'string' && node.url.startsWith('/images/')) {
        node.url = `${normalized_base}${node.url}`;
      }
    });
  };
}

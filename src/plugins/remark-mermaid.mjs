import { visit } from 'unist-util-visit';

/**
 * Turn ```mermaid fences into <pre class="mermaid"> so Shiki does not
 * highlight them and the client renderer can replace the source with SVG.
 */
export function remark_mermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (parent == null || index == null || node.lang !== 'mermaid') {
        return;
      }

      parent.children[index] = {
        type: 'html',
        value: `<pre class="mermaid">${escape_html(node.value ?? '')}</pre>`,
      };
    });
  };
}

function escape_html(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

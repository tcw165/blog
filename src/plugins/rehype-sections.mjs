/**
 * Group each heading with the content that follows it, until the next
 * heading of the same or higher rank. Sections stay siblings so a heading
 * can be indented by its own level. Its body sits one step further in.
 */
export function rehype_sections() {
  return (tree) => {
    if (!tree || tree.type !== 'root' || !Array.isArray(tree.children)) {
      return;
    }
    tree.children = wrap_sections(tree.children);
  };
}

function wrap_sections(nodes) {
  const root = [];
  const stack = [];

  function append(node) {
    const parent = stack.at(-1);
    if (parent) parent.body.children.push(node);
    else root.push(node);
  }

  for (const node of nodes) {
    const rank = heading_rank(node);
    if (!rank) {
      append(node);
      continue;
    }

    while (stack.length > 0 && stack.at(-1).rank >= rank) {
      stack.pop();
    }

    const body = {
      type: 'element',
      tagName: 'div',
      properties: { className: ['section-body'] },
      children: [],
    };
    const section = {
      type: 'element',
      tagName: 'section',
      properties: { 'data-depth': String(rank) },
      children: [node, body],
    };
    root.push(section);
    stack.push({ rank, body });
  }

  return root;
}

function heading_rank(node) {
  if (!node || node.type !== 'element') return 0;
  const match = /^h([1-6])$/.exec(node.tagName ?? '');
  return match ? Number(match[1]) : 0;
}

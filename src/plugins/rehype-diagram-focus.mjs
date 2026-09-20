import { visit } from 'unist-util-visit';

/**
 * Wrap markdown images whose title starts with `focus:<preset>` in a
 * spotlight figure. Example:
 *
 *   ![alt](/images/diagram.png "focus:stream-queue")
 */
export const diagram_focus_presets = {
  'stream-queue': {
    left: 1.5,
    top: 21,
    width: 68,
    height: 39,
    origin_x: 35,
    origin_y: 39,
    scale: 1.3,
    label: 'Streaming & message queue',
    focused_caption:
      'Spotlight on the live path: client → gateway → queue → turn worker.',
    full_caption: 'Full platform map.',
  },
};

export function rehype_diagram_focus() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || typeof index !== 'number') {
        return;
      }

      const image = find_focus_image(node);
      if (!image) {
        return;
      }

      const title = String(image.properties?.title ?? '');
      const match = /^focus:([\w-]+)/.exec(title);
      if (!match) {
        return;
      }

      const preset_name = match[1] ?? '';
      const preset = diagram_focus_presets[preset_name];
      if (!preset) {
        return;
      }

      delete image.properties.title;
      parent.children[index] = wrap_focus_figure(image, preset_name, preset);
    });
  };
}

function find_focus_image(node) {
  if (node.tagName !== 'p' || !Array.isArray(node.children)) {
    return null;
  }

  const significant = node.children.filter((child) => {
    if (child.type === 'text') {
      return String(child.value ?? '').trim().length > 0;
    }
    return child.type === 'element';
  });

  if (significant.length !== 1) {
    return null;
  }

  const only = significant[0];
  return only?.type === 'element' && only.tagName === 'img' ? only : null;
}

function wrap_focus_figure(image, preset_name, preset) {
  const style = [
    `--focus-left: ${preset.left}%`,
    `--focus-top: ${preset.top}%`,
    `--focus-width: ${preset.width}%`,
    `--focus-height: ${preset.height}%`,
    `--focus-origin-x: ${preset.origin_x}%`,
    `--focus-origin-y: ${preset.origin_y}%`,
    `--focus-scale: ${preset.scale}`,
  ].join('; ');

  return {
    type: 'element',
    tagName: 'figure',
    properties: {
      className: ['diagram-focus', 'is-focused'],
      dataFocus: preset_name,
      style,
    },
    children: [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['diagram-focus-viewport'] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['diagram-focus-stage'] },
            children: [
              image,
              {
                type: 'element',
                tagName: 'div',
                properties: {
                  className: ['diagram-focus-spot'],
                  ariaHidden: 'true',
                },
                children: [],
              },
            ],
          },
        ],
      },
      {
        type: 'element',
        tagName: 'figcaption',
        properties: { className: ['diagram-focus-bar'] },
        children: [
          text_el('diagram-focus-caption', preset.focused_caption, {
            dataWhen: 'focused',
          }),
          text_el('diagram-focus-caption', preset.full_caption, {
            dataWhen: 'full',
          }),
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['diagram-focus-toolbar'],
              role: 'group',
              ariaLabel: 'Diagram focus',
            },
            children: [
              toggle_button('Focus path', 'on', true),
              toggle_button('Full map', 'off', false),
            ],
          },
        ],
      },
    ],
  };
}

function text_el(class_name, value, properties = {}) {
  return {
    type: 'element',
    tagName: 'p',
    properties: { className: [class_name], ...properties },
    children: [{ type: 'text', value }],
  };
}

function toggle_button(label, mode, pressed) {
  return {
    type: 'element',
    tagName: 'button',
    properties: {
      type: 'button',
      className: ['diagram-focus-toggle'],
      dataFocusMode: mode,
      ariaPressed: pressed ? 'true' : 'false',
    },
    children: [{ type: 'text', value: label }],
  };
}

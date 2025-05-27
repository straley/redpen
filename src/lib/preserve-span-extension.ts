import { Mark } from '@tiptap/core';

export const PreserveSpan = Mark.create({
  name: 'preserveSpan',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const span = node as HTMLElement;
          // Preserve spans with classes
          if (span.className) {
            return { class: span.className };
          }
          return {};
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          if (!attributes.class) {
            return {};
          }
          return {
            class: attributes.class,
          };
        },
      },
    };
  },
});
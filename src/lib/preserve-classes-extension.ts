import { Extension } from '@tiptap/core';

export const PreserveClasses = Extension.create({
  name: 'preserveClasses',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'orderedList'],
        attributes: {
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
        },
      },
    ];
  },
});
import { Mark } from '@tiptap/core';

export interface RedlineOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    redline: {
      setRedlineAddition: () => ReturnType;
      setRedlineDeletion: () => ReturnType;
      unsetRedline: () => ReturnType;
    };
  }
}

export const RedlineAddition = Mark.create<RedlineOptions>({
  name: 'redlineAddition',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'redline-addition',
        style: 'color: red; text-decoration: underline;',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.redline-addition',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...this.options.HTMLAttributes, ...HTMLAttributes }, 0];
  },

  addCommands() {
    return {
      setRedlineAddition: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      unsetRedline: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});

export const RedlineDeletion = Mark.create<RedlineOptions>({
  name: 'redlineDeletion',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'redline-deletion',
        style: 'color: red; text-decoration: line-through;',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.redline-deletion',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...this.options.HTMLAttributes, ...HTMLAttributes }, 0];
  },

  addCommands() {
    return {
      setRedlineDeletion: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      unsetRedline: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
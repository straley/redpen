import { Editor } from '@tiptap/core';

export interface Change {
  type: 'addition' | 'deletion' | 'replacement';
  text: string;
  position?: number;
  oldText?: string;
}

export function applyRedlineChanges(editor: Editor, changes: Change[]) {
  const transaction = editor.state.tr;
  
  // Sort changes by position in reverse order to avoid position shifting
  const sortedChanges = [...changes].sort((a, b) => (b.position || 0) - (a.position || 0));
  
  sortedChanges.forEach(change => {
    if (change.type === 'deletion' && change.position !== undefined && change.oldText) {
      // Find the text to delete and mark it with strikethrough
      const from = change.position;
      const to = from + change.oldText.length;
      transaction.addMark(from, to, editor.schema.marks.redlineDeletion.create());
    } else if (change.type === 'addition' && change.position !== undefined) {
      // Insert new text with addition mark
      transaction.insertText(change.text, change.position);
      const from = change.position;
      const to = from + change.text.length;
      transaction.addMark(from, to, editor.schema.marks.redlineAddition.create());
    } else if (change.type === 'replacement' && change.position !== undefined && change.oldText) {
      // Mark old text as deletion
      const from = change.position;
      const to = from + change.oldText.length;
      transaction.addMark(from, to, editor.schema.marks.redlineDeletion.create());
      
      // Insert new text with addition mark
      transaction.insertText(change.text, to);
      transaction.addMark(to, to + change.text.length, editor.schema.marks.redlineAddition.create());
    }
  });
  
  editor.view.dispatch(transaction);
}

export function acceptAllChanges(editor: Editor) {
  const { doc, schema } = editor.state;
  const transaction = editor.state.tr;
  
  // Remove all deletion marks and their content
  doc.descendants((node, pos) => {
    if (node.isText) {
      node.marks.forEach(mark => {
        if (mark.type === schema.marks.redlineDeletion) {
          transaction.delete(pos, pos + node.nodeSize);
        }
      });
    }
  });
  
  // Remove addition marks but keep the content
  doc.descendants((node, pos) => {
    if (node.isText) {
      node.marks.forEach(mark => {
        if (mark.type === schema.marks.redlineAddition) {
          transaction.removeMark(pos, pos + node.nodeSize, mark.type);
        }
      });
    }
  });
  
  editor.view.dispatch(transaction);
}

export function rejectAllChanges(editor: Editor) {
  const { doc, schema } = editor.state;
  const transaction = editor.state.tr;
  
  // Remove all addition marks and their content
  doc.descendants((node, pos) => {
    if (node.isText) {
      node.marks.forEach(mark => {
        if (mark.type === schema.marks.redlineAddition) {
          transaction.delete(pos, pos + node.nodeSize);
        }
      });
    }
  });
  
  // Remove deletion marks but keep the content
  doc.descendants((node, pos) => {
    if (node.isText) {
      node.marks.forEach(mark => {
        if (mark.type === schema.marks.redlineDeletion) {
          transaction.removeMark(pos, pos + node.nodeSize, mark.type);
        }
      });
    }
  });
  
  editor.view.dispatch(transaction);
}
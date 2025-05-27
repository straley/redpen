'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import OrderedList from '@tiptap/extension-ordered-list';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { RedlineAddition, RedlineDeletion } from '@/lib/redline-extension';
import { PreserveClasses } from '@/lib/preserve-classes-extension';
import { PreserveSpan } from '@/lib/preserve-span-extension';
import { useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code
} from 'lucide-react';

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

export default function Editor({ content, onContentChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
        paragraph: {
          HTMLAttributes: {
            class: null, // Don't override classes
          },
        },
        hardBreak: {
          keepMarks: true,
        },
        orderedList: false, // Disable to use custom config
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: null,
        },
        keepMarks: true,
        keepAttributes: true,
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            type: {
              default: '1',
              parseHTML: element => element.getAttribute('type') || '1',
              renderHTML: attributes => {
                if (!attributes.type) {
                  return {};
                }
                return {
                  type: attributes.type,
                };
              },
            },
            start: {
              default: 1,
              parseHTML: element => {
                const start = element.getAttribute('start');
                return start ? parseInt(start, 10) : 1;
              },
              renderHTML: attributes => {
                if (attributes.start && attributes.start !== 1) {
                  return {
                    start: attributes.start,
                  };
                }
                return {};
              },
            },
          };
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      RedlineAddition,
      RedlineDeletion,
      PreserveClasses,
      PreserveSpan,
    ],
    content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-full max-w-none p-8 text-gray-800 preserve-formatting',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      console.log('=== EDITOR CONTENT UPDATE ===');
      console.log('1. Incoming content:');
      console.log(content);
      console.log('2. Current editor HTML:');
      console.log(editor.getHTML());
      console.log('3. Content length:', content.length);
      console.log('4. Setting new content...');
      
      editor.commands.setContent(content, false, {
        preserveWhitespace: true,
      });
      
      console.log('5. Editor HTML after setContent:');
      console.log(editor.getHTML());
      
      // Debug: Check if type attributes are preserved
      const editorDom = new DOMParser().parseFromString(editor.getHTML(), 'text/html');
      const typedLists = editorDom.querySelectorAll('ol[type]');
      console.log(`6. Lists with type attribute: ${typedLists.length}`);
      typedLists.forEach((ol, i) => {
        console.log(`   List ${i}: type="${ol.getAttribute('type')}"`);
      });
      
      console.log('=== END EDITOR UPDATE ===');
    }
  }, [content, editor]);

  useEffect(() => {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    const handleUndo = () => editor?.chain().focus().undo().run();
    const handleRedo = () => editor?.chain().focus().redo().run();

    undoBtn?.addEventListener('click', handleUndo);
    redoBtn?.addEventListener('click', handleRedo);

    return () => {
      undoBtn?.removeEventListener('click', handleUndo);
      redoBtn?.removeEventListener('click', handleRedo);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-200 transition-colors ${
        isActive ? 'bg-gray-300 text-gray-900' : 'text-gray-700'
      } hover:text-gray-900`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="border-b border-gray-300 p-2 flex items-center gap-1 flex-wrap bg-gray-100">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-400 mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-400 mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-300 px-4 py-1 text-xs text-gray-700 bg-gray-100">
        <span>Word count: {editor.storage.characterCount?.words() || 0}</span>
        <span className="mx-2">|</span>
        <span>Characters: {editor.storage.characterCount?.characters() || 0}</span>
      </div>
    </div>
  );
}
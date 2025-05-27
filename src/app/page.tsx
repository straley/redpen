'use client';

import { useState } from 'react';
import { FolderOpen, FilePlus, Undo2, Redo2, FileDown } from 'lucide-react';
import Editor from '@/components/Editor';
import ChatPane from '@/components/ChatPane';
import { processDocxFile, saveAsDocx } from '@/lib/docx-handler';

export default function Home() {
  const [documentContent, setDocumentContent] = useState('<p>Start typing or load a document...</p>');
  const [fileName, setFileName] = useState('Untitled Document');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleNewDocument = () => {
    if (hasUnsavedChanges && !confirm('You have unsaved changes. Create a new document anyway?')) {
      return;
    }
    setDocumentContent('<p></p>');
    setFileName('Untitled Document');
    setHasUnsavedChanges(false);
  };

  const handleLoadDocument = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const content = await processDocxFile(file);
          setDocumentContent(content);
          setFileName(file.name.replace('.docx', ''));
          setHasUnsavedChanges(false);
        } catch (error) {
          alert('Error loading document: ' + error);
        }
      }
    };
    
    input.click();
  };

  const handleSaveAsDocument = async () => {
    const newName = prompt('Save as:', fileName);
    if (newName) {
      setFileName(newName);
      try {
        await saveAsDocx(documentContent, newName + '.docx');
        setHasUnsavedChanges(false);
      } catch (error) {
        alert('Error saving document: ' + error);
      }
    }
  };

  const handleContentChange = (content: string) => {
    setDocumentContent(content);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewDocument}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700 hover:text-gray-900"
            title="New Document"
          >
            <FilePlus className="w-5 h-5" />
          </button>
          <button
            onClick={handleLoadDocument}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700 hover:text-gray-900"
            title="Open Document"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          <button
            onClick={handleSaveAsDocument}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700 hover:text-gray-900"
            title="Save As"
          >
            <FileDown className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-400 mx-2" />
          <button
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700 hover:text-gray-900"
            title="Undo"
            id="undo-btn"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700 hover:text-gray-900"
            title="Redo"
            id="redo-btn"
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-gray-800">
              {fileName}
              {hasUnsavedChanges && <span className="text-gray-700 ml-1">•</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Pane */}
        <div className="flex-1 flex flex-col bg-white">
          <Editor 
            content={documentContent} 
            onContentChange={handleContentChange}
          />
        </div>

        {/* Chat Pane */}
        <div className="w-96 border-l border-gray-300">
          <ChatPane 
            documentContent={documentContent}
            onApplyChanges={(newContent) => {
              setDocumentContent(newContent);
              setHasUnsavedChanges(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}
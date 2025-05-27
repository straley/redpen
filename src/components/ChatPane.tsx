'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPaneProps {
  documentContent: string;
  onApplyChanges: (newContent: string) => void;
}

export default function ChatPane({ documentContent, onApplyChanges }: ChatPaneProps) {
  // These will be used when integrating with the AI API
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send request to API with extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 295000); // 295 seconds timeout
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          documentContent: documentContent,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Check if the response contains updatedHtml
      let responseContent = data.message;
      
      // Function to extract and parse JSON with updatedHtml
      const extractUpdatedHtml = (text: string): { html: string | null, explanation: string } => {
        // First check if the entire response is just JSON (with possible whitespace)
        const trimmedText = text.trim();
        if (trimmedText.startsWith('{') && trimmedText.includes('"updatedHtml"')) {
          try {
            const parsed = JSON.parse(trimmedText);
            if (parsed.updatedHtml) {
              // Remove any wrapping <document> tags if present
              let html = parsed.updatedHtml;
              if (html.startsWith('<document>') && html.endsWith('</document>')) {
                html = html.substring(10, html.length - 11).trim();
              }
              return { html, explanation: '' };
            }
          } catch (e) {
            console.error('Failed to parse full JSON response:', e);
          }
        }
        
        // First, strip out any markdown code blocks
        let cleanedText = text;
        const codeBlockMatch = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          // Extract content from within the code block
          cleanedText = codeBlockMatch[1].trim();
          // Also preserve any text before and after the code block
          const beforeBlock = text.substring(0, text.indexOf(codeBlockMatch[0])).trim();
          const afterBlock = text.substring(text.indexOf(codeBlockMatch[0]) + codeBlockMatch[0].length).trim();
          
          // Try to parse the code block content as JSON first
          if (cleanedText.includes('"updatedHtml"')) {
            const jsonMatch = cleanedText.match(/\{[\s\S]*"updatedHtml"[\s\S]*\}/);
            if (jsonMatch) {
              let jsonStr = jsonMatch[0];
              
              // Clean up common JSON issues
              // Replace actual newlines within string values with \n
              jsonStr = jsonStr.replace(/("(?:[^"\\]|\\.)*")/g, (match) => {
                return match
                  .replace(/\r\n/g, '\\n')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\n')
                  .replace(/\t/g, '\\t');
              });
              
              const beforeJson = beforeBlock;
              const afterJson = afterBlock;
              
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.updatedHtml) {
                  // Remove any wrapping <document> tags if present
                  let html = parsed.updatedHtml;
                  if (html.startsWith('<document>') && html.endsWith('</document>')) {
                    html = html.substring(10, html.length - 11).trim();
                  }
                  
                  // Combine any explanation text
                  let explanation = '';
                  if (beforeJson) explanation += beforeJson;
                  if (afterJson) explanation += (explanation ? '\n\n' : '') + afterJson;

                  explanation = explanation.trim().replaceAll(/\bHTML\b/g, "document") // a hack... fix this with better prompting
                  
                  return { html, explanation };
                }
              } catch (parseError) {
                console.error('JSON parse error in code block:', parseError);
              }
            }
          }
        }
        
        // Look for JSON with updatedHtml anywhere in the response (original logic)
        const jsonMatch = cleanedText.match(/\{[\s\S]*"updatedHtml"[\s\S]*\}/);
        if (!jsonMatch) {
          return { html: null, explanation: text };
        }
        
        let jsonStr = jsonMatch[0];
        
        // Clean up common JSON issues
        // Replace actual newlines within string values with \n
        jsonStr = jsonStr.replace(/("(?:[^"\\]|\\.)*")/g, (match) => {
          return match
            .replace(/\r\n/g, '\\n')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\n')
            .replace(/\t/g, '\\t');
        });
        
        const beforeJson = cleanedText.substring(0, cleanedText.indexOf(jsonMatch[0])).trim();
        const afterJson = cleanedText.substring(cleanedText.indexOf(jsonMatch[0]) + jsonMatch[0].length).trim();
        
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.updatedHtml) {
            // Remove any wrapping <document> tags if present
            let html = parsed.updatedHtml;
            if (html.startsWith('<document>') && html.endsWith('</document>')) {
              html = html.substring(10, html.length - 11).trim();
            }
            
            // Combine any explanation text
            let explanation = '';
            if (beforeJson) explanation += beforeJson;
            if (afterJson) explanation += (explanation ? '\n\n' : '') + afterJson;

            explanation = explanation.trim();
            
            return { html, explanation };
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Attempted to parse:', jsonStr.substring(0, 200) + '...');
        }
        
        return { html: null, explanation: text };
      };
      
      try {
        const { html, explanation } = extractUpdatedHtml(responseContent);

        const responseMessage = explanation
          .replaceAll(/^[\n\r\s]*/g, '')
          .replaceAll(/[\n\r\s]*$/g, '')
          .trim() || "I've made your changes.";

        if (html) {
          // Apply the changes to the document
          onApplyChanges(html);
          
          // Show explanation or default message
          responseContent = responseMessage;
          
          
        }
      } catch (e) {
        console.error('Failed to process updatedHtml:', e);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorContent = 'Sorry, I encountered an error while processing your request.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorContent = 'The request timed out. This might happen with very long documents. Try asking a simpler question or breaking down your request into smaller parts.';
        } else if (error.message?.includes('timeout')) {
          errorContent = 'The request took too long to process. Try a simpler question or work with a smaller section of the document.';
        }
      }
      
      if (!navigator.onLine) {
        errorContent = 'It looks like you\'re offline. Please check your internet connection and try again.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-300 p-4 shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
          <Bot className="w-5 h-5" />
          RedPen
        </h2>
        <p className="text-sm text-gray-700 mt-1">
          Describe any changes ask questions about the document.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">Ask me anything about the document</p>
            <p className="text-xs text-gray-500 mt-2">
              I can explain terms, suggest edits, or answer questions
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 shadow-sm text-gray-800'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="text-sm text-gray-800 prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-600'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-300 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe the changes you'd like to make..."
            className="flex-1 px-3 py-2 border border-gray-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-600"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
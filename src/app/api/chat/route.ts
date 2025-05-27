import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
  timeout: 600000, // 10 minutes timeout
  maxRetries: 3, // Retry failed requests up to 3 times
});

// Increase Next.js route timeout
export const maxDuration = 300; // 5 minutes in seconds

export async function POST(request: NextRequest) {
  try {
    const { messages, documentContent } = await request.json();

    // Prepare the system message with document content
    const systemMessage = `You are a document analyser and editor. Here is the document:

<document>
${documentContent}
</document>

Answer any questions the user has, strictly based on this document.
If the user requests a change, provide a complete new copy of the HTML within a JSON object, like:
\`\`\`json
{"updatedHtml": "<p>your update...</p>"}
\`\`\`

- Please refer to the document you're working on as "the document" or "your document".
- Please provide a brief explanation of what you changed.
`;

    // Convert messages to OpenAI format
    const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMessage },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: openAIMessages,
        temperature: 0.6,
        max_tokens: 16384,
        top_p: 0.95,
        stream: true
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
        }
      }

      return NextResponse.json({
        message: fullResponse
      });
    } catch (apiError) {
      // Log detailed error information
      const error = apiError as Error & { status?: number; headers?: unknown; requestID?: string };
      console.error('OpenAI API error details:', {
        message: error.message,
        status: error.status,
        headers: error.headers,
        requestID: error.requestID,
      });
      
      // Return a user-friendly error message
      if (error.message?.includes('timeout') || error.message?.includes('closed')) {
        return NextResponse.json(
          { error: 'The request took too long. Try asking a simpler question or working with a smaller document section.' },
          { status: 504 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
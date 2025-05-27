# RedPen - AI-Powered Document Editor

RedPen is an intelligent document editing application that combines the power of AI with advanced document processing to help you review, edit, and enhance your documents with ease.

## Features

- **DOCX Document Support**: Load and save Microsoft Word documents while preserving formatting including:
  - Text styling (bold, italic, underline)
  - Headings and paragraph formatting
  - Lists with proper numbering (decimal, uppercase letters, etc.)
  - Centered text and small caps
  - Tables and complex document structures

- **AI-Powered Assistance**: Chat with an AI assistant that can:
  - Analyze your document content
  - Suggest improvements and edits
  - Answer questions about the document
  - Make direct edits to the document based on your instructions

- **Rich Text Editor**: Built on TipTap for a seamless editing experience with full formatting support

- **Redlining Support**: Track changes with additions shown as underlined in red and deletions shown as strikethrough in red

## Prerequisites

Before running RedPen, you need to set up your environment:

### OpenAI API Key

1. Create a `.env` file in the root directory of the project
2. Add your OpenAI API key to the file:
   ```
   OPEN_AI_KEY=your-openai-api-key-here
   ```
3. To obtain an OpenAI API key:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Sign up or log in to your account
   - Navigate to API keys section
   - Create a new API key
   - Copy the key and paste it in your `.env` file

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore` for your protection.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## How to Use RedPen

1. **Starting a New Document**: 
   - Click "New Document" to start with a blank document
   - Begin typing in the editor with full formatting options

2. **Loading a Document**:
   - Click "Load Document" to upload a DOCX file
   - The document will be converted and displayed with all formatting preserved

3. **Using the AI Assistant**:
   - Type your request in the chat panel on the right
   - Examples of what you can ask:
     - "Make this document more formal"
     - "Add a confidentiality clause to section 3"
     - "What does paragraph 2 mean?"
     - "Change all instances of 'Company' to 'Corporation'"
   - The AI will either explain or make direct edits to your document

4. **Saving Your Work**:
   - Click "Save" to download the current document
   - Use "Save As..." to save with a different filename
   - Documents are saved in DOCX format with formatting preserved

## Technical Architecture

RedPen is built with:
- **Next.js 15**: React framework for the application
- **TipTap**: Extensible rich text editor
- **Mammoth.js**: DOCX to HTML conversion
- **OpenAI GPT-4**: AI-powered document analysis and editing
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Styling and UI components

## Development

This project uses TypeScript for type safety and includes ESLint for code quality.

To run linting:
```bash
npm run lint
```

To build for production:
```bash
npm run build
```

## Troubleshooting

- **AI responses appearing as JSON**: The app automatically parses AI responses. If you see raw JSON, refresh the page.
- **Formatting issues**: Ensure your DOCX file uses standard Word formatting. Complex custom styles may not be fully supported.
- **API errors**: Check that your OpenAI API key is valid and has sufficient credits.

## License

This is a proof-of-concept application for demonstration purposes.

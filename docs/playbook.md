# RedPen

## Major Steps

### Create NextJS Repo

Use `npx` to create a NextJS app foundation with standard options.

```
scottstraley@scott-tuxedo-2024:~/Development/YellowPad.ai/coding-exercise$ npx create-next-app redpen
Need to install the following packages:
create-next-app@15.3.2
Ok to proceed? (y) y

✔ Would you like to use TypeScript? … No / Yes
✔ Would you like to use ESLint? … No / Yes
✔ Would you like to use Tailwind CSS? … No / Yes
✔ Would you like your code inside a `src/` directory? … No / Yes
✔ Would you like to use App Router? (recommended) … No / Yes
✔ Would you like to use Turbopack for `next dev`? … No / Yes
✔ Would you like to customize the import alias (`@/*` by default)? … No / Yes
Creating a new Next.js app in /home/scottstraley/Development/YellowPad.ai/coding-exercise/redpen.

Using npm.

Initializing project with template: app-tw 


Installing dependencies:
- react
- react-dom
- next

Installing devDependencies:
- typescript
- @types/node
- @types/react
- @types/react-dom
- @tailwindcss/postcss
- tailwindcss
- eslint
- eslint-config-next
- @eslint/eslintrc


added 398 packages, and audited 399 packages in 15s

162 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
Initialized a git repository.

Success! Created redpen at /home/scottstraley/Development/YellowPad.ai/coding-exercise/redpen
```

### Initial Claude Code Prompt

```
> create the scaffolding a proof-of-concept interface for a 
  nextjs application called "RedLine" based on a default npx 
  install of nextjs already installed (see @package.json , 
  @README.md ). The application works with docx documents 
  and allows the user to use AI to ask for changes to the 
  document.  It will then make suggested changes and 
  "redline" them -- crossing out the deleted text in red 
  and adding the new text in red.  The application will 
  have a toolbar that allows a user to create a new 
  document, load an existing document, save the document, 
  save the document as a new file, undo, and redo.  There 
  will be a main document pane (driven by TipTap) that 
  contains the Richtext document with a standard document 
  toolbar and status bar.  On the right will be a chat pane
   which will talk with Nebius API's DeepSeek R1 to handle 
  the updates.  When a docx document is loaded, use 
  docxtemplater for importing into the application.
```

## AI Tools

### Default Visual Studio Code Copilot

Use built-in Copilot for autocomplete.

### Setup Claude Code For Project

In Terminal pane, type:

```
claude

╭──────────────────────────────────────────────────────────────╮
│                                                              │
│ Do you trust the files in this folder?                       │
│                                                              │
│ /home/scottstraley/Development/YellowPad.ai/coding-exercise/ │
│ redpen                                                       │
│                                                              │
│ Claude Code may read files in this folder. Reading untrusted │
│  files may lead Claude Code to behave in an unexpected ways. │
│                                                              │
│ With your permission Claude Code may execute files in this   │
│ folder. Executing untrusted code is unsafe.                  │
│                                                              │
│ https://docs.anthropic.com/s/claude-code-security            │
│                                                              │
│ ❯ 1. Yes, proceed                                            │
│   2. No, exit                                                │
│                                                              │
╰──────────────────────────────────────────────────────────────╯
   Enter to confirm · Esc to exit
 ✻ Welcome to Claude Code!

   /help for help, /status for your current setup

   cwd: /home/scottstraley/Development/YellowPad.ai/coding-exercise/redpen

 Tips for getting started:

 1. Run /init to create a CLAUDE.md file with instructions for Claude
 2. Run /terminal-setup to set up terminal integration
 3. Use Claude to help with file analysis, editing, bash commands and git
 4. Be as specific as you would with another engineer for the best results

 ※ Tip: Hit Enter to queue up additional messages while Claude is working.
```

## Timeline

- 8:30 AM - initialized NextJS application
- 8:37 AM - ran initial Claude Code prompt to complete scaffolding, reviewed changes, tested
- 8:56 AM - Claude Code completed, began revising code
- 9:06 AM - switched to mammoth and PizZip for documents. docxtemplater would lose formating on import.
- 9:10 AM - resolving difficulties with newlines and paragraphs
- 9:15 AM - working on tabs, indents, numbered lists, bulleting
- 10:00 AM - formatting working 80% of where I'd like it, but switching to AI interface

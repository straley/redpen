import mammoth, { TransformElement } from 'mammoth';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

export async function processDocxFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    
    
    // First, let's examine the raw DOCX structure
    // try {
    //   const zip = new PizZip(arrayBuffer);
    // } catch (err) {
    //   console.error(err)
    // }
    
    // Use mammoth to convert DOCX to HTML with formatting preserved
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: [
          // Preserve paragraph styles
          "p[style-name='Normal'] => p",
          "p[style-name='Body Text'] => p",
          "p[style-name='Plain Text'] => p",
          
          // Centered paragraphs (for titles) - multiple possible style names
          "p[style-name='Title'] => p.text-center > strong",
          "p[style-name='Centered'] => p.text-center",
          "p[style-name='Center'] => p.text-center",
          "p[style-id='centered-paragraph'] => p.text-center",
          
          // Headings
          "p[style-name='Heading 1'] => h1",
          "p[style-name='Heading 2'] => h2", 
          "p[style-name='Heading 3'] => h3",
          "p[style-name='Heading 4'] => h4",
          "p[style-name='Heading 5'] => h5",
          "p[style-name='Heading 6'] => h6",
          
          // Lists - preserve as lists, not paragraphs
          "p[style-name='List Paragraph'] => li",
          "p[style-name='List Number'] => li",
          "p[style-name='List Bullet'] => li",
          "p[style-name='List Number 2'] => li",
          "p[style-name='List Number 3'] => li",
          
          // Other styles
          "p[style-name='Quote'] => blockquote > p",
          "p[style-name='Code'] => pre",
          
          // Text formatting
          "b => strong",
          "i => em", 
          "u => u",
          "strike => s",
          "br => br",
          
          // Run styles
          "r[style-id='small-caps'] => span.small-caps"
        ],
        
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.read("base64");
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`
          };
        }),
        
        // Transform function to handle special cases
        transformDocument: transformDocument
      }
    );
    
    // if (result.messages.length > 0) {
    //   console.warn('Conversion messages:', result.messages);
    // }
    
    let html = result.value;
    
    
    
    
    
    // Post-process to handle any remaining issues
    html = postProcessHtml(html);
    
    return html;
  } catch (error) {
    console.error('Error processing DOCX file:', error);
    throw new Error('Failed to process document: ' + error);
  }
}

function transformDocument(element: TransformElement): TransformElement {
  // More detailed logging
  if (element.type === 'paragraph') {
    
    
    
    // Check all possible alignment properties
    const alignment = element.alignment || element.justification || element.align;
    if (alignment) {
      
    }
    
    // Check for centered text
    if (alignment === 'center' || alignment === 'centered') {
      
      return {
        ...element,
        styleId: 'centered-paragraph',
        styleName: 'Centered'
      };
    }
  }
  
  // Check for runs (text segments)
  if (element.type === 'run') {
    
    // Check various forms of caps
    if (element.smallCaps || element.caps || element.allCaps) {
      
      return {
        ...element,
        styleId: 'small-caps'
      };
    }
  }
  
  return element;
}

function postProcessHtml(html: string): string {
  
  
  // Fix common issues
  let processed = html;
  
  // Handle empty paragraphs
  processed = processed.replace(/<p>\s*<\/p>/g, '<p><br></p>');
  
  // Look for patterns that need special handling
  // Check if we still have the single paragraph problem
  const paragraphs = processed.match(/<p[^>]*>[\s\S]*?<\/p>/g) || [];
  
  if (paragraphs.length === 1 && processed.length > 1000) {
    
    processed = handleSingleParagraphDocument(processed);
  }
  
  // Apply special formatting classes
  processed = applyFormattingClasses(processed);
  
  // Process lists to detect and apply proper numbering types
  processed = processListNumberingTypes(processed);
  
  
  return processed;
}

function handleSingleParagraphDocument(html: string): string {
  
  
  // Extract content
  const match = html.match(/<p[^>]*>([\s\S]*)<\/p>/);
  if (!match || !match[1]) return html;
  
  let content = match[1];
  
  // Look for title pattern at start
  if (content.startsWith('<strong>')) {
    // Find company name and agreement title
    const titleMatch = content.match(/^<strong>([^<]+?)(Subscription[^<]+Agreement[^<]*)<\/strong>/);
    if (titleMatch) {
      const company = titleMatch[1].trim();
      const agreement = titleMatch[2].trim();
      content = content.replace(
        /^<strong>[^<]+<\/strong>/,
        `</p><p class="text-center"><strong>${company}</strong></p><p class="text-center"><strong>${agreement}</strong></p><p class="indent">`
      );
    }
  }
  
  // Look for small caps sections - more aggressive detection
  content = content.replace(
    /\b([A-Z][A-Z\s,.:;()"\-\d]+[.?!])/g,
    function(match) {
      // Check if this is likely small caps (mostly uppercase text)
      const words = match.split(/\s+/);
      const uppercaseWords = words.filter(w => w.length > 2 && w === w.toUpperCase());
      const ratio = uppercaseWords.length / words.length;
      
      // If more than 60% of words are uppercase, it's likely small caps
      if (ratio > 0.6 && words.length > 5) {
        
        return `<span class="small-caps">${match}</span>`;
      }
      return match;
    }
  );
  
  // Handle numbered lists with format "1. Title."
  content = content.replace(
    /([.:;])\s+(\d+)\.\s+([A-Z][^.]+\.)\s*/g,
    '$1</p><h3>$2. $3</h3><p>'
  );
  
  // Handle lettered sublists "A. 'Term' means"
  content = content.replace(
    /([.])\s+([A-Z])\.\s+"<strong>([^<]+)<\/strong>"\s*means/g,
    function(match, before, letter, term) {
      const startValue = letter.charCodeAt(0) - 64; // A=1, B=2, etc.
      return `${before}</p><ol type="A" start="${startValue}"><li><strong>"${term}"</strong> means`;
    }
  );
  
  // Close lists when we hit a new section
  content = content.replace(
    /<\/li>\s*<\/p>\s*<h3>/g,
    '</li></ol></p><h3>'
  );
  
  // Split on sentence boundaries for paragraphs
  content = content.replace(/\.(\s+)([A-Z])/g, function(match, space, letter, offset) {
    const before = content.substring(Math.max(0, offset - 10), offset);
    // Don't split abbreviations or list items
    if (before.match(/\b(Mr|Mrs|Ms|Dr|Inc|Ltd|Corp|Co|vs|etc|e\.g|i\.e)$/) ||
        before.match(/<li>$/) ||
        before.match(/<strong>$/)) {
      return match;
    }
    return '.</p><p>' + letter;
  });
  
  return '<p>' + content + '</p>';
}

function applyFormattingClasses(html: string): string {
  
  
  // Process the HTML to detect patterns
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs = doc.querySelectorAll('p');
  
  // Check first few paragraphs for title-like content
  paragraphs.forEach((p, index) => {
    const text = p.textContent || '';
    const hasOnlyStrong = p.innerHTML.match(/^<strong>[^<]+<\/strong>$/);
    
    // First two paragraphs that are short and bold are likely titles
    if (index < 2 && hasOnlyStrong && text.length < 100) {
      p.classList.add('text-center');
    }
    
    // Check for company/agreement pattern
    if (text.includes('ABCCorp') || text.includes('Agreement')) {
      if (hasOnlyStrong) {
        
        p.classList.add('text-center');
      }
    }
    
    // Check for indentation patterns
    if (text.startsWith('This Subscription') || text.startsWith('The parties')) {
      p.classList.add('indent');
    }
    
    // Check for small caps pattern
    // The "By accepting..." paragraph is typically small caps
    if (text.startsWith('By accepting') || 
        (text === text.toUpperCase() && text.length > 100 && index < 10)) {
      const span = doc.createElement('span');
      span.className = 'small-caps';
      span.innerHTML = p.innerHTML;
      p.innerHTML = '';
      p.appendChild(span);
    }
  });
  
  // Convert back to HTML string
  html = doc.body.innerHTML;
  
  // Additional pattern-based replacements
  html = html.replace(/<span class="small-caps">([^<]+)<\/span>/g, function(match, text) {
    return `<span class="small-caps">${text.toLowerCase()}</span>`;
  });
  
  // Ensure lists have proper structure
  html = html.replace(/(<ol[^>]*>)\s*<p>/g, '$1<li>');
  html = html.replace(/<\/p>\s*(<\/ol>)/g, '</li>$1');
  
  
  return html;
}

function processListNumberingTypes(html: string): string {
  
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Process all ordered lists based on their nesting level
  const processListHierarchy = (element: Element, level: number = 0) => {
    // Process direct child lists
    element.querySelectorAll(':scope > li').forEach((li) => {
      // Find direct child ol elements within this li
      const childLists = li.querySelectorAll(':scope > ol');
      childLists.forEach((childList) => {
        // Apply type based on nesting level
        if (level === 0) {
          // First level nested list should use uppercase letters
          childList.setAttribute('type', 'A');
          childList.classList.add('uppercase-alpha-list');
          
          
        } else if (level === 1) {
          // Second level nested list should use parentheses numbering
          childList.classList.add('parentheses-numbering');
          
        }
        // Recursively process deeper levels
        processListHierarchy(childList, level + 1);
      });
    });
  };
  
  // Find all top-level ordered lists
  const topLevelLists = doc.querySelectorAll('body > ol, p > ol, div > ol, td > ol');
  
  topLevelLists.forEach((ol) => {
    processListHierarchy(ol, 0);
  });
  
  // Also look for inline parentheses patterns in text that might need special handling
  const processInlineNumbering = () => {
    doc.querySelectorAll('p, li').forEach(elem => {
      if (elem.innerHTML.includes('(1)') || elem.innerHTML.includes('(2)')) {
        // Check if this is within a list context
        const parentLi = elem.closest('li');
        if (parentLi && elem.innerHTML.match(/\(\d+\)[^<]*\(\d+\)/)) {
          // Multiple inline numbers - might need to be converted to a list
          
        }
      }
    });
  };
  
  processInlineNumbering();
  
  // Convert back to HTML string
  html = doc.body.innerHTML;
  
  
  return html;
}

export async function saveAsDocx(htmlContent: string, fileName: string): Promise<void> {
  try {
    // Create a more comprehensive DOCX file
    const zip = new PizZip();
    
    // Add required DOCX structure
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);
    
    zip.folder('_rels')?.file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
    
    // Add styles.xml for formatting
    zip.folder('word')?.file('styles.xml', createStylesXml());
    
    // Create document content with proper formatting
    const documentContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${convertHtmlToDocxXml(htmlContent)}
  </w:body>
</w:document>`;
    
    zip.folder('word')?.file('document.xml', documentContent);
    
    zip.folder('word')?.folder('_rels')?.file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
    
    // Generate the DOCX file
    const blob = zip.generate({ 
      type: 'blob', 
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    // Save the file
    saveAs(blob, fileName);
  } catch (error) {
    throw new Error('Failed to save document: ' + error);
  }
}

function createStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="200" w:after="100"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="Heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="160" w:after="80"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>
      <w:b/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`;
}

function escapeXml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function convertHtmlToDocxXml(html: string): string {
  // Parse HTML and convert to DOCX XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const result: string[] = [];
  
  // Process all elements in the body
  const processNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        return; // Text nodes are handled within their parent elements
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      switch (tagName) {
        case 'p':
          result.push(createParagraph(element));
          break;
        case 'h1':
          result.push(createHeading(element, 1));
          break;
        case 'h2':
          result.push(createHeading(element, 2));
          break;
        case 'h3':
          result.push(createHeading(element, 3));
          break;
        case 'h4':
          result.push(createHeading(element, 4));
          break;
        case 'h5':
          result.push(createHeading(element, 5));
          break;
        case 'h6':
          result.push(createHeading(element, 6));
          break;
        case 'ul':
        case 'ol':
          // Process list items
          element.querySelectorAll('li').forEach(li => {
            result.push(createListItem(li, tagName === 'ol'));
          });
          break;
        case 'blockquote':
          result.push(createQuote(element));
          break;
        case 'pre':
        case 'code':
          result.push(createCode(element));
          break;
        default:
          // For other elements, process their children
          element.childNodes.forEach(child => processNode(child));
      }
    }
  };
  
  doc.body.childNodes.forEach(node => processNode(node));
  
  // If no content, add an empty paragraph
  if (result.length === 0) {
    result.push('<w:p><w:r><w:t></w:t></w:r></w:p>');
  }
  
  return result.join('\n');
}

function createParagraph(element: HTMLElement): string {
  const runs = createRuns(element);
  let pPr = '';
  
  // Check for text alignment
  if (element.classList.contains('text-center')) {
    pPr = '<w:pPr><w:jc w:val="center"/></w:pPr>';
  } else if (element.classList.contains('indent')) {
    pPr = '<w:pPr><w:ind w:left="720"/></w:pPr>';
  }
  
  return `<w:p>${pPr}${runs}</w:p>`;
}

function createHeading(element: HTMLElement, level: number): string {
  const runs = createRuns(element);
  let pPr = `<w:pPr><w:pStyle w:val="Heading${level}"/>`;
  
  if (element.classList.contains('text-center')) {
    pPr += '<w:jc w:val="center"/>';
  }
  
  pPr += '</w:pPr>';
  
  return `<w:p>${pPr}${runs}</w:p>`;
}

function createListItem(element: HTMLElement, isNumbered: boolean): string {
  const runs = createRuns(element);
  return `<w:p>
    <w:pPr>
      <w:numPr>
        <w:ilvl w:val="0"/>
        <w:numId w:val="${isNumbered ? '2' : '1'}"/>
      </w:numPr>
    </w:pPr>
    ${runs}
  </w:p>`;
}

function createQuote(element: HTMLElement): string {
  const runs = createRuns(element);
  return `<w:p>
    <w:pPr>
      <w:ind w:left="720" w:right="720"/>
    </w:pPr>
    ${runs}
  </w:p>`;
}

function createCode(element: HTMLElement): string {
  const text = element.textContent || '';
  return `<w:p>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>
      </w:rPr>
      <w:t xml:space="preserve">${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function createRuns(element: HTMLElement): string {
  const runs: string[] = [];
  
  const processNode = (node: Node, formatting: Set<string> = new Set()): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        let runProps = '';
        if (formatting.size > 0) {
          runProps = '<w:rPr>';
          if (formatting.has('strong') || formatting.has('b')) runProps += '<w:b/>';
          if (formatting.has('em') || formatting.has('i')) runProps += '<w:i/>';
          if (formatting.has('u')) runProps += '<w:u w:val="single"/>';
          if (formatting.has('s') || formatting.has('strike') || formatting.has('del')) runProps += '<w:strike/>';
          if (formatting.has('span.redline-addition')) {
            runProps += '<w:color w:val="FF0000"/><w:u w:val="single"/>';
          }
          if (formatting.has('span.redline-deletion')) {
            runProps += '<w:color w:val="FF0000"/><w:strike/>';
          }
          if (formatting.has('span.small-caps')) {
            runProps += '<w:smallCaps/>';
          }
          runProps += '</w:rPr>';
        }
        runs.push(`<w:r>${runProps}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      const tagName = elem.tagName.toLowerCase();
      const newFormatting = new Set(formatting);
      
      // Check for redline classes
      if (elem.classList.contains('redline-addition')) {
        newFormatting.add('span.redline-addition');
      } else if (elem.classList.contains('redline-deletion')) {
        newFormatting.add('span.redline-deletion');
      } else if (elem.classList.contains('small-caps')) {
        newFormatting.add('span.small-caps');
      } else if (['strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del'].includes(tagName)) {
        newFormatting.add(tagName);
      }
      
      elem.childNodes.forEach(child => processNode(child, newFormatting));
    }
  };
  
  element.childNodes.forEach(child => processNode(child));
  
  // If no runs created, add an empty one
  if (runs.length === 0) {
    runs.push('<w:r><w:t></w:t></w:r>');
  }
  
  return runs.join('');
}
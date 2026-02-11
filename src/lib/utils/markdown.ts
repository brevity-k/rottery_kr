/**
 * Zero-dependency markdown-to-HTML converter.
 * Supports: headings, bold, italic, links, lists, paragraphs, code blocks, inline code, blockquotes, hr.
 */
export function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`;
  });

  // Split into lines for block-level processing
  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      if (inList) { result.push("</ul>"); inList = false; }
      if (inBlockquote) { result.push("</blockquote>"); inBlockquote = false; }
      result.push("<hr />");
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList) { result.push("</ul>"); inList = false; }
      if (inBlockquote) { result.push("</blockquote>"); inBlockquote = false; }
      const level = headingMatch[1].length;
      result.push(`<h${level}>${processInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      if (inList) { result.push("</ul>"); inList = false; }
      if (!inBlockquote) { result.push("<blockquote>"); inBlockquote = true; }
      result.push(`<p>${processInline(line.slice(2))}</p>`);
      continue;
    } else if (inBlockquote) {
      result.push("</blockquote>");
      inBlockquote = false;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { result.push("<ul>"); inList = true; }
      result.push(`<li>${processInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    } else if (inList) {
      result.push("</ul>");
      inList = false;
    }

    // Empty line
    if (line.trim() === "") {
      continue;
    }

    // Paragraph
    result.push(`<p>${processInline(line)}</p>`);
  }

  if (inList) result.push("</ul>");
  if (inBlockquote) result.push("</blockquote>");

  return result.join("\n");
}

function processInline(text: string): string {
  // Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Links
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

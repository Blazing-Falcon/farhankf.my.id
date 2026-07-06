import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// marked passes raw HTML through untouched, so CMS markdown must be
// sanitized before it reaches set:html — otherwise one compromised admin
// session becomes persistent XSS for every visitor. Allowlist covers what
// markdown itself produces; raw HTML in content is deliberately stripped
// (current CMS copy is plain markdown, see README content conventions).
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'blockquote', 'pre', 'code',
    'strong', 'em', 'del', 'a',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img'
  ],
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt', 'title'],
    th: ['align'],
    td: ['align'],
    code: ['class'] // marked emits language-* classes on fenced code blocks
  },
  // no javascript: (or other exotic) URLs on links/images
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src']
};

/** Render CMS markdown to sanitized HTML, safe for set:html. */
export function renderMarkdown(md: string): string {
  return sanitizeHtml(marked.parse(md, { async: false }), SANITIZE_OPTIONS);
}

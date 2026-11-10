import { randomUUID } from 'node:crypto';
import katex from 'katex';
import { Marked, type Tokens, type TokenizerAndRendererExtension } from 'marked';
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

interface MathToken extends Tokens.Generic {
  type: 'math' | 'inlineMath';
  text: string;
  display: boolean;
  placeholder: string;
}

// LaTeX maths: $inline$ and $$display$$. The tokens render to a placeholder,
// which is swapped for KaTeX's markup only after sanitizing. KaTeX output
// needs inline styles the allowlist must not grant to CMS content.
const blockMath: TokenizerAndRendererExtension = {
  name: 'math',
  level: 'block',
  start: (src) => src.indexOf('$$'),
  tokenizer(src) {
    const match = /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/.exec(src);
    if (!match) return undefined;
    return { type: 'math', raw: match[0], text: match[1].trim(), display: true, placeholder: '' };
  },
  renderer: (token) => `<p>${token.placeholder}</p>\n`,
};

// A dollar sign followed by a space, or a closing one followed by a digit, is
// money ("$5 and $10"), not maths.
const inlineMath: TokenizerAndRendererExtension = {
  name: 'inlineMath',
  level: 'inline',
  start: (src) => src.indexOf('$'),
  tokenizer(src) {
    const match =
      /^\$\$([^$\n]+?)\$\$/.exec(src) ?? /^\$(?!\s)((?:\\.|[^\\\n$])+?)(?<!\s)\$(?!\d)/.exec(src);
    if (!match) return undefined;
    return {
      type: 'inlineMath',
      raw: match[0],
      text: match[1].trim(),
      display: match[0].startsWith('$$'),
      placeholder: '',
    };
  },
  renderer: (token) => token.placeholder,
};

const markdown = new Marked({ extensions: [blockMath, inlineMath] });

/** Returns a unique, URL-safe id for each heading text it is given. */
export type Slugger = (text: string) => string;

export function createSlugger(): Slugger {
  const seen = new Map<string, number>();
  return (text) => {
    const base =
      text
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

/**
 * Render CMS markdown to sanitized HTML, safe for set:html. Headings get ids
 * from `slug`; pass one slugger for every block of a page so ids stay unique.
 */
export function renderMarkdown(md: string, slug: Slugger = createSlugger()): string {
  const nonce = `KATEX${randomUUID().replace(/-/g, '')}N`;
  const maths: MathToken[] = [];

  const tokens = markdown.lexer(md);
  markdown.walkTokens(tokens, (token) => {
    if (token.type !== 'math' && token.type !== 'inlineMath') return;
    const math = token as MathToken;
    math.placeholder = `${nonce}${maths.length}E`;
    maths.push(math);
  });

  const placeholder = new RegExp(`${nonce}(\\d+)E`, 'g');

  // The sanitizer has already dropped every attribute a heading came with, so
  // these ids are always the site's own.
  const html = sanitizeHtml(markdown.parser(tokens), SANITIZE_OPTIONS).replace(
    /<(h[1-6])>([\s\S]*?)<\/\1>/g,
    (_, tag: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, '').replace(placeholder, '').replace(/&[a-z#0-9]+;/gi, ' ');
      return `<${tag} id="${slug(text)}">${inner}</${tag}>`;
    }
  );

  return html.replace(placeholder, (_, index: string) => {
    const math = maths[Number(index)];
    return katex.renderToString(math.text, {
      displayMode: math.display,
      throwOnError: false,
      strict: 'ignore',
      maxSize: 50,
    });
  });
}

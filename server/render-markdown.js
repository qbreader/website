import { marked } from 'marked';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DOMPurify = createDOMPurify(new JSDOM('').window);

/**
 * Converts markdown to HTML that is safe to inject into a page.
 * Anything outside a small allowlist of tags and attributes (including scripts and `javascript:` links) is removed.
 * @param {string} markdown
 * @returns {string}
 */
export default function renderMarkdown (markdown) {
  return DOMPurify.sanitize(marked.parse(markdown), {
    ALLOWED_TAGS: ['a', 'b', 'br', 'code', 'em', 'i', 'li', 'ol', 'p', 'strong', 'ul'],
    ALLOWED_ATTR: ['href']
  });
}

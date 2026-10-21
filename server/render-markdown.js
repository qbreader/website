import { marked } from 'marked';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const DOMPurify = createDOMPurify(new JSDOM('').window);

export default function renderMarkdown (markdown) {
  return DOMPurify.sanitize(marked.parse(markdown), {
    ALLOWED_TAGS: ['a', 'b', 'br', 'code', 'em', 'i', 'li', 'ol', 'p', 'strong', 'ul'],
    ALLOWED_ATTR: ['href']
  });
}

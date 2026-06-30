import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHTML, kebabCase, removeParentheses, titleCase } from '../client/scripts/utilities/strings.js';

test('escapeHTML escapes &, <, >, ", and single quotes', () => {
  assert.equal(escapeHTML('a & b'), 'a &amp; b');
  assert.equal(escapeHTML('<b>bold</b>'), '&lt;b&gt;bold&lt;/b&gt;');
  assert.equal(escapeHTML('"quoted"'), '&quot;quoted&quot;');
  assert.equal(escapeHTML("it's"), 'it&#039;s');
});

test('escapeHTML returns undefined for undefined input', () => {
  assert.equal(escapeHTML(undefined), undefined);
});

test('escapeHTML returns empty string unchanged', () => {
  assert.equal(escapeHTML(''), '');
});

test('kebabCase converts spaces to hyphens and lowercases', () => {
  assert.equal(kebabCase('Hello World'), 'hello-world');
  assert.equal(kebabCase('multiple   spaces'), 'multiple-spaces');
  assert.equal(kebabCase('ALLCAPS'), 'allcaps');
});

test('kebabCase handles already-lowercase single word', () => {
  assert.equal(kebabCase('hello'), 'hello');
});

test('removeParentheses removes round parens content', () => {
  // The function removes the parens and their content but does not collapse
  // the surrounding spaces — a trailing trim is the only whitespace cleanup.
  assert.equal(removeParentheses('foo (bar) baz'), 'foo  baz');
});

test('removeParentheses removes square bracket content', () => {
  assert.equal(removeParentheses('foo [bar] baz'), 'foo  baz');
});

test('removeParentheses trims surrounding whitespace', () => {
  assert.equal(removeParentheses('  hello  '), 'hello');
});

test('removeParentheses returns string unchanged when no parens', () => {
  assert.equal(removeParentheses('plain string'), 'plain string');
});

test('titleCase capitalises first letter of each word', () => {
  assert.equal(titleCase('hello-world'), 'Hello World');
  assert.equal(titleCase('foo-bar-baz'), 'Foo Bar Baz');
});

test('titleCase handles single word without hyphen', () => {
  assert.equal(titleCase('hello'), 'Hello');
});

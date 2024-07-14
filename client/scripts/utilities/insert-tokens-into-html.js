/**
 * This function inserts tokens into a string with HTML tags at positions specified in the clean string.
 * The dirty string may also contain interpuncts; the clean string does not.
 * @param {string} dirty - the string with the HTML tags
 * @param {string} clean - the string without the HTML tags
 * @param {number[][]} arrayOfIndices - an array of arrays of indices. Each array of indices corresponds to a token
 * @param {string[]} arrayOfTokens - an array of tokens to insert into the HTML string. Default is `['<span class="text-highlight">', '</span>']`
 * @returns {string} the dirty string with tokens inserted at the specified positions in the clean string
 */
function insertTokensIntoHTML (dirty, clean, arrayOfIndices, arrayOfTokens = ['<span class="text-highlight">', '</span>']) {
  dirty = dirty.replace(/…/g, '...');

  const result = [];

  const indices = arrayOfIndices.map(() => 0);
  let cleanPosition = 0;
  let dirtyPosition = 0;
  let lastDirtyPosition = 0;

  while (cleanPosition <= clean.length) {
    // skip over any HTML tags in the dirty string
    while (dirty.charAt(dirtyPosition) === '<' && clean.charAt(cleanPosition) !== '<') {
      while (dirty.charAt(dirtyPosition) !== '>' && dirtyPosition < dirty.length - 1) {
        dirtyPosition++;
      }
      dirtyPosition++;
    }

    // skip over interpuncts in the dirty string
    while (
      ['\u00B7', '\u22C5', '\u2027'].includes(dirty.charAt(dirtyPosition)) &&
            !['\u00B7', '\u22C5', '\u2027'].includes(clean.charAt(cleanPosition)) &&
            dirtyPosition < dirty.length - 1 // sanity check
    ) {
      dirtyPosition++;
    }

    // at this point, dirty[dirtyPosition] === clean[cleanPosition]
    // or dirtyPosition === dirty.length
    if (clean[cleanPosition] === '<') {
      // replace it with a special single character
      clean = clean.slice(0, cleanPosition) + '〈' + clean.slice(cleanPosition + 1);
      dirty = dirty.slice(0, dirtyPosition) + '〈' + dirty.slice(dirtyPosition + 1);
    }

    if (clean[cleanPosition] === '>') {
      // replace it with a special single character
      clean = clean.slice(0, cleanPosition) + '〉' + clean.slice(cleanPosition + 1);
      dirty = dirty.slice(0, dirtyPosition) + '〉' + dirty.slice(dirtyPosition + 1);
    }

    if (clean[cleanPosition] === '&') {
      // replace it with a special single character
      clean = clean.slice(0, cleanPosition) + '\u0267' + clean.slice(cleanPosition + 1);
      dirty = dirty.slice(0, dirtyPosition) + '\u0267' + dirty.slice(dirtyPosition + 1);
    }

    result.push(dirty.substring(lastDirtyPosition, dirtyPosition));
    lastDirtyPosition = dirtyPosition;

    // at this point, it's safe to insert matches
    for (let i = 0; i < indices.length; i++) {
      if (arrayOfIndices[i][indices[i]] === cleanPosition) {
        result.push(dirty.substring(lastDirtyPosition, dirtyPosition));
        result.push(arrayOfTokens[i]);
        indices[i]++;
        lastDirtyPosition = dirtyPosition;
      }
    }

    cleanPosition++;
    dirtyPosition++;
  }

  result.push(dirty.substring(lastDirtyPosition, dirty.length));

  return result.join('').replace(/〈/g, '&lt;').replace(/〉/g, '&gt;').replace(/\u0267/g, '&amp;');
}

export { insertTokensIntoHTML };

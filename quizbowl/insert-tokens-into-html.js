/**
 * This function inserts tokens into a string with HTML tags at positions specified in the clean string.
 * The dirty string may also contain interpuncts; the clean string does not.
 * @param {string} dirty - the string with the HTML tags
 * @param {string} clean - the string without the HTML tags
 * @param {Object<string, number[]>} tokensToIndices - an object mapping token indices to their positions in the clean string
 * @param {string} [openingToken] - which of the keys in `tokensToIndices` is an opening HTML tag (as opposed to a closing one) and should be used as the opening token. Throws an error if `tokensToIndices` does not contain exactly two keys, or if the opening token is not one of them.
 * @returns {string} the dirty string with tokens inserted at the specified positions in the clean string
 */
export default function insertTokensIntoHTML (
  dirty,
  clean,
  tokensToIndices = { '<span class="text-highlight">': [], '</span>': [] },
  openingToken
) {
  dirty = dirty.replace(/…/g, '...');

  const tokensToIndicesCopy = JSON.parse(JSON.stringify(tokensToIndices));

  const result = [];

  let cleanPosition = 0;
  let dirtyPosition = 0;
  let lastDirtyPosition = 0;

  const closingToken = getClosingToken(tokensToIndicesCopy, openingToken);
  let currentlyOpenToken = false;

  while (cleanPosition <= clean.length) {
    // if we are at a closing html tag
    // and there is an open token (e.g. <span class="text-highlight"> but no closing </span>)
    // then we need to insert a </span> before the closing tag
    // and add back <span class="text-highlight"> after it
    if (currentlyOpenToken && openingToken) {
      while (clean.charAt(cleanPosition) !== '<' && dirty.charAt(dirtyPosition) === '<' && dirty.charAt(dirtyPosition + 1) === '/') {
        result.push(dirty.substring(lastDirtyPosition, dirtyPosition));
        result.push(closingToken);
        lastDirtyPosition = dirtyPosition;

        // skip over the closing tag
        while (dirty.charAt(dirtyPosition) === '<' && clean.charAt(cleanPosition) !== '<') {
          while (dirty.charAt(dirtyPosition) !== '>' && dirtyPosition < dirty.length - 1) {
            dirtyPosition++;
          }
          dirtyPosition++;
        }

        // insert the opening token again
        result.push(dirty.substring(lastDirtyPosition, dirtyPosition));
        result.push(openingToken);
        lastDirtyPosition = dirtyPosition;
      }
    }

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

    result.push(dirty.substring(lastDirtyPosition, dirtyPosition));
    lastDirtyPosition = dirtyPosition;

    // at this point, it's safe to insert matches
    for (const [token, indices] of Object.entries(tokensToIndicesCopy)) {
      if (indices[0] === cleanPosition) {
        result.push(dirty.substring(lastDirtyPosition, dirtyPosition));
        result.push(token);
        indices.shift();
        lastDirtyPosition = dirtyPosition;
        currentlyOpenToken = (token === openingToken);
      }
    }

    cleanPosition++;
    dirtyPosition++;
  }

  result.push(dirty.substring(lastDirtyPosition, dirty.length));

  return result.join('').replace(/〈/g, '&lt;').replace(/〉/g, '&gt;');
}

function getClosingToken (tokensToIndices, openingToken) {
  if (!openingToken || typeof openingToken !== 'string') {
    return undefined;
  }

  if (!Object.keys(tokensToIndices).length === 2) {
    throw new Error('If openingToken is specified, tokensToIndices must contain exactly two keys: the opening and closing tokens.');
  }

  if (!Object.keys(tokensToIndices).includes(openingToken)) {
    throw new Error(`If openingToken is specified, arrayOfTokens must contain the opening token "${openingToken}".`);
  }

  const closingToken = Object.keys(tokensToIndices).find(token => token !== openingToken);
  return closingToken;
}

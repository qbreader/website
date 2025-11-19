export function arrayToRange (array) {
  if (array.length === 0) return '';

  array = [...new Set(array)];
  array = array.sort((a, b) => a - b);

  let string = '';
  let lastRangeStart = array[0];
  let lastRangeEnd = array[0];

  for (let i = 1; i < array.length; i++) {
    if (array[i] - lastRangeEnd === 1) {
      lastRangeEnd = array[i];
    } else {
      if (lastRangeStart === lastRangeEnd) {
        string = `${string}, ${lastRangeStart}`;
      } else {
        string = `${string}, ${lastRangeStart}-${lastRangeEnd}`;
      }
      lastRangeStart = array[i];
      lastRangeEnd = array[i];
    }
  }

  if (lastRangeStart === lastRangeEnd) {
    string = `${string}, ${lastRangeStart}`;
  } else {
    string = `${string}, ${lastRangeStart}-${lastRangeEnd}`;
  }

  return string.slice(2);
}

export function rangeToArray (string, max = 0) {
  if (string.length === 0) {
    string = `1-${max}`;
  }

  if (string.endsWith('-')) {
    string = string + max;
  }

  const tokens = string.split(',');
  const ranges = [];
  for (let i = 0; i < tokens.length; i++) {
    const range = tokens[i].trim().split('-');
    if (range.length === 1) {
      ranges.push([parseInt(range[0]), parseInt(range[0])]);
    } else {
      ranges.push([parseInt(range[0]), parseInt(range[1])]);
    }
  }

  const array = [];
  for (let i = 0; i < ranges.length; i++) {
    for (let j = ranges[i][0]; j <= ranges[i][1]; j++) {
      array.push(j);
    }
  }

  return array;
}

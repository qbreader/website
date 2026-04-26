export default function validateString (object, field, { defaultValue = '' } = {}) {
  function getFieldValue (value) {
    if (value === undefined) { return defaultValue; }
    if (typeof value !== 'string') { return defaultValue; }
    return value.trim();
  }

  object[field] = getFieldValue(object[field]);
  return object;
}

export function word (object) {
  return validateString(object, 'word', { defaultValue: '' });
}

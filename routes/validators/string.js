export default function validateString (object, field, { defaultValue = '' } = {}) {
  function getFieldValue (value) {
    if (value === undefined) { return defaultValue; }
    if (typeof value !== 'string') { return defaultValue; }
    return value.trim();
  }

  object[field] = getFieldValue(object[field]);
  return object;
}

export function queryString (object) {
  if (object.q && !object.queryString) { object.queryString = object.q; }
  return validateString(object, 'queryString', { defaultValue: '' });
}

export function setName (object) {
  return validateString(object, 'setName', { defaultValue: '' });
}

export function word (object) {
  return validateString(object, 'word', { defaultValue: '' });
}

import { ObjectId } from 'mongodb';

/**
 * Validates that a field in an object is a valid MongoDB ObjectId string and converts it to an ObjectId instance. If the field is undefined, null, or not a valid ObjectId string, it sets the field to null.
 * @param {object} object
 * @param {string} field - The name of the field in the object to validate as an ObjectId
 * @returns {{ [field: string]: ObjectId | null }}
 */
export default function validateObjectId (object, field) {
  function getFieldValue (value) {
    if (value === undefined || value === null) { return null; }
    if (typeof value !== 'string') { return null; }
    try { return new ObjectId(value); } catch (error) { return null; }
  }
  object[field] = getFieldValue(object[field]);
  return object;
}

/**
 * Validates the '_id' field of an object as a MongoDB ObjectId.
 * Also allows for the 'id' field to be used as an alias for '_id' if '_id' is not present.
 */
export function _id (object) {
  if (!object._id && object.id) { object._id = object.id; }
  return validateObjectId(object, '_id');
}

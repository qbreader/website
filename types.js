// import { CATEGORIES, SUBCATEGORIES_FLATTENED } from './constants.js';

// eslint-disable-next-line no-unused-vars
import { ObjectId } from 'mongodb';


/**
 * @typedef {object} Question
 * @property {ObjectId} _id
 * @property {string} category
 * @property {number} difficulty
 * @property {string} subcategory
 * @property {number} number
 *
 * @property {object} packet
 * @property {ObjectId} packet._id
 * @property {string} packet.name
 * @property {number} packet.number
 *
 * @property {object} set
 * @property {ObjectId} set._id
 * @property {string} set.name
 * @property {number} set.year
 *
 * @property {"tossup" | "bonus"} type
 * @property {Date} createdAt
 * @property {Date} updatedAt
 *
 * @property {string} [packetName] Deprecated
 * @property {number} [packetNumber] Deprecated
 * @property {ObjectId} [packet_id] Deprecated
 * @property {number} questionNumber Deprecated
 * @property {string} [setName] Deprecated
 * @property {number} [setYear] Deprecated
 * @property {ObjectId} [set_id] Deprecated
 */

/**
 * @typedef {object} TossupProperties
 * @property {string} question
 * @property {string} answer_sanitized
 * @property {string} answer
 * @property {"tossup"} type
 *
 * @typedef {Question & TossupProperties} Tossup
 */


/**
 * @typedef {object} BonusProperties
 * @property {string} leadin
 * @property {string[]} parts
 * @property {string[]} answers_sanitized
 * @property {string[]} answers
 * @property {number[]} [values]
 * @property {("e" | "m" | "h")[]} [difficulties]
 * @property {"bonus"} type
 *
 * @typedef {Question & BonusProperties} Bonus
 */



/**
 * @typedef {object} Packet
 * @property {ObjectId} _id
 * @property {string} name
 * @property {number} number
 * @property {object} set
 * @property {ObjectId} set._id
 * @property {string} set.name
 */

/**
 * @typedef {object} Set
 * @property {ObjectId} _id
 * @property {string} name
 * @property {number} year
 * @property {number} difficulty
 */

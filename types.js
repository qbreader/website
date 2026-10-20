/** @typedef {import('mongodb').ObjectId} ObjectId */

/**
 * @typedef {object} Question
 * @property {ObjectId} _id
 * @property {string} category
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10} difficulty
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
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} TossupProperties
 * @property {string} question
 * @property {string} answer_sanitized
 * @property {string} answer
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
 * @property {("e" | "m" | "h")[]} [difficultyModifiers]
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
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10} difficulty
 */

/**
 * A Geoword set: a group of packets played by the same teams. Lives in the `geoword` database,
 * and is referenced by `set: { _id, name }` on packets, tossups, buzzes, payments, division
 * choices and teams. Deliberately holds no arrays, so it never grows with the packets in it.
 * @typedef {object} GeowordSet
 * @property {ObjectId} _id
 * @property {string} name
 */

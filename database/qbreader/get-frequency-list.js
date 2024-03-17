import { bonuses, tossups } from './collections.js';

import { DIFFICULTIES } from '../../constants.js';

/**
 * Merge two sorted arrays into a single sorted array.
 * @template T
 * @param {T[]} array1
 * @param {T[]} array2
 * @param {(arg: T) => number} keyFunction - the function to extract the key from each element.
 * @param {(arg1: T, arg2: T) => T} combineFunction - the function to combine two elements with the same key.
 * @returns {T[]} The merged array.
 */
function mergeTwoSortedArrays(array1, array2, keyFunction, combineFunction) {
    const mergedArray = [];
    let i = 0;
    let j = 0;

    while (i < array1.length && j < array2.length) {
        const key1 = keyFunction(array1[i]);
        const key2 = keyFunction(array2[j]);
        if (key1 < key2) {
            mergedArray.push(array1[i]);
            i++;
        } else if (key1 > key2) {
            mergedArray.push(array2[j]);
            j++;
        } else {
            mergedArray.push(combineFunction(array1[i], array2[j]));
            i++;
            j++;
        }
    }

    while (i < array1.length) {
        mergedArray.push(array1[i]);
        i++;
    }

    while (j < array2.length) {
        mergedArray.push(array2[j]);
        j++;
    }

    return mergedArray;
}

/**
 * Get a frequency list of answers for a given subcategory and difficulty.
 * @param {string} subcategory
 * @param {number[]} [difficulties] An array of difficulties to include. Defaults to all difficulties.
 * @param {number} [limit=100] The maximum number of answers to return. Defaults to 100.
 * @returns {Promise<{ answer: string, count: number }[]>} The frequency list.
 */
async function getFrequencyList(subcategory, difficulties=DIFFICULTIES, limit=100) {
    const aggregation = [
        { $match: { subcategory, difficulty: { $in: difficulties } } },
        { $addFields: {
            // This is a regex that matches everything before the first open parenthesis or bracket.
            regex: { $regexFind: { input: '$answer', regex: /^[^[(]*/ } },
        } },
        { $addFields: {
            // This is a regex that matches everything outside of parentheses ()
            regex: { $regexFind: { input: '$regex.match', regex: /[^()]+(?![^(]*\))/ } },
        } },
        { $addFields: {
            sanitized_answer: { $trim: { input: '$regex.match' } },
        } },
        { $group: { _id: '$sanitized_answer', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $addFields: { answer: '$_id' } },
        { $sort: { answer: 1 } },
    ];

    const tossupList = await tossups.aggregate(aggregation).toArray();

    const bonusList = await bonuses.aggregate([
        { $unwind: { path: '$answers' } },
        { $addFields: { answer: '$answers' } },
    ].concat(aggregation)).toArray();

    const frequencyList = mergeTwoSortedArrays(
        tossupList,
        bonusList,
        (a) => a.answer,
        (a, b) => ({ answer: a.answer, count: a.count + b.count }),
    );

    frequencyList.sort((a, b) => b.count - a.count);

    if (limit) {
        frequencyList.length = limit;
    }

    return frequencyList;
}

export default getFrequencyList;

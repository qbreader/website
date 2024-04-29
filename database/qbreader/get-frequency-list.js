import { bonuses, tossups } from './collections.js';

import { DIFFICULTIES } from '../../constants.js';

/**
 * Merge two sorted arrays into a single sorted array.
 * The two arrays should be sorted by the key function.
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
 * @param {number} [limit=50] The maximum number of answers to return. Defaults to 50.
 * @returns {Promise<{ answer: string, count: number }[]>} The frequency list.
 */
async function getFrequencyList(subcategory, difficulties=DIFFICULTIES, limit=50, questionType='all') {
    const tossupAggregation = [
        { $match: { subcategory, difficulty: { $in: difficulties } } },
        { $addFields: {
            // This is a regex that matches everything before the first open parenthesis or bracket.
            regex: { $regexFind: { input: '$unformatted_answer', regex: /^[^[(]*/ } },
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
        { $addFields: { unformatted_answer: '$_id' } },
        { $sort: { unformatted_answer: 1 } },
    ];

    const bonusAggregation = [
        { $unwind: { path: '$unformatted_answers' } },
        { $addFields: { unformatted_answer: '$unformatted_answers' } },
    ].concat(tossupAggregation);

    switch (questionType) {
    case 'tossup': {
        const tossupList = await tossups.aggregate(tossupAggregation).toArray();
        tossupList.sort((a, b) => b.count - a.count);
        if (limit) {
            tossupList.length = limit;
        }
        return tossupList;
    }
    case 'bonus': {
        const bonusList = await bonuses.aggregate(bonusAggregation).toArray();
        bonusList.sort((a, b) => b.count - a.count);
        if (limit) {
            bonusList.length = limit;
        }
        return bonusList;
    }
    case 'all':
        break;
    default:
        throw new Error('Invalid question type');
    }

    const [tossupList, bonusList] = await Promise.all([
        tossups.aggregate(tossupAggregation).toArray(),
        bonuses.aggregate(bonusAggregation).toArray(),
    ]);

    const frequencyList = mergeTwoSortedArrays(
        tossupList,
        bonusList,
        (a) => a.unformatted_answer,
        (a, b) => ({ unformatted_answer: a.unformatted_answer, count: a.count + b.count }),
    );

    frequencyList.sort((a, b) => b.count - a.count);

    if (limit) {
        frequencyList.length = limit;
    }

    return frequencyList;
}

export default getFrequencyList;

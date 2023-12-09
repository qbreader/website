import { removeHTMLTags } from './utils.js';

/**
 * Given an answer, return an array of equivalent answers (i.e. answers that should always match).
 * @param {string} answer
 * @returns {string[]} An array of equivalent answers.
 */
function getEquivalentAnswers(answer) {
    answer = answer.toLowerCase();
    answer = removeHTMLTags(answer);
    switch (answer) {
    case 'atomic bombs':
    case 'nuclear weapons':
    case 'nukes':
        return ['atomic bombs', 'atomic weapons', 'nuclear bombs', 'nuclear weapons', 'nukes', 'fission bombs', 'A-bombs'];
    case 'house':
        return ['home'];
    case 'mouse':
        return ['mice'];
    case 'rail':
    case 'railroad':
        return ['rail', 'railroad'];
    case 'nineteen eighty-four':
    case 'nineteen eighty four':
        return ['1984'];
    case 'oxidation number':
    case 'oxidation state':
        return ['oxidation number', 'oxidation state'];
    case 'ralph vaughan-williams':
        return ['rvw'];
    case 'spacewalk':
        return ['space walk'];
    case 'sugar cane':
    case 'sugarcane':
        return ['sugar cane', 'sugarcane'];
    case 'wavefunction':
    case 'wave function':
        return ['wave function', 'wavefunction'];
    case 'world war 1':
    case 'world war i':
    case 'world war one':
        return [
            'first world war',
            'great war',
        ];
    case 'world war ii':
    case 'world war two':
    case 'world war 2':
        return [
            'ww2',
            'wwii',
            'world war ii',
            'world war 2',
            'world war two',
            'second world war',
        ];
    }

    return [];
}

export default getEquivalentAnswers;

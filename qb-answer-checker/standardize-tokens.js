/**
 * Given a token, convert it to a standard form when it can be represented in multiple ways.
 * @param {string} token
 * @returns {string}
 */
function standardizeTokens(token) {
    switch (token) {
    case 'dr':
    case 'dr.':
        return 'doctor';

    case 'st':
    case 'st.':
        return 'saint';

        // ordinals
    case '1st':
        return 'first';
    case '2nd':
        return 'second';
    case '3rd':
        return 'third';
    case '4th':
        return 'fourth';
    case '5th':
        return 'fifth';
    case '6th':
        return 'sixth';
    case '7th':
        return 'seventh';
    case '8th':
        return 'eighth';
    case '9th':
        return 'ninth';
    case '10th':
        return 'tenth';

        // units
    case 'cm':
        return 'centimeter';
    case 'mm':
        return 'millimeter';

        // typoes
    case 'contentinal':
        return 'continental';
    }

    return token;
}

export default standardizeTokens;

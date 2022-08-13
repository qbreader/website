const quizbowl = require('../quizbowl.js');

const answerline1 = "<b><u>Manchester</u></b>"
const answerline2 = "<b><u>damper</u></b>s [or <b><u>dashpot</u></b>s; accept (tuned) mass <b><u>damper</u></b>s]"
const answerline3 = "Alice <b><u>Munro</u></b> [or Alice Ann <b><u>Munro</u></b> or Alice Ann <b><u>Laidlaw</u></b>] (The first two stories are “The Progress of Love” and “Hateship, Friendship, Courtship, Loveship, Marriage.”)"
const answerline4 = "<b><u>light pollution</u></b> [accept <b><u>sky glow</u></b> or <b><u>glare</u></b>; prompt on artificial <u>light</u>] (The Znamya project created large mirrors intended to light up the night.)"
const answerline5 = "<b><u>Sahara</u></b> Desert [or aṣ-<b><u>Ṣaḥrāʾ al-Kubrā</u></b> or <b><u>Aneẓruf</u></b> <b><u>Ameqran</u></b>; accept <b><u>Deshret</u></b>; accept Nilo-<b><u>Saharan</u></b> languages; accept <b><u>Tibesti</u></b> Mountains or <b><u>Tassili</u></b> n’Ajjer or <b><u>Aïr</u></b> Mountains until read; accept the <b><u>Fezzan</u></b> or <b><u>Illizi</u></b> or <b><u>Hoggar</u></b> Mountains or <b><u>Ahaggar</u></b> or <b><u>Tanezrouft</u></b> or <b><u>Grand Erg</u></b> Oriental; accept <b><u>Ténéré</u></b> until “Tenerian”; prompt on <u>Algeria</u> or <u>Chad</u> or <u>Libya</u> or <u>Niger</u> or <u>Egypt</u>; prompt on North <u>Africa</u> or <u>Maghreb</u>]"
const answerline6 = "<b><u>primatology</u></b> [or word forms; accept any answers about the study of great <b><u>ape</u></b>s, nonhuman <b><u>primate</u></b>s, <b><u>gorilla</u></b>s, <b><u>bonobo</u></b>s, or <b><u>chimp</u></b>anzees; prompt on the study of <u>monkey</u>s or <u>simian</u>s; prompt on word forms of <u>ethology</u>, <u>biology</u>, <u>anthropology</u>, or evolutionary or social <u>psychology</u>; prompt on the study of <u>animal</u>s with “what type of animals?”]"
const answerline7 = "Heinrich <b><u>Böll</u></b> [or Heinrich Theodor <b><u>Böll</u></b>]";
const answerline8 = "Heinrich Böll [or Heinrich Theodor Böll]";
const answerline9 = "primatology [or word forms; accept any answers about the study of great apes, nonhuman primates, gorillas, bonobos, or chimpanzees; prompt on the study of monkeys or simians; prompt on word forms of ethology, biology, anthropology, or evolutionary or social psychology; prompt on the study of animals with “what type of animals?”]"

const tests = [
    // single answerline
    ['accept', answerline1, 'manchester'],
    ['accept', answerline1, 'MANCHESTER'],
    ['reject', answerline1, 'London'],
    
    // multiple answerlines
    ['accept', answerline2, 'dampers'],
    ['accept', answerline2, 'dashpot'],
    ['accept', answerline2, 'tuned mass dampers'],

    // authors and proper names
    ['accept', answerline3, 'Munro'],
    ['accept', answerline3, 'Alice Munro'],

    // prompts and multiple underlined words
    ['prompt', answerline4, 'light'],
    ['accept', answerline4, 'light pollution'],
    ['reject', answerline4, 'pollution'],

    // partial underlining and words not underlined
    ['reject', answerline5, 'Desert'],
    ['accept', answerline6, 'chimpanzee'],
    ['accept', answerline6, 'chimp'],

    // special characters (umlaut)
    ['accept', answerline7, 'boll'],
    ['accept', answerline7, 'heinrich boll'],
    ['accept', answerline7, 'Böll'],
    ['accept', answerline7, 'Heinrich Böll'],

    ['accept', answerline8, 'boll'],
    ['accept', answerline8, 'heinrich boll'],
    ['accept', answerline8, 'Böll'],
    ['accept', answerline8, 'Heinrich Böll'],

    // unformatted answerlines
    ['reject', answerline9, 'chimp'], // TODO: make this accept
    ['accept', answerline9, 'chimpanzee'],
];

let successful = 0, total = 0;
console.log('TESTING quizbowl.checkAnswer()');
tests.forEach(test => {
    const expected = test[0];
    const answerline = test[1];
    const givenAnswer = test[2];
    const result = quizbowl.checkAnswer(answerline, givenAnswer);

    console.assert(expected === result, `expected "${expected}" but got "${result}" for given answer "${givenAnswer}"`);

    total++;
    if (expected === result) successful++;
});

console.log(`${successful}/${total} tests successful`);
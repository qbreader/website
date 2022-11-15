const quizbowl = require('../server/quizbowl.js');

const formatted_answers = [
    "Jasper <b><u>Johns</u></b>",
    "<b><u>Manchester</u></b>",
    "<b><u>damper</u></b>s [or <b><u>dashpot</u></b>s; accept (tuned) mass <b><u>damper</u></b>s]",
    "Alice <b><u>Munro</u></b> [or Alice Ann <b><u>Munro</u></b> or Alice Ann <b><u>Laidlaw</u></b>] (The first two stories are “The Progress of Love” and “Hateship, Friendship, Courtship, Loveship, Marriage.”)",
    "<b><u>light pollution</u></b> [accept <b><u>sky glow</u></b> or <b><u>glare</u></b>; prompt on artificial <u>light</u>] (The Znamya project created large mirrors intended to light up the night.)",
    "<b><u>Sahara</u></b> Desert [or aṣ-<b><u>Ṣaḥrāʾ al-Kubrā</u></b> or <b><u>Aneẓruf</u></b> <b><u>Ameqran</u></b>; accept <b><u>Deshret</u></b>; accept Nilo-<b><u>Saharan</u></b> languages; accept <b><u>Tibesti</u></b> Mountains or <b><u>Tassili</u></b> n’Ajjer or <b><u>Aïr</u></b> Mountains until read; accept the <b><u>Fezzan</u></b> or <b><u>Illizi</u></b> or <b><u>Hoggar</u></b> Mountains or <b><u>Ahaggar</u></b> or <b><u>Tanezrouft</u></b> or <b><u>Grand Erg</u></b> Oriental; accept <b><u>Ténéré</u></b> until “Tenerian”; prompt on <u>Algeria</u> or <u>Chad</u> or <u>Libya</u> or <u>Niger</u> or <u>Egypt</u>; prompt on North <u>Africa</u> or <u>Maghreb</u>]",
    "<b><u>primatology</u></b> [or word forms; accept any answers about the study of great <b><u>ape</u></b>s, nonhuman <b><u>primate</u></b>s, <b><u>gorilla</u></b>s, <b><u>bonobo</u></b>s, or <b><u>chimp</u></b>anzees; prompt on the study of <u>monkey</u>s or <u>simian</u>s; prompt on word forms of <u>ethology</u>, <u>biology</u>, <u>anthropology</u>, or evolutionary or social <u>psychology</u>; prompt on the study of <u>animal</u>s with “what type of animals?”]",
    "Heinrich <b><u>Böll</u></b> [or Heinrich Theodor <b><u>Böll</u></b>]",
    "<b><u>Louis-Philippe</u></b> [or <b><u>Duke d’Orleans</u></b>; prompt on “Citizen King” before mentioned]",
    "Johann <b><u>Tserclaes</u></b>, Graf von <b><u>Tilly</u></b> (accept either underlined answer as well as Count of <b><u>Tilly</u></b>)",
    "<b><u>Paul</u></b> <b><u>Bäumer</u></b> [accept either name]",
    "<b><u>Matsuo</u></b> <b><u>Bashō</u></b> [accept either underlined part; accept <b><u>Matsuo</u></b> Kinsaku or <b><u>Matsuo</u></b> Chūemon Munefusa]",
    "<b><u>Prime Minister</u></b> of <b><u>Australia</u></b> [prompt on partial answers]",
    "hypothesis <b><u>test</u></b>",
    "<b><u>graphene</u></b> [do not accept or prompt on \"graphite\"]",
    "<b><u>amide</u></b>s [do not accept or prompt on \"amines\"]",
    "<b><u>cosmic microwave background</u></b> radiation [or <b><u>CMB</u></b>; or <b><u>CMBR</u></b>]",
    "<b><u>1980s</u></b> [prompt on <u>80s</u>]",
    "<u>working memory</u> [prompt on partial answers or on “short-term memory”]",
    "Pyotr Ilyich <b><u>Tchaikovsky</u></b>’s <b><u>Piano Concerto</u></b> No. <b><u>1</u></b> [accept <b><u>Tchaikovsky</u></b>’s <b><u>PianoConcerto</u></b> in <b><u>B-flat</u></b> <b><u>minor</u></b> until “B-flat” is read; accept word forms like <b><u>Tchaikovsky</u></b>’s <b><u>first piano concerto</u></b>; prompt on partial answer]",
    "<b><u>Space Shuttle</u></b> [or <b><u>Space Transportation System</u></b>; or <b><u>STS</u></b>; prompt on US <u>space</u> flight or <u>NASA</u>; anti-prompt on <u>Challenger</u> Disaster or <u>Columbia</u> Disaster by asking \"What larger NASA program was it a part of?\"; anti-prompt on <u>Endeavor</u> by asking \"What larger NASA program was it a part of?\"]",
    "<b><u>Second Continental Congress</u></b> [prompt on <u>Continental Congress</u>]",
    "sacramental <b><u>bread</u></b> [accept the <b><u>host</u></b>; prompt on <u>Eucharist</u>; prompt on <u>food</u>]",
    "The <b><u>Wasteland</u></b>",
    "<b><u>W</u></b>orld <b><u>T</u></b>rade <b><u>O</u></b>rganization",
    "The (Holy) <b><u>Grail</u></b>",

    // or in the main answer,
    // and commas instead of semicolons or "or" in alternate answer
    "<b><u>Furies</u></b> or <b><u>Erinyes</u></b> [accept <b><u>Eumenides</u></b>, <b><u>Semnai</u></b>, or <b><u>Dirae</u></b>]",
];

const answers = [
    "Heinrich Böll [or Heinrich Theodor Böll]",
    "primatology [or word forms; accept any answers about the study of great apes, nonhuman primates, gorillas, bonobos, or chimpanzees; prompt on the study of monkeys or simians; prompt on word forms of ethology, biology, anthropology, or evolutionary or social psychology; prompt on the study of animals with “what type of animals?”]",
    "China [or People’s Republic of China; do not accept or prompt on “Republic of China”]",
    "amides [do not accept or prompt on \"amines\"]",
    "RAF [or Red Army Faction; accept Baader–Meinhof group; accept Baader–Meinhof gang; accept Rote Armee Fraktion] (The Action Directe communiqué was also signed “kommando elisabeth van dyck,” in reference to a fallen member of RAF.)",
    "Lenski's longterm E. coli evolution experiment [accept anything mentioning the long term evolution of E. Coli]",
    "time [accept time-like interval; prompt on T]",
    "defenestration [prompt on “falling”; accept reasonable equivalents like “jumping out of a window” or “being thrown out of a window”; prompt on “suicide”]",
    "electric charge density [accept rho before \"rho\"; prompt on \"density\" after \"charge\"; do not accept or prompt on \"density\" before \"charge\"]",
    "wave-particle duality [accept de Broglie wave until “de Broglie”; accept answers indicating that something is both a wave and a particle; prompt on duality or wave nature or complementarity; prompt on interference by asking “what property of matter causes the interference?”]",
    "“September 1, 1939”",
    "IR spectroscopy",
    "adsorption [accept chemisorption or chemical adsorption or physisorption or physical adsorption; prompt on “sorption”; do not accept or prompt on “absorption”]",
    "fluorescence microscopy [prompt on super-resolved microscopy or confocal microscopy]",
];

const tests = [
    // single answerline
    ['accept', formatted_answers[0], 'Jasper Johns'],
    ['accept', formatted_answers[0], 'Johns'],
    ['reject', formatted_answers[0], 'Jasper'],
    ['reject', formatted_answers[0], 'Jo'],

    ['accept', formatted_answers[1], 'manchester'],
    ['accept', formatted_answers[1], 'MANCHESTER'],
    ['reject', formatted_answers[1], 'London'],

    // multiple answerlines
    ['accept', formatted_answers[2], 'dampers'],
    ['accept', formatted_answers[2], 'dashpot'],
    ['accept', formatted_answers[2], 'tuned mass dampers'],

    // authors and proper names
    ['accept', formatted_answers[3], 'Munro'],
    ['accept', formatted_answers[3], 'Alice Munro'],

    // prompts and multiple underlined words
    ['prompt', formatted_answers[4], 'light'],
    ['accept', formatted_answers[4], 'light pollution'],
    ['reject', formatted_answers[4], 'pollution'],

    // partial underlining and words not underlined
    ['reject', formatted_answers[5], 'Desert'],
    ['accept', formatted_answers[6], 'chimpanzee'],
    ['accept', formatted_answers[6], 'chimp'],

    // special characters (umlaut)
    ['accept', formatted_answers[7], 'boll'],
    ['accept', formatted_answers[7], 'heinrich boll'],
    ['accept', formatted_answers[7], 'Böll'],
    ['accept', formatted_answers[7], 'Heinrich Böll'],

    ['accept', formatted_answers[8], 'Louis-Philippe'],
    ['accept', formatted_answers[8], 'Louis-Phillipe'],
    ['prompt', formatted_answers[8], 'Citizen King'],
    ['reject', formatted_answers[8], 'Louis'],
    ['reject', formatted_answers[8], 'Philippe'],

    // accept either clauses
    ['accept', formatted_answers[9], 'Tserclaes'],
    ['accept', formatted_answers[9], 'Tilly'],
    ['accept', formatted_answers[9], 'Count of Tilly'],

    // accept either clauses with special characters
    ['accept', formatted_answers[10], 'Baumer'],
    ['accept', formatted_answers[10], 'Bäumer'],
    ['accept', formatted_answers[10], 'Paul'],
    ['accept', formatted_answers[10], 'Paul Bäumer'],

    ['accept', formatted_answers[11], 'Basho'],
    ['accept', formatted_answers[11], 'Bashō'],
    ['accept', formatted_answers[11], 'Matsuo'],
    ['accept', formatted_answers[11], 'Matsuo Basho'],
    ['accept', formatted_answers[11], 'Matsuo Bashō'],

    ['accept', formatted_answers[12], 'prime minister of australia'],
    ['accept', formatted_answers[12], 'australia prime minister'],
    ['accept', formatted_answers[12], 'australian prime minister'],
    ['prompt', formatted_answers[12], 'prime minister'],

    ['accept', formatted_answers[13], 'hypothesis testing'],
    ['accept', formatted_answers[13], 'testing'],
    ['accept', formatted_answers[13], 'test'],

    ['accept', formatted_answers[14], 'graphene'],
    ['reject', formatted_answers[14], 'graphite'],

    ['accept', formatted_answers[15], 'amides'],
    ['accept', formatted_answers[15], 'amide'],
    ['reject', formatted_answers[15], 'amine'],

    ['accept', formatted_answers[16], 'cosmic microwave background radiation'],
    ['accept', formatted_answers[16], 'cosmic microwave background'],
    ['accept', formatted_answers[16], 'cmb'],
    ['accept', formatted_answers[16], 'cmbr'],

    ['accept', formatted_answers[17], '1980s'],
    ['accept', formatted_answers[17], '1980'],
    ['prompt', formatted_answers[17], '80'],
    ['prompt', formatted_answers[17], '80s'],
    ['reject', formatted_answers[17], '90s'],
    ['reject', formatted_answers[17], '90'],
    // ['reject', formatted_answers[17], '1990'], // TODO
    // ['reject', formatted_answers[17], '1990s'], // TODO

    ['accept', formatted_answers[18], 'working memory'],
    ['prompt', formatted_answers[18], 'memory'],

    ['accept', formatted_answers[19], 'Tchaikovsky Piano Concerto no 1'],
    // ['prompt', formatted_answers[19], 'Piano Concerto'], // TODO

    ['accept', formatted_answers[20], 'Endeavor'],
    ['prompt', formatted_answers[20], 'NASA'],

    ['accept', formatted_answers[21], 'second contentinal congress'],

    ['accept', formatted_answers[22], 'Eucharist bread'],

    ['accept', formatted_answers[23], 'wasteland'],
    // ['accept', formatted_answers[23], 'waste land'], // TODO?
    ['reject', formatted_answers[23], 'waste'],

    ['accept', formatted_answers[24], 'wto'],

    ['accept', formatted_answers[25], 'grail'],
    ['accept', formatted_answers[25], 'holy grail'],

    ['accept', formatted_answers[26], 'Furies'],
    ['accept', formatted_answers[26], 'Erinyes'],
    ['accept', formatted_answers[26], 'Eumenides'],
    ['accept', formatted_answers[26], 'Semnai'],

    ['accept', answers[0], 'boll'],
    ['accept', answers[0], 'heinrich boll'],
    ['accept', answers[0], 'Böll'],
    ['accept', answers[0], 'Heinrich Böll'],
    ['reject', answers[0], 'H'],

    // unformatted answerlines
    ['accept', answers[1], 'chimp'],
    ['accept', answers[1], 'chimpanzee'],

    // reject clauses that are a subset of acceptable answer
    ['accept', answers[2], 'China'],
    ['accept', answers[2], 'people’s republic of China'],
    ['reject', answers[2], 'republic of china'],

    ['accept', answers[3], 'amides'],
    ['accept', answers[3], 'amide'],
    ['reject', answers[3], 'amine'],

    ['accept', answers[4], 'baader meinhof'],
    ['accept', answers[4], 'raf'],
    ['accept', answers[4], 'red army faction'],
    ['accept', answers[4], 'red army'],

    ['accept', answers[5], 'lenski long term e coli experiment'],

    ['accept', answers[6], 'time'],

    ['accept', answers[7], 'defenestration'],
    ['accept', answers[7], 'jump out of a window'],
    ['accept', answers[7], 'jumping out of a window'],

    // ['accept', answers[8], 'charge density'], // TODO

    ['accept', answers[9], 'wave-particle duality'],

    ['accept', answers[10], 'september 1 1939'],

    ['accept', answers[11], 'ir spec'],

    ['accept', answers[12], 'adsorption'],
    ['reject', answers[12], 'absorption'],

    ['accept', answers[13], 'microscopy'],
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

const scorer = require('../server/scorer.js');
const tests = require('./scorer.test.json');
const bcolors = require('../bcolors.js');

function errorText(text) { // colors text red
    return `${bcolors.FAIL}${text}${bcolors.ENDC}`;
}


function testAnswerline(group) {
    const answerline = group.answerline;
    let successful = 0, total = 0;

    group.tests.forEach(test => {
        const expected = test.directive;
        const givenAnswer = test.given;
        const expectedDirectedPrompt = test.directedPrompt;

        const [result, directedPrompt] = scorer.checkAnswer(answerline, givenAnswer);

        const eqAnswer = expected === result;

        total++;

        console.assert(eqAnswer, errorText(`expected "${expected}" but got "${result}" for given answer "${givenAnswer}"`));
        if (!eqAnswer) return;

        if (expectedDirectedPrompt || directedPrompt) {
            const eqPrompt = expectedDirectedPrompt === directedPrompt;
            console.assert(eqPrompt, errorText(`expected directed prompt "${expectedDirectedPrompt}" but got "${directedPrompt}" for given answer "${givenAnswer}"`));
            if (!eqPrompt) return;
        }

        successful++;
    });

    return { successful, total };
}


function testAnswerType(type, count = -1) {
    console.log(`TESTING scorer.checkAnswer() for ${type} answerlines`);
    let successful = 0, total = 0;

    if (count > 0)
        tests[type].splice(count);

    tests[type].forEach(group => {
        const { successful: s, total: t } = testAnswerline(group);
        successful += s;
        total += t;
    });

    console.log(`${successful}/${total} tests successful\n`);

    return { successful, total };
}

console.time('scorer.test.js');
let successful = 0, total = 0;

const count = -1;

let { successful: s, total: t } = testAnswerType('formatted', count);
successful += s;
total += t;

({ successful: s, total: t } = testAnswerType('unformatted', count));
successful += s;
total += t;

console.log(`OVERALL ${successful}/${total} tests successful`);
console.timeEnd('scorer.test.js');

if (successful !== total) {
    process.exit(1);
}

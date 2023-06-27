import checkAnswer from '../server/checkAnswer.js';
import * as bcolors from '../bcolors.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tests = require('./scorer.test.json');
const assert = require('chai').assert;
const { describe, it } = require('mocha');

function errorText(text) {
    // Colors text red
    return `${bcolors.FAIL}${text}${bcolors.ENDC}`;
}

function answerlineTest(group) {
    let successful = 0, total = 0;
    const answerline = group.answerline;
    describe(`Answerline Test: ${answerline}`, ()=> {
        group.tests.forEach((test) => {
            const expected = test.directive;
            const givenAnswer = test.given;
            const expectedDirectedPrompt = test.directedPrompt;
            const { directive, directedPrompt } = checkAnswer(answerline, givenAnswer);
            total++;
            // Assertions will *supposedly* auto return when this fails.
            it('directive check', ()=> assert.strictEqual(expected, directive, errorText(`directive for ${givenAnswer}`)));
            if (expectedDirectedPrompt || directedPrompt) {
                it('directive prompt check', ()=> assert.strictEqual(expectedDirectedPrompt, directedPrompt, errorText(`directive prompt for ${givenAnswer}`)));
            }
            successful++;
        });
    });
    return  { successful, total };
}


function testAnswerType(type, count = -1) {
    let successful = 0, total = 0;
    describe(`${type} Answer Testing`, ()=> {
        if (count > 0) {
            tests[type].splice(count);
        }
        tests[type].forEach((group) => {
            const { successful: s, total: t } = answerlineTest(group);
            successful += s;
            total += t;
        });
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

import { getQuery, getPacket, getSet, getRandomBonuses, getRandomTossups, getNumPackets, reportQuestion } from '../database/questions';
const assert = require('chai').assert;
const { describe, it } = require('mocha');
const packetNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

/*
    Note: this.timeout(n) asserts that each `it` block individually takes less then n millisecconds.
    It's inherited by the nested test suites, and can be overriden.
*/

async function testTiming(count) {
    return describe(`Performance Tests with ${count} repetitions`, ()=> {
        /*
The "formula" for the timeing was done by replicating the request on the website,
and multiplying the execution time by 2 or 3 (usually), and the "count" parameter
*/
        function testRequest(name, timeout, func, params = false) {
            it(`${name} (under ${timeout * count}ms)`, async ()=> {
                this.timeout(timeout * count);
                const results = [];
                // Cool trick that Eslint suggested.
                for (let i = 0; i < count; i++) {
                    results.push(func(params));
                }
                await Promise.all(results);
            });
        }
        describe('getQuery', ()=> {
            testRequest('empty string', 2000, getQuery, { questionType: 'all', verbose: false });
            testRequest('"abc"', 3000, getQuery,  { queryString: 'abc', questionType: 'all', verbose: false });
            testRequest('"abc", return length 401', 5000, getQuery, { queryString: 'abc', questionType: 'all', verbose: false, maxReturnLength: 401 });
            testRequest('"([aàáâǎäãåāăạả](b*)[cçćčɔ́ĉƈ]+?.*){1,}", regex', 10000, getQuery, { queryString: '([aàáâǎäãåāăạả](b*)[cçćčɔ́ĉƈ]+?.*){1,}', questionType: 'all', verbose: false, regex: true });
            testRequest('"cesare", ignore diacritics"', 170000, getQuery, { queryString: 'cesaire', questionType: 'all', verbose: false, ignoreDiacritics: true });
        });
        describe('getPacket', ()=> {
            testRequest('2018 PACE NSC', 1000, getPacket, { setName: '2018 PACE NSC', packetNumber: 5 });
        });
        describe('getSet', ()=> {
            testRequest('2018 PACE NSC', 1000, getSet, { setName: '2018 PACE NSC', packetNumbers, questionType: 'bonus' });
            testRequest('Invalid set name', 2500, getSet, { setName: '(￣y▽￣)╭', packetNumbers, questionType: 'bonus' });
        });
        describe('Random Functions', ()=> {
            this.timeout(2500);
            testRequest('getRandomBonuses', 2500, getRandomBonuses);
            testRequest('getRandomTossups', 2500, getRandomTossups);
        });
        // The report function can't use tests requests because it requires more then one parameter :(
        describe('reportQuestion', ()=> {
            it('reportQuestion', async ()=> {
                const results = [];
                for (let i = 0; i < count; i++) {
                    results.push(reportQuestion('630020e3cab8fa6d1490b8ea', 'other', 'test'));
                }
                await Promise.all(results);
            });
        });
    });
}

async function testCorrectness() {
    return describe('Correctness Tests', ()=> {
        function testQuery(testName, params, tossupCount, bonusCount, expectedFirstTossupQueston, expectedFirstTossupAnswer) {
            it(testName, async ()=> {
                const { tossups, bonuses } = await getQuery(params);
                assert.isOk(tossups, 'tossups');
                assert.isOk(bonuses, 'bonuses');
                assert.propertyVal(tossups, 'count', tossupCount, 'tossup count');
                assert.propertyVal(bonuses, 'count', bonusCount, 'bonus count');
                assert.strictEqual(tossups.questionArray[0].question, expectedFirstTossupQueston, 'tossup array - question');
                assert.strictEqual(tossups.questionArray[0].answer, expectedFirstTossupAnswer, 'tossup array - answer');
            });
        }
        {
            const question = 'Note to moderator: Read the answerline carefully. A simplified, secular form of this practice is nicknamed “the 24.” Arthur Rosenfeld hosted a PBS program that instructed this practice for longevity and taught that chewing food 36 times can enhance the sensitivity, or “listening power,” outlined in this practice’s “classics.” The last Saturday in April is a worldwide holiday for this practice, whose methods of silk reeling and pushing hands may be attributed to its legendary inventor Zhāng Sānfēng (“jahng sahn-fung”) of the Wǔdāng (“oo-dahng”) Mountains. The Sūn (“swun”) and Yáng lineages are two of the five major styles of this type of nèijiā (“nay-jʼyah”), which originated in Chén (“chun”) Village. Unlike repetitive qìgōng (“chee-gong”), this balance-promoting practice’s “frames” link up to 108 specific postures. For 10 points, the elderly in Kowloon Park often perform what internal martial art whose routines feature slow movements?';
            const answer = 'tai chi [or tàijíquán or t’ai chi ch’üan; accept shadowboxing; prompt on Chinese martial arts until read; prompt on wǔshù or guóshù or kuoshu; prompt on exercise, physical activity, or meditation; prompt on nèijiā or nèigōng or nèijìng until “nèijiā” is read; prompt on qìgōng, ch‘i kung, chi gung, or chi ‘ung until “qìgōng” is read; prompt on Wǔdāng quán until read; prompt on traditional Chinese medicine or TCM or Zhōngyī; reject “boxing”]';
            testQuery('getQuery - "qigong", 2023 ACF Regionals, ignore diacritics',
                { queryString: 'qigong', setName: '2023 ACF Regionals', verbose: false, ignoreDiacritics: true }, 1, 0, question, answer);
        }
        {
            const question =  'A theorem introduced by this man gives a formula to find the radii of four mutually tangent circles. The second book of a work by this mathematician consists of a classification of algebraic curves, including his namesake "folium." This man is the inventor, and sometimes the namesake, of the field of analytic geometry. This man\'s three (*) "laws of nature" were a major influence on Isaac Newton\'s laws of motion. An upper limit on the number of positive roots of a polynomial can be found using this mathematician\'s "rule of signs." In two dimensions, ordered pairs are used to represent the x- and y-coordinates of numbers in his namesake coordinate system. For 10 points, name this French mathematician, who, in a famous work of philosophy, stated "Cogito ergo sum."';
            const answer = 'René Descartes (day-CART)';
            testQuery('getQuery - "newton", all questions, 2018 PACE NSC, return length = 400',
                { queryString: 'newton', questionType: 'all', setName: '2018 PACE NSC', verbose: false, maxReturnLength: 400 },
                5, 2, question, answer);
        }
        function testPacketorSet(testName, params, tossupCount, bonusCount, expectedFirstTossupQueston, expectedFirstTossupAnswer, expectedFirstLeadin) {
            it(testName, async ()=> {
                const tossups = await getSet({ ...params, questionType: 'tossup' });
                const bonuses = await getSet({ ...params, questionType: 'bonus' });

                assert.isOk(tossups, 'tossups');
                assert.isOk(bonuses, 'bonuses');
                assert.propertyVal(tossups, 'length', tossupCount, 'tossup count');
                assert.propertyVal(bonuses, 'length', bonusCount, 'bonus count');
                assert.propertyVal(bonuses[0], 'leadin', expectedFirstLeadin, 'bonuses - leadins');
                assert.strictEqual(tossups[0].question, expectedFirstTossupQueston, 'tossups - question');
                assert.strictEqual(tossups[0].answer, expectedFirstTossupAnswer, 'tossups - answer');
            });
        }
        {
            const question = 'In his final appearance, this character experiences a severe toothache after asserting "as a weapon I may be of some use. But as a man, I\'m a wreck," then leaves to join King Milan\'s forces. This man buys a painting of two boys fishing, and commissions a portrait, from his fellow expatriate Mihailov. He is shocked to learn that his lover is pregnant between one scene in which he glimpses his rival Makhotin\'s chestnut (*) Gladiator, and another scene in which he rides his own horse Frou-Frou to death. This character first encounters his future lover at a railway station, where a worker is crushed by a train, and is initially interested in Kitty Shcherbatsky. For 10 points, name this Leo Tolstoy character, a nobleman who has an affair with Anna Karenina.';
            const answer = 'Count Alexei (Kirillovich) <b><u>Vronsky</u></b> [prompt on <u>Alexei</u>]';
            const leadin = 'The 170 men who rowed each of these ships often came from Piraeus and were thetes, the lowest class of citizen. For 10 points each:';
            testPacketorSet('getPacket -\n 2018 PACE NSC, Packet 5', { setName: '2018 PACE NSC', packetNumber: 5 }, 21, 21, question, answer, leadin);
        }

        {
            const question = 'Besides his treatise on the Divine Names, the most notable work by Pseudo-Dionysius the Areopagite discusses these things. The phrase "Grigori" refers to some of these things that are heavily described in the apocryphal Books of Enoch. First Corinthians 11 argues that, specifically because of these things, women should wear head coverings when praying or prophesying. Tertullian suggested these things are what created the gigantic Nephilim. In the Talmud, Elisha ben Abuyah declares that there are "two powers in heaven" when he sees one of these things named Metatron. The book of Daniel mentions one of these beings by name, saying he will help fight the princes of Persia and protect Israel. For 10 points, name these celestial figures that include Gabriel and Michael.';
            const answer = '<b><u>angel</u></b>s [or <b><u>archangel</u></b>s; or fallen <b><u>angel</u></b>s; or <b><u>Watcher</u></b>s; or <b><u>mal\'akh</u></b>im; or <b><u>Grigori</u></b> until it is read]';
            const leadin = 'In a painting by this artist, a heavily-garlanded Pan sprawls in front of an eagle, flanked by a female personification of Death, who holds a bloody sword, and one of Pain, who wears a crown of thorns. For 10 points each:';
            testPacketorSet('getSet - 2016 NASAT', { setName: '2016 NASAT', packetNumbers: packetNumbers }, 336, 336, question, answer, leadin);
        }

        it('getNumPackets - 2018 PACE NSC', async () => assert.equal(await getNumPackets('2018 PACE NSC'), 25));
        it('getNumPackets - 2016 NASAT', async () => assert.equal(await getNumPackets('2016 NASAT'), 16));
    });
}

(async () => {
    // Wait for the database to connect
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.time('database.test.js');
    console.log();
    console.log('Begin correctness tests');
    await testCorrectness();
    console.log('End correctness tests');
    console.log();

    console.log('Begin timing tests');
    await testTiming(5);
    console.log('End timing tests');
    console.log();
    console.timeEnd('database.test.js');
})();

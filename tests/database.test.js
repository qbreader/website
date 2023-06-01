const { getQuery, getPacket, getSet, getRandomBonuses, getRandomTossups, getNumPackets, reportQuestion } = require('../database/questions');

async function testTiming(count) {
    const packetNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    console.time('getQuery (empty string)');
    for (let i = 0; i < count; i++) {
        await getQuery({ questionType: 'all', verbose: false });
    }
    console.timeEnd('getQuery (empty string)');

    console.time('getQuery (string = abc)');
    for (let i = 0; i < count; i++) {
        await getQuery({ queryString: 'abc', questionType: 'all', verbose: false });
    }
    console.timeEnd('getQuery (string = abc)');

    console.time('getQuery (string = cesaire), ignore diacritics');
    for (let i = 0; i < count; i++) {
        await getQuery({ queryString: 'cesaire', questionType: 'all', verbose: false, ignoreDiacritics: true });
    }
    console.timeEnd('getQuery (string = cesaire), ignore diacritics');

    console.time('getPacket');
    for (let i = 0; i < count; i++) {
        await getPacket({ setName: '2018 PACE NSC', packetNumber: 5 });
    }
    console.timeEnd('getPacket');

    console.time('getSet');
    for (let i = 0; i < count; i++) {
        await getSet({ setName: '2018 PACE NSC', packetNumbers, questionType: 'bonus' });
    }
    console.timeEnd('getSet');

    console.time('getRandomBonuses');
    for (let i = 0; i < count; i++) {
        await getRandomBonuses();
    }
    console.timeEnd('getRandomBonuses');

    console.time('getRandomTossups');
    for (let i = 0; i < count; i++) {
        await getRandomTossups();
    }
    console.timeEnd('getRandomTossups');

    console.time('reportQuestion');
    for (let i = 0; i < count; i++) {
        await reportQuestion('630020e3cab8fa6d1490b8ea', 'other', 'test');
    }
    console.timeEnd('reportQuestion');
}


async function testCorrectness() {
    {
        const { tossups, bonuses } = await getQuery({ queryString: 'qigong', setName: '2023 ACF Regionals', verbose: false, ignoreDiacritics: true });
        console.assert(tossups && bonuses);
        console.assert(tossups.count === 1, `${tossups.count} != ${1}`);
        console.assert(bonuses.count === 0, `${bonuses.count} != ${0}`);
        console.assert(
            tossups.questionArray[0].question === 'Note to moderator: Read the answerline carefully. A simplified, secular form of this practice is nicknamed “the 24.” Arthur Rosenfeld hosted a PBS program that instructed this practice for longevity and taught that chewing food 36 times can enhance the sensitivity, or “listening power,” outlined in this practice’s “classics.” The last Saturday in April is a worldwide holiday for this practice, whose methods of silk reeling and pushing hands may be attributed to its legendary inventor Zhāng Sānfēng (“jahng sahn-fung”) of the Wǔdāng (“oo-dahng”) Mountains. The Sūn (“swun”) and Yáng lineages are two of the five major styles of this type of nèijiā (“nay-jʼyah”), which originated in Chén (“chun”) Village. Unlike repetitive qìgōng (“chee-gong”), this balance-promoting practice’s “frames” link up to 108 specific postures. For 10 points, the elderly in Kowloon Park often perform what internal martial art whose routines feature slow movements?',
            tossups.questionArray[0].question
        );
        console.assert(
            tossups.questionArray[0].answer === 'tai chi [or tàijíquán or t’ai chi ch’üan; accept shadowboxing; prompt on Chinese martial arts until read; prompt on wǔshù or guóshù or kuoshu; prompt on exercise, physical activity, or meditation; prompt on nèijiā or nèigōng or nèijìng until “nèijiā” is read; prompt on qìgōng, ch‘i kung, chi gung, or chi ‘ung until “qìgōng” is read; prompt on Wǔdāng quán until read; prompt on traditional Chinese medicine or TCM or Zhōngyī; reject “boxing”]',
            tossups.questionArray[0].answer
        );
    }

    {
        const { tossups, bonuses } = await getQuery({ queryString: 'newton', questionType: 'all', setName: '2018 PACE NSC', verbose: false, maxReturnLength: 400 });
        console.assert(tossups && bonuses);
        console.assert(tossups.count === 5, `${tossups.count} != 5`);
        console.assert(bonuses.count === 2, `${bonuses.count} != 2`);
        console.assert(
            tossups.questionArray[0].question === 'A theorem introduced by this man gives a formula to find the radii of four mutually tangent circles. The second book of a work by this mathematician consists of a classification of algebraic curves, including his namesake "folium." This man is the inventor, and sometimes the namesake, of the field of analytic geometry. This man\'s three (*) "laws of nature" were a major influence on Isaac Newton\'s laws of motion. An upper limit on the number of positive roots of a polynomial can be found using this mathematician\'s "rule of signs." In two dimensions, ordered pairs are used to represent the x- and y-coordinates of numbers in his namesake coordinate system. For 10 points, name this French mathematician, who, in a famous work of philosophy, stated "Cogito ergo sum."',
            tossups.questionArray[0].question
        );
        console.assert(
            tossups.questionArray[0].answer === 'René Descartes (day-CART)',
            tossups.questionArray[0].answer
        );
    }

    {
        const { tossups, bonuses } = await getPacket({ setName: '2018 PACE NSC', packetNumber: 5 });
        console.assert(tossups && bonuses);
        console.assert(tossups.length === 21, `${tossups.length} != 21`);
        console.assert(bonuses.length === 21, `${bonuses.length} != 21`);
        console.assert(
            tossups[0].question === 'In his final appearance, this character experiences a severe toothache after asserting "as a weapon I may be of some use. But as a man, I\'m a wreck," then leaves to join King Milan\'s forces. This man buys a painting of two boys fishing, and commissions a portrait, from his fellow expatriate Mihailov. He is shocked to learn that his lover is pregnant between one scene in which he glimpses his rival Makhotin\'s chestnut (*) Gladiator, and another scene in which he rides his own horse Frou-Frou to death. This character first encounters his future lover at a railway station, where a worker is crushed by a train, and is initially interested in Kitty Shcherbatsky. For 10 points, name this Leo Tolstoy character, a nobleman who has an affair with Anna Karenina.',
            tossups[0].question
        );
        console.assert(
            tossups[0].answer === 'Count Alexei (Kirillovich) <b><u>Vronsky</u></b> [prompt on <u>Alexei</u>]',
            tossups[0].answer
        );
        console.assert(
            bonuses[0].leadin === 'The 170 men who rowed each of these ships often came from Piraeus and were thetes, the lowest class of citizen. For 10 points each:',
            bonuses[0].leadin
        );
    }

    {
        const tossups = await getSet({ setName: '2016 NASAT', packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], questionType: 'tossup' });
        const bonuses = await getSet({ setName: '2016 NASAT', packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], questionType: 'bonus' });

        console.assert(tossups.length === 336, `${tossups.length} != 336`);
        console.assert(bonuses.length === 336, `${bonuses.length} != 336`);
        console.assert(
            tossups[0].question === 'Besides his treatise on the Divine Names, the most notable work by Pseudo-Dionysius the Areopagite discusses these things. The phrase "Grigori" refers to some of these things that are heavily described in the apocryphal Books of Enoch. First Corinthians 11 argues that, specifically because of these things, women should wear head coverings when praying or prophesying. Tertullian suggested these things are what created the gigantic Nephilim. In the Talmud, Elisha ben Abuyah declares that there are "two powers in heaven" when he sees one of these things named Metatron. The book of Daniel mentions one of these beings by name, saying he will help fight the princes of Persia and protect Israel. For 10 points, name these celestial figures that include Gabriel and Michael.',
            tossups[0].question
        );
        console.assert(
            tossups[0].answer === '<b><u>angel</u></b>s [or <b><u>archangel</u></b>s; or fallen <b><u>angel</u></b>s; or <b><u>Watcher</u></b>s; or <b><u>mal\'akh</u></b>im; or <b><u>Grigori</u></b> until it is read]',
            tossups[0].answer
        );
        console.assert(
            bonuses[0].leadin === 'In a painting by this artist, a heavily-garlanded Pan sprawls in front of an eagle, flanked by a female personification of Death, who holds a bloody sword, and one of Pain, who wears a crown of thorns. For 10 points each:',
            bonuses[0].leadin
        );
    }

    {
        const number = await getNumPackets('2018 PACE NSC');
        console.assert(number === 25, `${number} != 25`);
    }

    {
        const number = await getNumPackets('2016 NASAT');
        console.assert(number === 16, `${number} != 16`);
    }
}

(async () => {
    // wait for the database to connect
    await new Promise(resolve => setTimeout(resolve, 2000));

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

const { getQuery, getPacket, getSet, getRandomQuestions, getNumPackets } = require('../server/database');

async function testTiming(count) {
    const packetNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    console.time('getQuery');
    for (let i = 0; i < count; i++) {
        await getQuery({ questionType: 'all', verbose: false });
    }
    console.timeEnd('getQuery');

    console.time('getPacket');
    for (let i = 0; i < count; i++) {
        await getPacket({ setName: '2022 PACE NSC', packetNumber: 5 });
    }
    console.timeEnd('getPacket');

    console.time('getSet');
    for (let i = 0; i < count; i++) {
        await getSet({ setName: '2022 PACE NSC', packetNumbers, questionType: 'bonus' });
    }
    console.timeEnd('getSet');

    console.time('getRandomQuestions');
    for (let i = 0; i < count; i++) {
        await getRandomQuestions({ questionType: 'bonus', verbose: false });
    }
    console.timeEnd('getRandomQuestions');
}


async function testCorrectness() {
    {
        const { tossups, bonuses } = await getQuery({ queryString: 'taoism', questionType: 'all', setName: '2022 NASAT', verbose: false, maxReturnLength: 400 });
        console.assert(tossups && bonuses);
        console.assert(tossups.count === 1, `${tossups.count} != 1`);
        console.assert(bonuses.count === 0, `${bonuses.count} != 0`);
        console.assert(tossups.questionArray[0].question === 'Legendarily, red and white variants of this stuff resulted from Guanyin\'s blood and breastmilk. This stuff is depicted beneath a set of "air radicals" in the character for the form of energy called qi (chee). In an origin story for the Dragon Boat Festival, locals dropped this stuff into the river where Qu Yuan (choo yoo-EN) died while attempting to save his body. This stuff, which official records label Zhang Daoling a "thief" of, provides the popular name for a movement that sought to create a state consisting only of "chosen people" under a "Celestial Master." A Han dynasty movement of religious Taoism is often named for the fact that newcomers had to donate "five pecks" of this stuff. At East Asian funerals, this stuff is traditionally offered in a bowl with vertical chopsticks. For 10 points, sake is a wine made from what staple crop grown in paddies?');
    }

    {
        const { tossups, bonuses } = await getPacket({ setName: '2022 PACE NSC', packetNumber: 5 });
        console.assert(tossups && bonuses);
        console.assert(tossups.length === 21, `${tossups.length} != 21`);
        console.assert(bonuses.length === 21, `${bonuses.length} != 21`);
        console.assert(tossups[0].question === 'This character leads a prince away from his hunting expedition to tell him that his father had been pushed down a well three years prior. This character sets all the horses free after learning the low status of his position as "Keeper of the Heavenly Horses." This character writes "The Great Sage Equal to Heaven reached this place" on a pillar, then urinates on it, only to discover that it is a giant (*) finger. This character is born from a stone egg and is taught the "72 transformations" in a novel which is titled for them in Arthur Waley\'s translation. This character earns Buddhahood after retrieving scriptures alongside Sandy, Pigsy, and the monk Xuánzàng ("shwen-zong"). For 10 points, the novel Journey to the West features what legendary primate?');
        console.assert(bonuses[0].leadin === 'This term was coined by law professor William Baude in 2015. For 10 points each:');
    }

    {
        const tossups = await getSet({ setName: '2022 PACE NSC', packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], questionType: 'tossup' });
        const bonuses = await getSet({ setName: '2022 PACE NSC', packetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], questionType: 'bonus' });

        console.assert(tossups.length === 462);
        console.assert(bonuses.length === 468);
        console.assert(tossups[201].question === 'The death of this composer’s close friend Marianne von Genzinger inspired his final piece for solo piano, his Variations in F Minor. Another piece by this composer includes the chorus “The heavens are telling the glory of God,” and opens with a section that switches from C minor to C major on the word “light.” Like Johann Nepomuk Hummel, this composer responded to the invention of the keyed trumpet by writing a trumpet (*) concerto in E-flat major. One of this composer’s Erdödy string quartets provided the melody of Germany’s national anthem. This composer wrote 104 symphonies, which earned him the nickname “The Father of the Symphony.” For 10 points, name this Austrian composer of the Farewell and Surprise symphonies.');
        console.assert(bonuses[201].leadin === 'This country’s folk song “Korobeiniki” became retroactively popular after being used in the theme of the video game Tetris. For 10 points each:');
    }

    {
        const number = await getNumPackets('2022 PACE NSC');
        console.assert(number === 23, `${number} != 23`);
    }

    {
        const number = await getNumPackets('2022 NASAT');
        console.assert(number === 20, `${number} != 20`);
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

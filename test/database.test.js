import 'dotenv/config';

import { mongoClient } from '../database/databases.js';
import getNumPackets from '../database/qbreader/get-num-packets.js';
import getPacket from '../database/qbreader/get-packet.js';
import getQuery from '../database/qbreader/get-query.js';
import getRandomBonuses from '../database/qbreader/get-random-bonuses.js';
import getRandomTossups from '../database/qbreader/get-random-tossups.js';
import getSet from '../database/qbreader/get-set.js';
import reportQuestion from '../database/qbreader/report-question.js';

import { assert } from 'chai';
import mocha from 'mocha';
import { ObjectId } from 'mongodb';

const packetNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

/*
    Note: this.timeout(n) asserts that each `it` block individually takes less then n millisecconds.
    It's inherited by the nested test suites, and can be overriden.
*/

// eslint-disable-next-line no-unused-vars
async function testTiming (count) {
  return mocha.describe(`Performance Tests with ${count} repetitions`, function () {
    /*
        The "formula" for the timing was done by replicating the request on the website,
        and multiplying the execution time by 2 or 3 (usually), and the "count" parameter
        */
    function testRequest (name, timeout, func, params = false) {
      mocha.it(`${name} (under ${timeout * count}ms)`, async function () {
        this.timeout(timeout * count);
        for (let i = 0; i < count; i++) {
          await func(params);
        }
      });
    }
    mocha.describe('getQuery', () => {
      testRequest('empty string', 800, getQuery, { questionType: 'all', verbose: false });
      testRequest('"abc"', 2000, getQuery, { queryString: 'abc', questionType: 'all', verbose: false });
      testRequest('"abc", return length 401', 3000, getQuery, { queryString: 'abc', questionType: 'all', verbose: false, maxReturnLength: 401 });
      testRequest('"([aàáâǎäãåāăạả](b*)[cçćčɔ́ĉƈ]+?.*){1,}", regex', 5000, getQuery, { queryString: '([aàáâǎäãåāăạả](b*)[cçćčɔ́ĉƈ]+?.*){1,}', questionType: 'all', verbose: false, regex: true });
      testRequest('"cesaire", ignore diacritics"', 8000, getQuery, { queryString: 'cesaire', questionType: 'all', verbose: false });
    });
    mocha.describe('getPacket', () => {
      testRequest('2018 PACE NSC', 400, getPacket, { setName: '2018 PACE NSC', packetNumber: 5 });
    });
    mocha.describe('getSet', () => {
      testRequest('2018 PACE NSC', 1000, getSet, { setName: '2018 PACE NSC', packetNumbers, questionType: 'bonus' });
      testRequest('Invalid set name', 100, getSet, { setName: '(￣y▽￣)╭', packetNumbers, questionType: 'bonus' });
    });
    mocha.describe('Random Functions', () => {
      testRequest('getRandomBonuses', 2000, getRandomBonuses);
      testRequest('getRandomTossups', 2000, getRandomTossups);
    });
    // The report function can't use tests requests because it requires more then one parameter :(
    mocha.describe('reportQuestion', () => {
      mocha.it('reportQuestion', async () => {
        const results = [];
        for (let i = 0; i < count; i++) {
          results.push(reportQuestion(new ObjectId('630020e3cab8fa6d1490b8ea'), 'other', 'test'));
        }
        await Promise.all(results);
      });
    });
  });
}

async function testCorrectness () {
  return mocha.describe('Correctness Tests', function () {
    this.timeout(0);

    function testQuery (testName, params, tossupCount, bonusCount, expectedFirstTossupId) {
      mocha.it(testName, async () => {
        const { tossups, bonuses } = await getQuery(params);
        assert.isOk(tossups, 'tossups');
        assert.isOk(bonuses, 'bonuses');
        assert.propertyVal(tossups, 'count', tossupCount, 'tossup count');
        assert.propertyVal(bonuses, 'count', bonusCount, 'bonus count');
        assert.deepEqual(tossups.questionArray[0]._id, expectedFirstTossupId, 'tossup array - _id');
      });
    }
    {
      const _id = new ObjectId('63d6dbb47c00e8c6f8d886db');
      testQuery('getQuery - "qigong", 2023 ACF Regionals, ignore diacritics',
        { queryString: 'qigong', setName: '2023 ACF Regionals', verbose: false }, 1, 0, _id);
    }
    {
      const _id = new ObjectId('62ec4057d6777289bcae8215');
      testQuery('getQuery - "newton", all questions, 2018 PACE NSC, return length = 400',
        { queryString: 'newton', questionType: 'all', setName: '2018 PACE NSC', verbose: false, maxReturnLength: 400 },
        5, 2, _id);
    }
    {
      const _id = new ObjectId('62ec4057d6777289bcae8215');
      testQuery('getQuery - "newton", math alternate_subcategory, 2018 PACE NSC, return length = 400',
        { queryString: 'newton', questionType: 'all', setName: '2018 PACE NSC', verbose: false, maxReturnLength: 400, subcategories: ['Other Science'], alternateSubcategories: ['Math'] },
        2, 0, _id);
    }

    function testGetPacket (testName, params, tossupCount, bonusCount, expectedFirstTossupId, expectedFirstBonusId) {
      mocha.it(testName, async () => {
        const packet = await getPacket({ ...params, questionType: 'tossup' });
        const { tossups, bonuses } = packet;

        assert.isOk(tossups, 'tossups');
        assert.isOk(bonuses, 'bonuses');
        assert.propertyVal(tossups, 'length', tossupCount, 'tossup count');
        assert.propertyVal(bonuses, 'length', bonusCount, 'bonus count');
        assert.deepEqual(tossups[0]._id, expectedFirstTossupId, 'tossups - _id');
        assert.deepEqual(bonuses[0]._id, expectedFirstBonusId, 'bonuses - _id');
      });
    }
    {
      const tossupId = new ObjectId('62ec4057d6777289bcae82bf');
      const bonusId = new ObjectId('62ec4057d6777289bcae82d4');
      testGetPacket('getPacket - 2018 PACE NSC, Packet 5', { setName: '2018 PACE NSC', packetNumber: 5 }, 21, 21, tossupId, bonusId);
    }

    function testGetSet (testName, params, tossupCount, bonusCount, expectedFirstTossupId, expectedFirstBonusId) {
      mocha.it(testName, async () => {
        const tossups = await getSet({ ...params, questionType: 'tossup' });
        const bonuses = await getSet({ ...params, questionType: 'bonus' });

        assert.isOk(tossups, 'tossups');
        assert.isOk(bonuses, 'bonuses');
        assert.propertyVal(tossups, 'length', tossupCount, 'tossup count');
        assert.propertyVal(bonuses, 'length', bonusCount, 'bonus count');
        assert.deepEqual(tossups[0]._id, expectedFirstTossupId, 'tossups - _id');
        assert.deepEqual(bonuses[0]._id, expectedFirstBonusId, 'bonuses - _id');
      });
    }

    {
      const tossupId = new ObjectId('630020e3cab8fa6d1490b8d5');
      const bonusId = new ObjectId('630020e3cab8fa6d1490b8ea');
      testGetSet('getSet - 2016 NASAT', { setName: '2016 NASAT', packetNumbers }, 336, 336, tossupId, bonusId);
    }

    mocha.it('getNumPackets - 2018 PACE NSC', async () => assert.equal(await getNumPackets('2018 PACE NSC'), 25));
    mocha.it('getNumPackets - 2016 NASAT', async () => assert.equal(await getNumPackets('2016 NASAT'), 16));

    mocha.it('getRandomBonuses', async () => {
      const bonuses = await getRandomBonuses();
      assert.isOk(bonuses, 'bonuses');
    });

    mocha.it('getRandomTossups', async () => {
      const tossups = await getRandomTossups();
      assert.isOk(tossups, 'tossups');
    });
  });
}

mocha.before(async () => {
  await mongoClient.connect();
});

testCorrectness();
// testTiming(1);

mocha.after(async () => {
  await mongoClient.close();
});

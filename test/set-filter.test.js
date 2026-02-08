import 'dotenv/config';

import { mongoClient } from '../database/databases.js';
import getQuery from '../database/qbreader/get-query.js';

import { assert } from 'chai';
import mocha from 'mocha';

mocha.describe('Set Name Filtering', function () {
  this.timeout(0);

  mocha.before(async () => {
    await mongoClient.connect();
  });

  mocha.after(async () => {
    await mongoClient.close();
  });

  mocha.it('should filter by single set name', async () => {
    const result = await getQuery({
      questionType: 'all',
      verbose: false,
      setName: ['2023 ACF Regionals']
    });
    assert.isOk(result.tossups, 'tossups');
    assert.isOk(result.bonuses, 'bonuses');
    assert.isAbove(result.tossups.count, 0, 'should have tossups');
    // Verify all results match the pattern (case-insensitive)
    if (result.tossups.questionArray.length > 0) {
      const setNames = result.tossups.questionArray.map(q => q.set.name);
      assert.isTrue(setNames.every(name => /2023 ACF Regionals/i.test(name)));
    }
  });

  mocha.it('should filter by multiple comma-separated set names', async () => {
    const result = await getQuery({
      questionType: 'all',
      verbose: false,
      setName: ['2023 ACF Regionals', '2023 ACF Fall']
    });
    assert.isOk(result.tossups, 'tossups');
    assert.isOk(result.bonuses, 'bonuses');
    assert.isAbove(result.tossups.count, 0, 'should have tossups');
    // Verify results match one of the patterns
    if (result.tossups.questionArray.length > 0) {
      const setNames = result.tossups.questionArray.map(q => q.set.name);
      assert.isTrue(setNames.every(name => 
        /2023 ACF Regionals/i.test(name) || /2023 ACF Fall/i.test(name)
      ));
    }
  });

  mocha.it('should filter by regex pattern', async () => {
    const result = await getQuery({
      questionType: 'all',
      verbose: false,
      setName: ['2023 ACF (Fall|Regionals)']
    });
    assert.isOk(result.tossups, 'tossups');
    assert.isOk(result.bonuses, 'bonuses');
    assert.isAbove(result.tossups.count, 0, 'should have tossups');
    // Verify results are from ACF Fall or Regionals
    if (result.tossups.questionArray.length > 0) {
      const setNames = result.tossups.questionArray.map(q => q.set.name);
      assert.isTrue(setNames.every(name =>
        name.includes('2023 ACF Fall') || name.includes('2023 ACF Regionals')
      ));
    }
  });

  mocha.it('should filter by regex pattern with character class', async () => {
    const result = await getQuery({
      questionType: 'all',
      verbose: false,
      setName: ['ACF [FWR]']
    });
    assert.isOk(result.tossups, 'tossups');
    assert.isOk(result.bonuses, 'bonuses');
    assert.isAbove(result.tossups.count, 0, 'should have tossups');
    // Verify results match the pattern
    if (result.tossups.questionArray.length > 0) {
      const setNames = result.tossups.questionArray.map(q => q.set.name);
      // Should match ACF Fall, ACF Winter, or ACF Regionals
      assert.isTrue(setNames.every(name => /ACF [FWR]/.test(name)));
    }
  });

  mocha.it('should filter by partial set name', async () => {
    const result = await getQuery({
      questionType: 'all',
      verbose: false,
      setName: ['ACF Fall']
    });
    assert.isOk(result.tossups, 'tossups');
    assert.isOk(result.bonuses, 'bonuses');
    assert.isAbove(result.tossups.count, 0, 'should have tossups');
    // Verify all results contain "ACF Fall" (case-insensitive)
    if (result.tossups.questionArray.length > 0) {
      const setNames = result.tossups.questionArray.map(q => q.set.name);
      assert.isTrue(setNames.every(name => /ACF Fall/i.test(name)));
    }
  });

  mocha.it('should combine regex patterns with commas', async () => {
    const result = await getQuery({
      questionType: 'all',
      verbose: false,
      setName: ['2023 ACF [FR]', '2024 PACE NSC']
    });
    assert.isOk(result.tossups, 'tossups');
    assert.isOk(result.bonuses, 'bonuses');
    assert.isAbove(result.tossups.count, 0, 'should have tossups');
  });

  mocha.it('should work with search query and set filter', async () => {
    const result = await getQuery({
      queryString: 'newton',
      questionType: 'all',
      verbose: false,
      setName: ['2018 PACE NSC']
    });
    assert.isOk(result.tossups, 'tossups');
    assert.isOk(result.bonuses, 'bonuses');
    // Should have results from 2018 PACE NSC that mention "newton"
    if (result.tossups.questionArray.length > 0) {
      const setNames = result.tossups.questionArray.map(q => q.set.name);
      assert.isTrue(setNames.every(name => /2018 PACE NSC/i.test(name)));
    }
  });
});

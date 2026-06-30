import test from 'node:test';
import assert from 'node:assert/strict';
import getBonusPartLabel from '../client/scripts/utilities/get-bonus-part-label.js';

test('returns default value and empty difficulty when bonus is undefined', () => {
  assert.equal(getBonusPartLabel(undefined, 0), '[10]');
});

test('uses bonus value when present', () => {
  const bonus = { values: [15, 10, 5] };
  assert.equal(getBonusPartLabel(bonus, 0), '[15]');
  assert.equal(getBonusPartLabel(bonus, 2), '[5]');
});

test('uses difficultyModifier when present', () => {
  const bonus = { values: [10, 10, 10], difficultyModifiers: ['e', 'm', 'h'] };
  assert.equal(getBonusPartLabel(bonus, 0), '[10e]');
  assert.equal(getBonusPartLabel(bonus, 2), '[10h]');
});

test('falls back to defaultValue when index has no value', () => {
  const bonus = { values: [10] };
  assert.equal(getBonusPartLabel(bonus, 5), '[10]');
});

test('uses custom defaultValue and defaultDifficulty', () => {
  assert.equal(getBonusPartLabel(undefined, 0, 20, 'e'), '[20e]');
});

test('returns label with no difficulty when difficultyModifiers absent', () => {
  const bonus = { values: [10, 10, 10] };
  assert.equal(getBonusPartLabel(bonus, 1), '[10]');
});

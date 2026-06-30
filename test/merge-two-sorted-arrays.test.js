import test from 'node:test';
import assert from 'node:assert/strict';
import mergeTwoSortedArrays from '../server/merge-two-sorted-arrays.js';

const byId = x => x.id;
const keepFirst = (a, _b) => a;
const sumValues = (a, b) => ({ id: a.id, v: a.v + b.v });

test('merges two non-overlapping sorted arrays', () => {
  const a = [{ id: 1 }, { id: 3 }];
  const b = [{ id: 2 }, { id: 4 }];
  const result = mergeTwoSortedArrays(a, b, byId, keepFirst);
  assert.deepEqual(result.map(x => x.id), [1, 2, 3, 4]);
});

test('combines elements with duplicate keys via combineFunction', () => {
  const a = [{ id: 1, v: 10 }, { id: 2, v: 20 }];
  const b = [{ id: 2, v: 5 }, { id: 3, v: 30 }];
  const result = mergeTwoSortedArrays(a, b, byId, sumValues);
  assert.deepEqual(result, [{ id: 1, v: 10 }, { id: 2, v: 25 }, { id: 3, v: 30 }]);
});

test('returns copy of array1 when array2 is empty', () => {
  const a = [{ id: 1 }, { id: 2 }];
  const result = mergeTwoSortedArrays(a, [], byId, keepFirst);
  assert.deepEqual(result.map(x => x.id), [1, 2]);
});

test('returns copy of array2 when array1 is empty', () => {
  const b = [{ id: 5 }, { id: 7 }];
  const result = mergeTwoSortedArrays([], b, byId, keepFirst);
  assert.deepEqual(result.map(x => x.id), [5, 7]);
});

test('returns empty array when both inputs are empty', () => {
  const result = mergeTwoSortedArrays([], [], byId, keepFirst);
  assert.deepEqual(result, []);
});

test('handles single-element arrays', () => {
  const result = mergeTwoSortedArrays([{ id: 3 }], [{ id: 1 }], byId, keepFirst);
  assert.deepEqual(result.map(x => x.id), [1, 3]);
});

/**
 * Merge two sorted arrays into a single sorted array.
 * The two arrays should be sorted by the key function.
 * @template T
 * @param {T[]} array1
 * @param {T[]} array2
 * @param {(arg: T) => number} keyFunction - the function to extract the key from each element.
 * @param {(arg1: T, arg2: T) => T} combineFunction - the function to combine two elements with the same key.
 * @returns {T[]} The merged array.
 */
export default function mergeTwoSortedArrays (array1, array2, keyFunction, combineFunction) {
  const mergedArray = [];
  let i = 0;
  let j = 0;

  while (i < array1.length && j < array2.length) {
    const key1 = keyFunction(array1[i]);
    const key2 = keyFunction(array2[j]);
    if (key1 < key2) {
      mergedArray.push(array1[i]);
      i++;
    } else if (key1 > key2) {
      mergedArray.push(array2[j]);
      j++;
    } else {
      mergedArray.push(combineFunction(array1[i], array2[j]));
      i++;
      j++;
    }
  }

  while (i < array1.length) {
    mergedArray.push(array1[i]);
    i++;
  }

  while (j < array2.length) {
    mergedArray.push(array2[j]);
    j++;
  }

  return mergedArray;
}

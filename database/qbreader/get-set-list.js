import { sets } from './collections.js';

/**
 * @returns {Promise<string[]>} an array of all the set names.
 */
async function getSetList() {
    let setList = await sets.find(
        {},
        { projection: { _id: 0, year: 1, name: 1 }, sort: { year: -1, name: 1 } },
    ).toArray();
    setList = setList.map(set => set.name);
    return setList;
}

export default getSetList;

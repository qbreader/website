import upsertPacket from './upsert-packet.js';
import { sets } from '../../database/qbreader/collections.js';

import * as fs from 'fs';
import { ObjectId } from 'mongodb';

/**
 *
 * @param {string} setName
 * @param {number} difficulty - the difficulty of the set, as a number from 0 to 10. This parameter is ignored if the set already exists.
 * @param {object} params
 * @param {boolean} [params.preserveCategory=false] - whether to preserve the category of existing questions of tossups and bonuses. Defaults to `false`.
 * @param {boolean} [params.standard] - whether the set is a standard set. Defaults to true. This parameter is ignored if the set already exists.
 * @param {boolean} [params.zeroIndexQuestions=false] - whether question numbering starts at 0 or 1. Defaults to 1 (i.e. zeroIndexQuestions = false).
 * @param {string} [params.folderPath='./'] - the folder that the set is in. Defaults to the current directory.
 * @returns {Promise<boolean>} whether the set existed before updating
 */
export default async function upsertSet (setName, difficulty, { preserveCategory = false, standard = true, zeroIndexQuestions = false, folderPath = './' } = {}) {
  let setAlreadyExists = await sets.countDocuments({ name: setName });
  setAlreadyExists = !!setAlreadyExists;

  if (!setAlreadyExists && (difficulty === undefined || difficulty === null || typeof difficulty !== 'number')) {
    throw new Error(`Set ${setName} does not exist and difficulty ${difficulty} is invalid`);
  }

  if (!setAlreadyExists) {
    console.log(`Set ${setName} does not exist`);
    setAlreadyExists = false;
    await sets.insertOne({ _id: new ObjectId(), name: setName, year: parseInt(setName.slice(0, 4)), difficulty, standard });
  }

  let packetNumber = 0;

  for (const fileName of fs.readdirSync(`${folderPath}/${setName}`).sort()) {
    if (!fileName.endsWith('.json')) {
      return;
    }

    const packetName = fileName.slice(0, -5);
    packetNumber++;

    await upsertPacket({ setName, packetName, packetNumber, preserveCategory, zeroIndexQuestions, folderPath: `${folderPath}/${setName}` });
  }

  return setAlreadyExists;
}

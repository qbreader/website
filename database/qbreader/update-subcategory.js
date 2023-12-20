import { tossups, tossupData, bonuses, bonusData } from './collections.js';

import { SUBCATEGORY_TO_CATEGORY } from '../../constants.js';

/**
 *
 * @param {ObjectId} _id the id of the question to update
 * @param {'tossup' | 'bonus'} type the type of question to update
 * @param {string} subcategory the new subcategory to set
 * @param {boolean} [clearReports=true] whether to clear the reports field
 * @returns {Promise<UpdateResult>}
 */
async function updateSubcategory(_id, type, subcategory, clearReports = true) {
    if (!(subcategory in SUBCATEGORY_TO_CATEGORY)) {
        console.log(`Subcategory ${subcategory} not found`);
        return;
    }

    const category = SUBCATEGORY_TO_CATEGORY[subcategory];
    const updateDoc = { $set: { category, subcategory, updatedAt: new Date() } };

    if (clearReports)
        updateDoc.$unset = { reports: 1 };

    switch (type) {
    case 'tossup':
        tossupData.updateMany({ tossup_id: _id }, { $set: { category, subcategory } });
        return await tossups.updateOne({ _id }, updateDoc);
    case 'bonus':
        bonusData.updateMany({ bonus_id: _id }, { $set: { category, subcategory } });
        return await bonuses.updateOne({ _id }, updateDoc);
    }
}

export default updateSubcategory;

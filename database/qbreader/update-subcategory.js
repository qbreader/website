import { tossups, tossupData, bonuses, bonusData } from './collections.js';
import getBonus from './get-bonus.js';
import getTossup from './get-tossup.js';

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
    const updateDoc = {
        $set: {
            category,
            subcategory,
            updatedAt: new Date(),
        },
        $unset: {},
    };

    if (clearReports) {
        updateDoc.$unset.reports = 1;
    }

    switch (type) {
    case 'tossup': {
        const tossup = await getTossup(_id);

        if (tossup.subcategory !== subcategory) {
            updateDoc.$unset.alternate_subcategory = 1;
        }

        tossupData.updateMany({ tossup_id: _id }, { $set: { category, subcategory } });
        return await tossups.updateOne({ _id }, updateDoc);
    }
    case 'bonus': {
        const bonus = await getBonus(_id);

        if (bonus.subcategory !== subcategory) {
            updateDoc.$unset.alternate_subcategory = 1;
        }

        bonusData.updateMany({ bonus_id: _id }, { $set: { category, subcategory } });
        return await bonuses.updateOne({ _id }, updateDoc);
    }
    }
}

export default updateSubcategory;

import { buzzes, tossups } from './collections.js';

import getUsername from '../account-info/get-username.js';

async function getProtests(packetName, division) {
    const protests = await buzzes.find(
        { 'packet.name': packetName, division, pendingProtest: { $exists: true } },
        { sort: { questionNumber: 1 } },
    ).toArray();

    const packet = await tossups.find(
        { 'packet.name': packetName, division },
        { sort: { questionNumber: 1 } },
    ).toArray();

    for (const index in protests) {
        const user_id = protests[index].user_id;
        protests[index].username = await getUsername(user_id);
    }

    return { protests, packet };
}

export default getProtests;

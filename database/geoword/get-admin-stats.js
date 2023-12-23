import { buzzes } from './collections.js';

import getUsername from '../account-info/get-username.js';

async function getAdminStats(packetName, division) {
    const stats = await buzzes.aggregate([
        { $match: { 'packet.name': packetName, division, active: true } },
        { $addFields: { isCorrect: { $gt: ['$points', 0] } } },
        { $addFields: { correctCelerity: { $cond: ['$isCorrect', '$celerity', undefined ] } } },
        { $sort: { correctCelerity: -1 } },
        { $group: {
            _id: '$questionNumber',
            averageCorrectCelerity: { $avg: '$correctCelerity' },
            averagePoints: { $avg: '$points' },
            bestCelerity: { $max: '$correctCelerity' },
            bestUserId: { $first: '$user_id' },
            numberCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            questionNumber: { $first: '$questionNumber' },
            timesHeard: { $sum: 1 },
        } },
        { $sort: { _id: 1 } },
        { $lookup: {
            from: 'tossups',
            let: { questionNumber: '$questionNumber', packet: { name: packetName }, division },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ['$questionNumber', '$$questionNumber'] },
                    { $eq: ['$packet.name', '$$packet.name'] },
                    { $eq: ['$division', '$$division'] },
                ] } } },
            ],
            as: 'tossup',
        } },
        { $unwind: '$tossup' },
    ]).toArray();

    for (const index in stats) {
        const question = stats[index];
        question.bestUsername = await getUsername(question.bestUserId);
    }

    return stats;
}

export default getAdminStats;

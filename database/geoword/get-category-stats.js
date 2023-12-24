import { buzzes } from './collections.js';

import getUsername from '../account-info/get-username.js';

async function getCategoryStats(packetName, division) {
    const leaderboard = await buzzes.aggregate([
        { $match: { 'packet.name': packetName, division, active: true } },
        { $addFields: { isCorrect: { $gt: ['$points', 0] } } },
        { $addFields: { correctCelerity: { $cond: ['$isCorrect', '$celerity', undefined ] } } },
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
        { $addFields: { category: '$tossup.category' } },
        { $group: {
            _id: { category: '$category', user_id: '$user_id' },
            averageCelerity: { $avg: '$correctCelerity' },
            averagePoints: { $avg: '$points' },
            points: { $sum: '$points' },
            number: { $sum: 1 },
        } },
        { $sort: { points: -1 } },
        { $group: {
            _id: '$_id.category',
            averageCorrectCelerity: { $avg: '$averageCelerity' },
            averagePoints: { $avg: '$averagePoints' },
            bestUserId: { $first: '$_id.user_id' },
            bestPoints: { $max: '$points' },
            number: { $max: '$number' },
        } },
        { $addFields: {
            category: '$_id',
            bestPoints: { $divide: ['$bestPoints', '$number'] },
        } },
        { $sort: { 'category': 1 } },
    ]).toArray();

    for (const question of leaderboard) {
        question.bestUsername = await getUsername(question.bestUserId);
    }

    return leaderboard;
}

export default getCategoryStats;

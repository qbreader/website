import { buzzes } from './collections.js';
import getCategoryStats from './get-category-stats.js';
import getDivisionChoice from './get-division-choice.js';

async function getUserCategoryStats(packetName, user_id) {
    const division = await getDivisionChoice(packetName, user_id);
    const leaderboard = await getCategoryStats(packetName, division);

    const userStats = await buzzes.aggregate([
        { $match: { 'packet.name': packetName, division, user_id } },
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
            _id: { category: '$category' },
            averageCelerity: { $avg: '$correctCelerity' },
            averagePoints: { $avg: '$points' },
        } },
        { $addFields: { category: '$_id' } },
        { $sort: { 'category': 1 } },
    ]).toArray();

    return { division, leaderboard, userStats };
}

export default getUserCategoryStats;

import { packets, sets } from './collections.js';

import isAdminById from '../account-info/is-admin-by-id.js';

async function getManagedPacketList (userId) {
  const filter = (await isAdminById(userId))
    ? {}
    : { 'set._id': { $in: (await sets.find({ specialUsers: userId }, { projection: { _id: 1 } }).toArray()).map(set => set._id) } };

  return await packets.aggregate([
    { $match: filter },
    { $lookup: { from: 'sets', localField: 'set._id', foreignField: '_id', as: 'setInfo' } },
    { $sort: { 'setInfo.order': 1, name: 1 } },
    { $project: { name: 1, divisions: 1, test: 1, _id: 0 } }
  ], { collation: { locale: 'en', numericOrdering: true } }).toArray();
}

export default getManagedPacketList;

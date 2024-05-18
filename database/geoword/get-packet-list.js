import { packets } from './collections.js';

async function getPacketList () {
  return await packets.find(
    { test: { $ne: true } },
    {
      sort: { order: 1 },
      projection: { name: 1, divisions: 1, _id: 0 }
    }
  ).toArray();
}

export default getPacketList;

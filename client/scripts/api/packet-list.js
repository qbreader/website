/**
 * Retrieves the list of packets for a given set name, sorted by packet number.
 *
 * @param {string} setName - The name of the set to retrieve packets from.
 * @returns {Promise<{number: number, name: string}[]>} A promise that resolves to an array of packet objects, each containing a number and name.
 */
export default async function getPacketList (setName) {
  if (!setName) { return []; }

  const response = await fetch('/api/packet-list?' + new URLSearchParams({ setName }));
  const data = await response.json();
  return data.packetList;
}

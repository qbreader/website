export default async function getMaxPacketNumber (setNames) {
  const response = await fetch('/api/max-packet-number?', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setNames })
  });
  const data = await response.json();
  return data.maxPacketNumber;
}

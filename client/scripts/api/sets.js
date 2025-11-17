export default async function getSets ({ setNames, packetNumbers, questionType = 'tossup' }) {
  return await fetch('/api/sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setNames, packetNumbers, questionType })
  })
    .then(response => response.json())
    .then(response => response.questions);
}

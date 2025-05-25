const setId = new URLSearchParams(window.location.search).get('_id');
fetch('/api/db-explorer/packet-metadata?' + new URLSearchParams({ setId }))
  .then(res => res.json())
  .then(data => {
    document.getElementById('set-name').textContent = data.setName;
    return data.data;
  })
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    data.forEach(({ _id, packetName, packetNumber, tossupCount, bonusCount }) => {
      const row = table.insertRow(-1);
      row.insertCell(-1).textContent = packetNumber;
      const a = document.createElement('a');
      a.href = `./packet?_id=${_id}`;
      a.textContent = packetName;
      row.insertCell(-1).appendChild(a);
      row.insertCell(-1).textContent = tossupCount;
      row.insertCell(-1).textContent = bonusCount;
    });
  });

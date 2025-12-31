await fetch('/api/db-explorer/set-metadata?' + new URLSearchParams({ includeCounts: false }))
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    data.forEach(({ _id, setName, difficulty, standard }) => {
      const row = table.insertRow(-1);
      const a = document.createElement('a');
      a.href = `../set/?_id=${_id}`;
      a.textContent = setName;
      row.insertCell(-1).appendChild(a);
      row.insertCell(-1).textContent = difficulty;
      row.insertCell(-1).textContent = standard;
      row.insertCell(-1).textContent = '-';
      row.insertCell(-1).textContent = '-';
      row.insertCell(-1).textContent = '-';
    });
  });

fetch('/api/db-explorer/set-metadata?' + new URLSearchParams({ includeCounts: true }))
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    const rows = table.rows;
    for (let i = 0; i < data.length; i++) {
      rows[i].cells[3].textContent = data[i].packetsCount;
      rows[i].cells[4].textContent = data[i].tossupsCount;
      rows[i].cells[5].textContent = data[i].bonusesCount;
    }
  });

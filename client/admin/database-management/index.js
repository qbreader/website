fetch('/api/admin/set-metadata-list?')
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    data.forEach(({ setName, difficulty, standard, packetCount, tossupCount, bonusCount }) => {
      const row = table.insertRow(-1);
      const a = document.createElement('a');
      a.href = `./set?name=${setName}`;
      a.textContent = setName;
      row.insertCell(-1).appendChild(a);
      row.insertCell(-1).textContent = difficulty;
      row.insertCell(-1).textContent = standard;
      row.insertCell(-1).textContent = packetCount;
      row.insertCell(-1).textContent = tossupCount;
      row.insertCell(-1).textContent = bonusCount;
    });
  });

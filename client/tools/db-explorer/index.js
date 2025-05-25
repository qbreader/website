fetch('/api/db-explorer/set-metadata?')
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    data.forEach(({ _id, setName, difficulty, standard, packetCount, tossupCount, bonusCount }) => {
      const row = table.insertRow(-1);
      const a = document.createElement('a');
      a.href = `./set?_id=${_id}`;
      a.textContent = setName;
      row.insertCell(-1).appendChild(a);
      row.insertCell(-1).textContent = difficulty;
      row.insertCell(-1).textContent = standard;
      row.insertCell(-1).textContent = packetCount;
      row.insertCell(-1).textContent = tossupCount;
      row.insertCell(-1).textContent = bonusCount;
    });
  });

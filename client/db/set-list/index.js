await fetch('/api/set-list?' + new URLSearchParams({ expand: true }))
  .then(res => res.json())
  .then(({ setList }) => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    setList.forEach(({ _id, setName, difficulty, standard }) => {
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

fetch('/api/set-list?' + new URLSearchParams({ expand: true, includeCounts: true }))
  .then(res => res.json())
  .then(({ setList }) => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    const rows = table.rows;
    for (let i = 0; i < setList.length; i++) {
      rows[i].cells[3].textContent = setList[i].packetsCount;
      rows[i].cells[4].textContent = setList[i].tossupsCount;
      rows[i].cells[5].textContent = setList[i].bonusesCount;
    }
  });

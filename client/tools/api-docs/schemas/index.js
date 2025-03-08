function getTossupExample () {
  fetch('/api/random-tossup')
    .then(res => res.json())
    .then(data => data.tossups[0])
    .then(data => {
      document.getElementById('tossupExample').textContent = JSON.stringify(data, null, 4);
    });
}

function getBonusExample () {
  fetch('/api/random-bonus')
    .then(res => res.json())
    .then(data => data.bonuses[0])
    .then(data => {
      document.getElementById('bonusExample').textContent = JSON.stringify(data, null, 4);
    });
}

getTossupExample();
getBonusExample();

document.getElementById('get-tossup-example').addEventListener('click', getTossupExample);
document.getElementById('get-bonus-example').addEventListener('click', getBonusExample);

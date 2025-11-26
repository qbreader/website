if (window.localStorage.getItem('font-size')) {
  document.getElementById('font-size').value = window.localStorage.getItem('font-size');
  document.getElementById('font-size-display').textContent = window.localStorage.getItem('font-size');
}

if (window.localStorage.getItem('database-font-size') === 'true') {
  document.getElementById('toggle-database-font-size').checked = true;
}

if (window.localStorage.getItem('high-contrast-question-text') === 'true') {
  document.getElementById('toggle-high-contrast-question-text').checked = true;
}

if (window.localStorage.getItem('sound-effects') === 'true') {
  document.getElementById('toggle-sound-effects').checked = true;
}

document.getElementById('font-size').addEventListener('input', function () {
  window.localStorage.setItem('font-size', this.value);
  document.getElementById('font-size-display').textContent = this.value;
});

document.getElementById('toggle-database-font-size').addEventListener('click', function () {
  this.blur();
  if (this.checked) {
    window.localStorage.setItem('database-font-size', 'true');
  } else {
    window.localStorage.removeItem('database-font-size');
  }
});

document.getElementById('toggle-high-contrast-question-text').addEventListener('click', function () {
  this.blur();
  if (this.checked) {
    window.localStorage.setItem('high-contrast-question-text', 'true');
  } else {
    window.localStorage.removeItem('high-contrast-question-text');
  }
});

document.getElementById('toggle-sound-effects').addEventListener('click', function () {
  this.blur();
  if (this.checked) {
    window.localStorage.setItem('sound-effects', 'true');
  } else {
    window.localStorage.removeItem('sound-effects');
  }
});

document.getElementById('multiplayer-name').addEventListener('input', function () {
  window.localStorage.setItem('multiplayer-username', this.value);
});

document.getElementById('multiplayer-name').value = window.localStorage.getItem('multiplayer-username') || '';

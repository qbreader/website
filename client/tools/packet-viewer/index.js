import bonusToHTML from '../../scripts/bonus-to-html.js';
import tossupToHTML from '../../scripts/tossup-to-html.js';

document.getElementById('file-input').addEventListener('change', function (e) {
  e.preventDefault();
  e.stopPropagation();

  const file = this.files[0];
  if (!file) { return; }

  document.getElementById('file-output').textContent = '';
  const reader = new window.FileReader();
  reader.onload = function (e) {
    try {
      const packet = JSON.parse(e.target.result);
      for (const [i, tossup] of packet.tossups.entries()) {
        if (!tossup.number) { tossup.number = i + 1; }
        document.getElementById('file-output').appendChild(tossupToHTML(tossup));
        document.getElementById('file-output').appendChild(document.createElement('hr'));
      }
      for (const [i, bonus] of packet.bonuses.entries()) {
        if (!bonus.number) { bonus.number = i + 1; }
        document.getElementById('file-output').appendChild(bonusToHTML(bonus));
        document.getElementById('file-output').appendChild(document.createElement('hr'));
      }
      this.value = null;
    } catch (error) {
      window.alert('Invalid packet format');
      throw error;
    }
  };
  reader.readAsText(file);
});

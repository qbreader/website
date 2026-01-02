/* globals JSZip, saveAs */

function parseDoNotReadToDirective (text) {
  const regex = /.*Do not read to ([^.]*).*/;
  const match = text.match(regex);
  return match?.at(1)?.replace(/ /, '-');
}

document.getElementById('submit').addEventListener('click', function (e) {
  e.preventDefault();
  e.stopPropagation();

  const files = document.getElementById('file-input').files;
  const file = files[0];
  if (!file) { return; }

  const zip = new JSZip();
  const reader = new window.FileReader();
  reader.onload = function (e) {
    try {
      const packet = JSON.parse(e.target.result);
      for (const [index, tossup] of packet.tossups.entries()) {
        const team = parseDoNotReadToDirective(tossup.question);
        const filename = `TB-Tossup-${index + 1}${team ? `-${team}` : ''}.json`;
        const data = { tossups: [tossup], bonuses: [] };
        zip.file(filename, JSON.stringify(data, null, 4));
      }
      for (const [index, bonus] of packet.bonuses.entries()) {
        const team = parseDoNotReadToDirective(bonus.leadin);
        const filename = `TB-Bonus-${index + 1}${team ? `-${team}` : ''}.json`;
        const data = { tossups: [], bonuses: [bonus] };
        zip.file(filename, JSON.stringify(data, null, 4));
      }
      zip.generateAsync({ type: 'blob' }).then(content => saveAs(content, 'individual-tbs.zip'));
    } catch (error) {
      window.alert('Invalid packet format');
      throw error;
    }
  };
  reader.readAsText(file);
});

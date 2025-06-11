/* global JSZip, saveAs */
import Parser from 'https://cdn.jsdelivr.net/npm/qb-packet-parser/dist/main.browser.mjs';

let zip;

function createDownloadGroupItem (data, filename) {
  const { tossups, bonuses } = data;
  const a = document.createElement('a');
  a.className = 'list-group-item list-group-item-action';
  a.download = filename;
  a.href = '#';
  a.target = '_blank';
  a.textContent = `${filename} - ${tossups.length} tossups, ${bonuses.length} bonuses`;
  a.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    saveAs(new window.Blob([JSON.stringify(data, null, 4)], { type: 'application/json' }), filename);
  });
  return a;
}

function fillWarnings (warnings, filename) {
  document.getElementById('warnings').classList.remove('d-none');
  const warningList = document.getElementById('warning-list');
  for (const warning of warnings) {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${filename}: ${warning}`;
    warningList.appendChild(li);
  }
}

document.getElementById('form').addEventListener('submit', async function (e) {
  e.preventDefault();
  e.stopPropagation();

  const files = document.getElementById('file-input').files;
  if (files.length === 0) { return; }

  const parser = new Parser({
    hasCategoryTags: document.getElementById('has-category-tags').checked,
    hasQuestionNumbers: document.getElementById('has-question-numbers').checked,
    buzzpoints: document.getElementById('buzzpoint-format').checked,
    modaq: document.getElementById('modaq-format').checked
  });
  zip = new JSZip();

  const fileOutput = document.getElementById('file-output');
  fileOutput.innerHTML = '';
  document.getElementById('warning-list').innerHTML = '';

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const { data, warnings } = await parser.parseDocxPacket(arrayBuffer, file.name);
      const newFileName = file.name.replace(/\.docx$/, '.json');
      fileOutput.appendChild(createDownloadGroupItem(data, newFileName));
      zip.file(newFileName, JSON.stringify(data, null, 4));
      if (warnings.length > 0) {
        fillWarnings(warnings, newFileName);
      }
    } catch (e) {
      window.alert(`Error parsing ${file.name}: ${e.message}`);
    }
  }

  document.getElementById('download-all').classList.remove('d-none');
});

document.getElementById('download-all').addEventListener('click', function () {
  zip.generateAsync({ type: 'blob' }).then(function (content) {
    saveAs(content, 'output.zip');
  });
});

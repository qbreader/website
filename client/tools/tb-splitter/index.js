/* globals JSZip, saveAs */

function parseDoNotReadToDirective (text) {
  const regex = /.*Do not read to ([^.]*).*/;
  // return the capture group if it exists and the original text
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
        zip.file(filename, JSON.stringify(tossup, null, 4));
      }
      for (const [index, bonus] of packet.bonuses.entries()) {
        const team = parseDoNotReadToDirective(bonus.leadin);
        const filename = `TB-Bonus-${index + 1}${team ? `-${team}` : ''}.json`;
        zip.file(filename, JSON.stringify(bonus, null, 4));
      }
      zip.generateAsync({ type: 'blob' }).then(content => saveAs(content, 'individual-tbs.zip'));
    } catch (error) {
      window.alert('Invalid packet format');
    }
  };
  reader.readAsText(file);
});

// document.getElementById('form').addEventListener('submit', async function (e) {
//   e.preventDefault();
//   e.stopPropagation();

//   const files = document.getElementById('file-input').files;
//   if (files.length === 0) { return; }

//   const parser = new Parser({
//     hasCategoryTags: document.getElementById('has-category-tags').checked,
//     hasQuestionNumbers: document.getElementById('has-question-numbers').checked,
//     buzzpoints: document.getElementById('buzzpoint-format').checked,
//     modaq: document.getElementById('modaq-format').checked
//   });
//   zip = new JSZip();

//   const fileOutput = document.getElementById('file-output');
//   fileOutput.innerHTML = '';
//   document.getElementById('warning-list').innerHTML = '';

//   for (const file of files) {
//     const arrayBuffer = await file.arrayBuffer();
//     try {
//       const { data, warnings } = await parser.parseDocxPacket(arrayBuffer, file.name);
//       const newFileName = file.name.replace(/\.docx$/, '.json');
//       fileOutput.appendChild(createDownloadGroupItem(data, newFileName));
//       zip.file(newFileName, JSON.stringify(data, null, 4));
//       if (warnings.length > 0) {
//         fillWarnings(warnings, newFileName);
//       }
//     } catch (e) {
//       window.alert(`Error parsing ${file.name}: ${e.message}`);
//     }
//   }

//   document.getElementById('download-all').classList.remove('d-none');
// });

// document.getElementById('download-all').addEventListener('click', function () {
//   zip.generateAsync({ type: 'blob' }).then(function (content) {
//     saveAs(content, 'output.zip');
//   });
// });

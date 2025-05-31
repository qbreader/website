import star from '../../scripts/auth/star.js';

const tossups = await star.getStarredTossups();
const tossupList = document.getElementById('tossup-list');
document.getElementById('starred-number').innerText = tossups.length;

for (const tossup of tossups) {
  tossupList.innerHTML += `
        <div class="card mb-2">
            <div class="card-header d-flex justify-content-between">
                <b class="clickable" data-bs-toggle="collapse" data-bs-target="#question-${tossup._id}" aria-expanded="true">
                    ${tossup.set.name} | ${tossup.category} | ${tossup.subcategory} ${tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | ${tossup.difficulty}
                </b>
                <a class="clickable selected" id="star-tossup-${tossup._id}">
                    ${star.starredSvg}
                </a>
            </div>
            <div class="card-container collapse show" id="question-${tossup._id}">
                <div class="card-body">
                    <span>${tossup.question}</span>&nbsp;
                    <hr></hr>
                    <div><b>ANSWER:</b> ${tossup.formatted_answer ?? tossup.answer}</div>
                </div>
                <div class="card-footer">
                    <small class="text-muted">${tossup.packet.name ? 'Packet ' + tossup.packet.name : '&nbsp;'}</small>
                    <small class="text-muted float-end">
                        Packet ${tossup.packet.number} / Question ${tossup.number}
                    </small>
                </div>
            </div>
        </div>
    `;
}

for (const tossup of tossups) {
  document.getElementById(`star-tossup-${tossup._id}`).addEventListener('click', async function () {
    if (this.classList.contains('selected')) {
      this.innerHTML = star.unstarredSvg;
      star.unstarTossup(tossup._id);
      this.classList.toggle('selected');
    } else if (await star.starTossup(tossup._id)) {
      this.innerHTML = star.starredSvg;
      this.classList.toggle('selected');
    }
  });
}

document.getElementById('confirm').addEventListener('click', async function () {
  await star.clearStarredTossups();
  window.location.reload();
});

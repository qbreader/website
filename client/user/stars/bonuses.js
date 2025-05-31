import star from '../../scripts/auth/star.js';
import getBonusPartLabel from '../../scripts/utilities/get-bonus-part-label.js';

const bonuses = await star.getStarredBonuses();
const bonusList = document.getElementById('bonus-list');
document.getElementById('starred-number').innerText = bonuses.length;

for (const bonus of bonuses) {
  let cardBody = '';
  for (let i = 0; i < bonus.parts.length; i++) {
    cardBody += `
        <hr></hr>
        <p>${getBonusPartLabel(bonus, i)} ${bonus.parts[i]}</p>
        <div>ANSWER: ${bonus.answers[i]}</div>
    `;
  }

  bonusList.innerHTML += `
        <div class="card my-2">
            <div class="card-header d-flex justify-content-between">
                <b class="clickable" data-bs-toggle="collapse" data-bs-target="#question-${bonus._id}" aria-expanded="true">
                    ${bonus.set.name} | ${bonus.category} | ${bonus.subcategory} ${bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : ''} | ${bonus.difficulty}
                </b>
                <a class="clickable selected" id="star-bonus-${bonus._id}">
                    ${star.starredSvg}
                </a>
            </div>
            <div class="card-container collapse show" id=question-${bonus._id}>
                <div class="card-body">
                    <p>${bonus.leadin}</p>
                    ${cardBody}
                </div>
                <div class="card-footer clickable" data-bs-toggle="modal" data-bs-target="#bonus-stats-modal">
                    <small class="text-muted">${bonus.packet.name ? 'Packet ' + bonus.packet.name : '&nbsp;'}</small>
                    <small class="text-muted float-end">
                        Packet ${bonus.packet.number} / Question ${bonus.number}
                    </small>
                </div>
            </div>
        </div>
    `;
}

for (const bonus of bonuses) {
  document.getElementById(`star-bonus-${bonus._id}`).addEventListener('click', async function () {
    if (this.classList.contains('selected')) {
      this.innerHTML = star.unstarredSvg;
      star.unstarBonus(bonus._id);
      this.classList.toggle('selected');
    } else if (await star.starBonus(bonus._id)) {
      this.innerHTML = star.starredSvg;
      this.classList.toggle('selected');
    }
  });
}

document.getElementById('confirm').addEventListener('click', async function () {
  await star.clearStarredBonuses();
  window.location.reload();
});

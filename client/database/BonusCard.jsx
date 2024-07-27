import account from '../scripts/accounts.js';
import { stringifyBonus } from './stringify.js';
import { getBonusPartLabel } from '../scripts/utilities/index.js';
import Star from './Star.js';
import star from '../scripts/auth/star.js';

const starredBonusIds = new Set(await star.getStarredBonusIds());

export default function BonusCard ({ bonus, highlightedBonus, hideAnswerlines, showCardFooter, fontSize = 16 }) {
  const _id = bonus._id;
  const packetName = bonus.packet.name;
  const bonusLength = bonus.parts.length;
  const indices = [];

  for (let i = 0; i < bonusLength; i++) {
    indices.push(i);
  }

  function clickToCopy () {
    const textdata = stringifyBonus(bonus);
    navigator.clipboard.writeText(textdata);

    const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
    toast.show();
  }

  function onClick () {
    document.getElementById('report-question-id').value = _id;
  }

  function showBonusStats () {
    fetch('/auth/question-stats/single-bonus?' + new URLSearchParams({ bonus_id: _id }))
      .then(response => {
        switch (response.status) {
          case 401:
            document.getElementById('bonus-stats-body').textContent = 'You need to make an account with a verified email to view question stats.';
            account.deleteUsername();
            throw new Error('Unauthenticated');
          case 403:
            document.getElementById('bonus-stats-body').textContent = 'You need verify your account email to view question stats.';
            throw new Error('Forbidden');
        }
        return response;
      })
      .then(response => response.json())
      .then(response => {
        document.getElementById('bonus-stats-question-id').value = _id;
        const { stats } = response;
        if (!stats) {
          document.getElementById('bonus-stats-body').textContent = 'No stats found for this question.';
          return;
        }

        document.getElementById('bonus-stats-body').innerHTML = `
            <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    BH
                    <span>${stats.count}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    1st part
                    <span>${(10 * stats.part1).toFixed(2)} pts</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    2nd part
                    <span>${(10 * stats.part2).toFixed(2)} pts</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    3rd part
                    <span>${(10 * stats.part3).toFixed(2)} pts</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    30s/20s/10s/0s
                    <span>${stats['30s']}/${stats['20s']}/${stats['10s']}/${stats['0s']}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Total points
                    <span>${stats.totalPoints}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    PPB
                    <span>${stats.ppb.toFixed(2)}</span>
                </li>
            </ul>
            `;
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  return (
    <div className='card my-2'>
      <div className='card-header d-flex justify-content-between'>
        <b className='clickable' onClick={clickToCopy}>
          {bonus.set.name} | {bonus.category} | {bonus.subcategory} {bonus.alternate_subcategory ? ' | ' + bonus.alternate_subcategory : ''} | {bonus.difficulty}
        </b>
        <span>
          <b className='clickable' data-bs-toggle='collapse' data-bs-target={`#question-${_id}`}>
            Packet {bonus.packet.number} |
          </b>
          <span> </span>
          <Star key={_id} _id={_id} questionType='bonus' initiallyStarred={starredBonusIds.has(_id)} />
        </span>
      </div>
      <div className='card-container collapse show' id={`question-${_id}`}>
        <div className='card-body' style={{ fontSize: `${fontSize}px` }}>
          <span style={{ fontWeight: bonus.leadin.substring(0, 3) === '<b>' ? 'bold' : 'normal' }}>{bonus.number}. </span>
          <span dangerouslySetInnerHTML={{ __html: highlightedBonus.leadin }} />
          {indices.map((i) =>
            <div key={`${bonus._id}-${i}`}>
              <hr />
              <p>
                <span>{getBonusPartLabel(bonus, i)} </span>
                <span dangerouslySetInnerHTML={{ __html: highlightedBonus.parts[i] }} />
              </p>
              <div>
                <b>ANSWER: </b>
                <span dangerouslySetInnerHTML={{
                  __html: hideAnswerlines ? '' : highlightedBonus?.answers[i]
                }}
                />
              </div>
            </div>
          )}
        </div>
        <div className={`card-footer clickable ${!showCardFooter && 'd-none'}`} onClick={showBonusStats} data-bs-toggle='modal' data-bs-target='#bonus-stats-modal'>
          <small className='text-muted'>
            {packetName ? 'Packet ' + packetName + '' : <span>&nbsp;</span>}
          </small>
          <small className='text-muted float-end'>
            <a href='#' onClick={onClick} id={`report-question-${_id}`} data-bs-toggle='modal' data-bs-target='#report-question-modal'>
              Report Question
            </a>
          </small>
        </div>
      </div>
    </div>
  );
}

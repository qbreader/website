import account from '../accounts.js';
import { stringifyBonus } from '../../database/stringify.js';
import { getBonusPartLabel } from '../utilities/index.js';
import QuestionCard from './QuestionCard.min.js';

export default function BonusCard ({ bonus, highlightedBonus, hideAnswerlines, hideCardFooter, topRightComponent, fontSize = 16 }) {
  const _id = bonus._id;
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

  function onClickFooter () {
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
    <QuestionCard
      onClickHeader={clickToCopy}
      question={bonus}
      topRightComponent={topRightComponent}
    >
      <div className='card-body' style={{ fontSize: `${fontSize}px` }}>
        <span style={{ fontWeight: bonus.leadin.substring(0, 3) === '<b>' ? 'bold' : 'normal' }}>{bonus.number}. </span>
        <span dangerouslySetInnerHTML={{ __html: highlightedBonus.leadin }} />
        {indices.map((i) =>
          <div key={`${bonus._id}-${i}`}>
            <hr />
            <p>{getBonusPartLabel(bonus, i)} <span dangerouslySetInnerHTML={{ __html: highlightedBonus.parts[i] }} /></p>
            <b>ANSWER: </b>
            <span dangerouslySetInnerHTML={{ __html: hideAnswerlines ? '' : highlightedBonus?.answers[i] }} />
          </div>
        )}
      </div>
      <div className={`card-footer clickable ${hideCardFooter && 'd-none'}`} onClick={showBonusStats} data-bs-toggle='modal' data-bs-target='#bonus-stats-modal'>
        <small className='text-muted'>
          {bonus.packet.name ? 'Packet ' + bonus.packet.name : <span>&nbsp;</span>}
        </small>
        <small className='text-muted float-end'>
          <a href='#' onClick={onClickFooter} id={`report-question-${_id}`} data-bs-toggle='modal' data-bs-target='#report-question-modal'>
            Report Question
          </a>
        </small>
      </div>
    </QuestionCard>
  );
}

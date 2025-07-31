import { stringifyBonus } from './stringify.js';
import getBonusPartLabel from '../scripts/utilities/get-bonus-part-label.js';
import QuestionCard from '../scripts/components/QuestionCard.jsx';

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
    fetch('/api/question-stats/bonus?' + new URLSearchParams({ _id }))
      .then(response => response.json())
      .then(response => {
        document.getElementById('bonus-stats-question-id').value = _id;
        const { stats } = response;
        if (!stats) {
          document.getElementById('bonus-stats-body').textContent = 'No stats found for this question.';
          return;
        }

        const statsList = [
          ['BH', stats.count],
          ['1st part', (10 * stats.part1).toFixed(2) + ' pts'],
          ['2nd part', (10 * stats.part2).toFixed(2) + ' pts'],
          ['3rd part', (10 * stats.part3).toFixed(2) + ' pts'],
          ['30s/20s/10s/0s', `${stats['30s']}/${stats['20s']}/${stats['10s']}/${stats['0s']}`],
          ['Total points', stats.totalPoints],
          ['PPB', stats.ppb.toFixed(2)]
        ];
        const ul = document.createElement('ul');
        ul.className = 'list-group';
        for (const [label, value] of statsList) {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.innerHTML = `${label} <span>${value}</span>`;
          ul.appendChild(li);
        }
        document.getElementById('bonus-stats-body').textContent = '';
        document.getElementById('bonus-stats-body').appendChild(ul);
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
      <div className={`card-footer d-flex justify-content-between ${hideCardFooter && 'd-none'}`}>
        <div className='clickable flex-grow-1' onClick={showBonusStats} data-bs-toggle='modal' data-bs-target='#bonus-stats-modal'>
          <small className='text-muted'>
            {bonus.packet.name ? 'Packet ' + bonus.packet.name : <span>&nbsp;</span>}
          </small>
        </div>
        <div>
          <small className='text-muted'>
            <a href={`/db/explorer/bonus?_id=${_id}`} onClick={e => e.stopPropagation()}>
              Link to bonus
            </a>
            <span> | </span>
            <a href='#' onClick={onClickFooter} id={`report-question-${_id}`} data-bs-toggle='modal' data-bs-target='#report-question-modal'>
              Report Question
            </a>
          </small>
        </div>
      </div>
    </QuestionCard>
  );
}

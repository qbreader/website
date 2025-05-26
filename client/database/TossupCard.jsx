import account from '../scripts/accounts.js';
import { stringifyTossup } from './stringify.js';
import QuestionCard from '../scripts/components/QuestionCard.min.js';

export default function TossupCard ({ tossup, highlightedTossup, hideAnswerline, hideCardFooter, topRightComponent, fontSize = 16 }) {
  const _id = tossup._id;

  function clickToCopy () {
    const textdata = stringifyTossup(tossup);
    navigator.clipboard.writeText(textdata);
    const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
    toast.show();
  }

  function onClickFooter () {
    document.getElementById('report-question-id').value = _id;
  }

  function showTossupStats () {
    fetch('/auth/question-stats/single-tossup?' + new URLSearchParams({ tossup_id: _id }))
      .then(response => {
        switch (response.status) {
          case 401:
            document.getElementById('tossup-stats-body').textContent = 'You need to make an account with a verified email to view question stats.';
            account.deleteUsername();
            throw new Error('Unauthenticated');
          case 403:
            document.getElementById('tossup-stats-body').textContent = 'You need verify your account email to view question stats.';
            throw new Error('Forbidden');
        }
        return response;
      })
      .then(response => response.json())
      .then(response => {
        document.getElementById('tossup-stats-question-id').value = _id;
        const { stats } = response;
        if (!stats) {
          document.getElementById('tossup-stats-body').textContent = 'No stats found for this question.';
          return;
        }

        const averageCelerity = stats.numCorrect > 0 ? (stats.totalCorrectCelerity / stats.numCorrect) : 0;
        const statsList = [
          ['TUH', stats.count],
          ['15s', stats['15s']],
          ['10s', stats['10s']],
          ['-5s', stats['-5s']],
          ['Average celerity', averageCelerity.toFixed(3)],
          ['Total points', stats.totalPoints],
          ['PPTU', stats.pptu.toFixed(2)]
        ];
        const ul = document.createElement('ul');
        ul.className = 'list-group';
        for (const [label, value] of statsList) {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.innerHTML = `${label} <span>${value}</span>`;
          ul.appendChild(li);
        }
        document.getElementById('tossup-stats-body').textContent = '';
        document.getElementById('tossup-stats-body').appendChild(ul);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  return (
    <QuestionCard
      onClickHeader={clickToCopy}
      question={tossup}
      topRightComponent={topRightComponent}
    >
      <div className='card-body' style={{ fontSize: `${fontSize}px` }}>
        <span style={{ fontWeight: tossup.question.substring(0, 3) === '<b>' ? 'bold' : 'normal' }}>{tossup.number}. </span>
        <span dangerouslySetInnerHTML={{ __html: highlightedTossup.question }} />
        <hr className='my-3' />
        <div>
          <b>ANSWER:</b> <span dangerouslySetInnerHTML={{ __html: hideAnswerline ? '' : highlightedTossup?.answer }} />
        </div>
      </div>
      <div className={`card-footer d-flex justify-content-between ${hideCardFooter && 'd-none'}`}>
        <div className='clickable flex-grow-1' onClick={showTossupStats} data-bs-toggle='modal' data-bs-target='#tossup-stats-modal'>
          <small className='text-muted'>
            {tossup.packet.name ? 'Packet ' + tossup.packet.name : <span>&nbsp;</span>}
          </small>
        </div>
        <div>
          <small className='text-muted'>
            <a href={`/tools/db-explorer/tossup?_id=${_id}`} onClick={e => e.stopPropagation()}>
              Link to tossup
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

import account from '../accounts.js';
import { stringifyBonus } from '../../database/stringify.js';
import { getBonusPartLabel } from '../utilities/index.js';
import QuestionCard from './QuestionCard.js';
export default function BonusCard({
  bonus,
  highlightedBonus,
  hideAnswerlines,
  showCardFooter,
  topRightComponent,
  fontSize = 16
}) {
  const _id = bonus._id;
  const bonusLength = bonus.parts.length;
  const indices = [];
  for (let i = 0; i < bonusLength; i++) {
    indices.push(i);
  }
  function clickToCopy() {
    const textdata = stringifyBonus(bonus);
    navigator.clipboard.writeText(textdata);
    const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
    toast.show();
  }
  function onClickFooter() {
    document.getElementById('report-question-id').value = _id;
  }
  function showBonusStats() {
    fetch('/auth/question-stats/single-bonus?' + new URLSearchParams({
      bonus_id: _id
    })).then(response => {
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
    }).then(response => response.json()).then(response => {
      document.getElementById('bonus-stats-question-id').value = _id;
      const {
        stats
      } = response;
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
    }).catch(error => {
      console.error('Error:', error);
    });
  }
  return /*#__PURE__*/React.createElement(QuestionCard, {
    onClickHeader: clickToCopy,
    question: bonus,
    topRightComponent: topRightComponent
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      fontSize: `${fontSize}px`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: bonus.leadin.substring(0, 3) === '<b>' ? 'bold' : 'normal'
    }
  }, bonus.number, ". "), /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: highlightedBonus.leadin
    }
  }), indices.map(i => /*#__PURE__*/React.createElement("div", {
    key: `${bonus._id}-${i}`
  }, /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("p", null, getBonusPartLabel(bonus, i), " ", /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: highlightedBonus.parts[i]
    }
  })), /*#__PURE__*/React.createElement("b", null, "ANSWER: "), /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: hideAnswerlines ? '' : highlightedBonus?.answers[i]
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: `card-footer clickable ${!showCardFooter && 'd-none'}`,
    onClick: showBonusStats,
    "data-bs-toggle": "modal",
    "data-bs-target": "#bonus-stats-modal"
  }, /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, bonus.packet.name ? 'Packet ' + bonus.packet.name : /*#__PURE__*/React.createElement("span", null, "\xA0")), /*#__PURE__*/React.createElement("small", {
    className: "text-muted float-end"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: onClickFooter,
    id: `report-question-${_id}`,
    "data-bs-toggle": "modal",
    "data-bs-target": "#report-question-modal"
  }, "Report Question"))));
}
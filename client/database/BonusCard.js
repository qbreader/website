import account from '../scripts/accounts.js';
import { stringifyBonus } from './stringify.js';
import { getBonusPartLabel } from '../scripts/utilities/index.js';
export default function BonusCard({
  bonus,
  highlightedBonus,
  hideAnswerlines,
  showCardFooter,
  fontSize = 16
}) {
  const _id = bonus._id;
  const packetName = bonus.packet.name;
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
  function onClick() {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "card my-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header d-flex justify-content-between"
  }, /*#__PURE__*/React.createElement("b", {
    className: "clickable",
    onClick: clickToCopy
  }, bonus.set.name, " | ", bonus.category, " | ", bonus.subcategory, " ", bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : '', " | ", bonus.difficulty), /*#__PURE__*/React.createElement("b", {
    className: "clickable",
    "data-bs-toggle": "collapse",
    "data-bs-target": `#question-${_id}`
  }, "Packet ", bonus.packet.number, " | Question ", bonus.number)), /*#__PURE__*/React.createElement("div", {
    className: "card-container collapse show",
    id: `question-${_id}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      fontSize: `${fontSize}px`
    }
  }, /*#__PURE__*/React.createElement("p", {
    dangerouslySetInnerHTML: {
      __html: highlightedBonus.leadin
    }
  }), indices.map(i => /*#__PURE__*/React.createElement("div", {
    key: `${bonus._id}-${i}`
  }, /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", null, getBonusPartLabel(bonus, i), " "), /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: highlightedBonus.parts[i]
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "ANSWER: "), /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: hideAnswerlines ? '' : highlightedBonus?.answers[i]
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    className: `card-footer clickable ${!showCardFooter && 'd-none'}`,
    onClick: showBonusStats,
    "data-bs-toggle": "modal",
    "data-bs-target": "#bonus-stats-modal"
  }, /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, packetName ? 'Packet ' + packetName : /*#__PURE__*/React.createElement("span", null, "\xA0")), /*#__PURE__*/React.createElement("small", {
    className: "text-muted float-end"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: onClick,
    id: `report-question-${_id}`,
    "data-bs-toggle": "modal",
    "data-bs-target": "#report-question-modal"
  }, "Report Question")))));
}
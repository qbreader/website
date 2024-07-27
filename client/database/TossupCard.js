import account from '../scripts/accounts.js';
import { stringifyTossup } from './stringify.js';
import Star from './Star.js';
import star from '../scripts/auth/star.js';
const starredTossupIds = new Set(await star.getStarredTossupIds());
export default function TossupCard({
  tossup,
  highlightedTossup,
  hideAnswerline,
  showCardFooter,
  fontSize = 16
}) {
  const _id = tossup._id;
  const packetName = tossup.packet.name;
  function clickToCopy() {
    const textdata = stringifyTossup(tossup);
    navigator.clipboard.writeText(textdata);
    const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
    toast.show();
  }
  function onClick() {
    document.getElementById('report-question-id').value = _id;
  }
  function showTossupStats() {
    fetch('/auth/question-stats/single-tossup?' + new URLSearchParams({
      tossup_id: _id
    })).then(response => {
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
    }).then(response => response.json()).then(response => {
      document.getElementById('tossup-stats-question-id').value = _id;
      const {
        stats
      } = response;
      if (!stats) {
        document.getElementById('tossup-stats-body').textContent = 'No stats found for this question.';
        return;
      }
      const averageCelerity = stats.numCorrect > 0 ? stats.totalCorrectCelerity / stats.numCorrect : 0;
      document.getElementById('tossup-stats-body').innerHTML = `
            <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    TUH
                    <span>${stats.count}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    15s
                    <span>${stats['15s']}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    10s
                    <span>${stats['10s']}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    -5s
                    <span>${stats['-5s']}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Average celerity
                    <span>${averageCelerity.toFixed(3)}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Total points
                    <span>${stats.totalPoints}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    PPTU
                    <span>${stats.pptu.toFixed(2)}</span>
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
  }, tossup.set.name, " | ", tossup.category, " | ", tossup.subcategory, " ", tossup.alternate_subcategory ? ' | ' + tossup.alternate_subcategory : '', " | ", tossup.difficulty), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    className: "clickable",
    "data-bs-toggle": "collapse",
    "data-bs-target": `#question-${_id}`
  }, "Packet ", tossup.packet.number, " |"), /*#__PURE__*/React.createElement("span", null, " "), /*#__PURE__*/React.createElement(Star, {
    key: _id,
    _id: _id,
    questionType: "tossup",
    initiallyStarred: starredTossupIds.has(_id)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card-container collapse show",
    id: `question-${_id}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      fontSize: `${fontSize}px`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: tossup.question.substring(0, 3) === '<b>' ? 'bold' : 'normal'
    }
  }, tossup.number, ". "), /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: highlightedTossup.question
    }
  }), /*#__PURE__*/React.createElement("hr", {
    className: "my-3"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "ANSWER:"), " ", /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: hideAnswerline ? '' : highlightedTossup?.answer
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: `card-footer clickable ${!showCardFooter && 'd-none'}`,
    onClick: showTossupStats,
    "data-bs-toggle": "modal",
    "data-bs-target": "#tossup-stats-modal"
  }, /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, packetName ? 'Packet ' + packetName + '' : /*#__PURE__*/React.createElement("span", null, "\xA0")), /*#__PURE__*/React.createElement("small", {
    className: "text-muted float-end"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: onClick,
    id: `report-question-${_id}`,
    "data-bs-toggle": "modal",
    "data-bs-target": "#report-question-modal"
  }, "Report Question")))));
}
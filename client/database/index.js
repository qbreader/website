const CATEGORY_BUTTONS = [['Literature', 'primary'], ['History', 'success'], ['Science', 'danger'], ['Fine Arts', 'warning'], ['Religion', 'secondary'], ['Mythology', 'secondary'], ['Philosophy', 'secondary'], ['Social Science', 'secondary'], ['Current Events', 'secondary'], ['Geography', 'secondary'], ['Other Academic', 'secondary'], ['Trash', 'secondary']];
const SUBCATEGORY_BUTTONS = [['American Literature', 'primary'], ['British Literature', 'primary'], ['Classical Literature', 'primary'], ['European Literature', 'primary'], ['World Literature', 'primary'], ['Other Literature', 'primary'], ['American History', 'success'], ['Ancient History', 'success'], ['European History', 'success'], ['World History', 'success'], ['Other History', 'success'], ['Biology', 'danger'], ['Chemistry', 'danger'], ['Physics', 'danger'], ['Math', 'danger'], ['Other Science', 'danger'], ['Visual Fine Arts', 'warning'], ['Auditory Fine Arts', 'warning'], ['Other Fine Arts', 'warning']];
let validCategories = [];
let validSubcategories = [];
function downloadQuestionsAsJSON(tossups, bonuses, filename = 'data.json') {
  const JSONdata = {
    tossups,
    bonuses
  };
  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(JSONdata, null, 4));
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
}
function downloadQuestionsAsText(tossups, bonuses, filename = 'data.txt') {
  let textdata = '';
  for (let tossup of tossups) {
    textdata += `${tossup.setName} Packet ${tossup.packetNumber}\nQuestion ID: ${tossup._id}\n`;
    textdata += `${tossup.questionNumber}. ${tossup.question}\nANSWER: ${tossup.answer}\n`;
    textdata += `<${tossup.category} / ${tossup.subcategory}>\n\n`;
  }
  for (let bonus of bonuses) {
    textdata += `${bonus.setName} Packet ${bonus.packetNumber}\nQuestion ID: ${bonus._id}\n${bonus.questionNumber}. ${bonus.leadin}\n`;
    for (let i = 0; i < bonus.parts.length; i++) {
      textdata += `[10] ${bonus.parts[i]}\nANSWER: ${bonus.answers[i]}\n`;
    }
    textdata += `<${bonus.category} / ${bonus.subcategory}>\n\n`;
  }
  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/text;charset=utf-8,' + encodeURIComponent(textdata);
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function highlightTossupQuery({
  tossup,
  regExp,
  searchType = 'all'
}) {
  if (searchType === 'question' || searchType === 'all') tossup.question = tossup.question.replace(regExp, '<span class="text-highlight">$&</span>');
  if (searchType === 'answer' || searchType === 'all') {
    if (tossup.formatted_answer) {
      tossup.formatted_answer = tossup.formatted_answer.replace(regExp, '<span class="text-highlight">$&</span>');
    } else {
      tossup.answer = tossup.answer.replace(regExp, '<span class="text-highlight">$&</span>');
    }
  }
  return tossup;
}
function highlightBonusQuery({
  bonus,
  regExp,
  searchType = 'all'
}) {
  if (searchType === 'question' || searchType === 'all') {
    bonus.leadin = bonus.leadin.replace(regExp, '<span class="text-highlight">$&</span>');
    for (let i = 0; i < bonus.parts.length; i++) {
      bonus.parts[i] = bonus.parts[i].replace(regExp, '<span class="text-highlight">$&</span>');
    }
  }
  if (searchType === 'answer' || searchType === 'all') {
    if (bonus.formatted_answers) {
      for (let i = 0; i < bonus.answers.length; i++) {
        bonus.formatted_answers[i] = bonus.formatted_answers[i].replace(regExp, '<span class="text-highlight">$&</span>');
      }
    } else {
      for (let i = 0; i < bonus.answers.length; i++) {
        bonus.answers[i] = bonus.answers[i].replace(regExp, '<span class="text-highlight">$&</span>');
      }
    }
  }
  return bonus;
}
document.getElementById('report-question-submit').addEventListener('click', function () {
  reportQuestion(document.getElementById('report-question-id').value, document.getElementById('report-question-reason').value, document.getElementById('report-question-description').value);
});
function TossupCard({
  tossup
}) {
  const _id = tossup._id;
  const powerParts = tossup.question.split('(*)');
  function onClick() {
    document.getElementById('report-question-id').value = _id;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "card my-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("b", null, tossup.setName, " | ", tossup.category, " | ", tossup.subcategory, " ", tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : '', " | ", tossup.difficulty), /*#__PURE__*/React.createElement("b", {
    className: "float-end"
  }, "Packet ", tossup.packetNumber, " | Question ", tossup.questionNumber)), /*#__PURE__*/React.createElement("div", {
    className: "card-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: powerParts.length > 1 ? '<b>' + powerParts[0] + '(*)</b>' + powerParts[1] : tossup.question
    }
  }), "\xA0", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: onClick,
    id: `report-question-${_id}`,
    "data-bs-toggle": "modal",
    "data-bs-target": "#report-question-modal"
  }, "Report Question"), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "ANSWER:"), " ", /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: tossup?.formatted_answer ?? tossup.answer
    }
  })))));
}
function BonusCard({
  bonus
}) {
  const _id = bonus._id;
  const bonusLength = bonus.parts.length;
  const indices = [];
  for (let i = 0; i < bonusLength; i++) {
    indices.push(i);
  }
  function onClick() {
    document.getElementById('report-question-id').value = _id;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "card my-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("b", null, bonus.setName, " | ", bonus.category, " | ", bonus.subcategory, " ", bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : '', " | ", bonus.difficulty), /*#__PURE__*/React.createElement("b", {
    className: "float-end"
  }, "Packet ", bonus.packetNumber, " | Question ", bonus.questionNumber)), /*#__PURE__*/React.createElement("div", {
    className: "card-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("p", {
    dangerouslySetInnerHTML: {
      __html: bonus.leadin
    }
  }), indices.map(i => /*#__PURE__*/React.createElement("div", {
    key: `${bonus._id}-${i}`
  }, /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("p", null, "[10]\xA0", /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: bonus.parts[i]
    }
  }), "\xA0", i + 1 === bonusLength && /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: onClick,
    id: `report-question-${_id}`,
    "data-bs-toggle": "modal",
    "data-bs-target": "#report-question-modal"
  }, "Report Question")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "ANSWER:"), " ", /*#__PURE__*/React.createElement("span", {
    dangerouslySetInnerHTML: {
      __html: (bonus?.formatted_answers ?? bonus.answers)[i]
    }
  })))))));
}

// eslint-disable-next-line no-undef
function CategoryButton({
  category,
  color
}) {
  function handleClick() {
    [validCategories, validSubcategories] = updateCategory(category, validCategories, validSubcategories);
    loadCategoryModal(validCategories, validSubcategories);
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "btn-check",
    autoComplete: "off",
    id: category,
    onClick: handleClick
  }), /*#__PURE__*/React.createElement("label", {
    className: `btn btn-outline-${color} w-100 rounded-0 my-1`,
    htmlFor: category
  }, category, /*#__PURE__*/React.createElement("br", null)));
}
function SubcategoryButton({
  subcategory,
  color,
  hidden = false
}) {
  function handleClick() {
    validSubcategories = updateSubcategory(subcategory, validSubcategories);
    loadCategoryModal(validCategories, validSubcategories);
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "btn-check",
    autoComplete: "off",
    id: subcategory,
    onClick: handleClick
  }), /*#__PURE__*/React.createElement("label", {
    className: `btn btn-outline-${color} w-100 rounded-0 my-1 ${hidden && 'd-none'}`,
    htmlFor: subcategory
  }, subcategory, /*#__PURE__*/React.createElement("br", null)));
}
function CategoryModal() {
  return /*#__PURE__*/React.createElement("div", {
    className: "modal",
    id: "category-modal",
    tabIndex: "-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-dialog-scrollable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, "Select Categories and Subcategories"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-close",
    "data-bs-dismiss": "modal",
    "aria-label": "Close"
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-6",
    id: "categories"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "text-center"
  }, "Categories"), CATEGORY_BUTTONS.map(element => /*#__PURE__*/React.createElement(CategoryButton, {
    key: element[0],
    category: element[0],
    color: element[1]
  }))), /*#__PURE__*/React.createElement("div", {
    className: "col-6",
    id: "subcategories"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "text-center"
  }, "Subcategories"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted text-center",
    id: "subcategory-info-text"
  }, "You must select categories before you can select subcategories."), SUBCATEGORY_BUTTONS.map(element => /*#__PURE__*/React.createElement(SubcategoryButton, {
    key: element[0],
    subcategory: element[0],
    color: element[1],
    hidden: true
  }))))))));
}
function QueryForm() {
  const [tossups, setTossups] = React.useState([]);
  const [bonuses, setBonuses] = React.useState([]);
  const [tossupCount, setTossupCount] = React.useState(0);
  const [bonusCount, setBonusCount] = React.useState(0);
  const [difficulties, setDifficulties] = React.useState('');
  const [maxReturnLength, setMaxReturnLength] = React.useState('');
  const [queryString, setQueryString] = React.useState('');
  const [questionType, setQuestionType] = React.useState('all');
  const [regex, setRegex] = React.useState(false);
  const [searchType, setSearchType] = React.useState('all');
  const [currentlySearching, setCurrentlySearching] = React.useState(false);
  React.useEffect(() => {
    fetch('/api/set-list').then(response => response.json()).then(data => {
      document.getElementById('set-list').innerHTML = data.map(setName => `<option>${setName}</option>`).join('');
    });
  }, []);
  function handleSubmit(event, randomize = false) {
    event.preventDefault();
    setCurrentlySearching(true);
    const uri = `/api/query?queryString=${encodeURIComponent(queryString)}&categories=${encodeURIComponent(validCategories)}&subcategories=${encodeURIComponent(validSubcategories)}&difficulties=${encodeURIComponent(rangeToArray(difficulties))}&maxReturnLength=${encodeURIComponent(maxReturnLength)}&questionType=${encodeURIComponent(questionType)}&randomize=${encodeURIComponent(randomize)}&regex=${encodeURIComponent(regex)}&searchType=${encodeURIComponent(searchType)}&setName=${encodeURIComponent(document.getElementById('set-name').value)}`;
    fetch(uri, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if (response.status === 400) {
        throw new Error('Invalid query');
      }
      return response;
    }).then(response => response.json()).then(response => {
      const {
        tossups,
        bonuses
      } = response;
      const {
        count: tossupCount,
        questionArray: tossupArray
      } = tossups;
      const regExp = RegExp(regex ? queryString : escapeRegExp(queryString), 'ig');
      if (queryString !== '') {
        for (let i = 0; i < tossupArray.length; i++) {
          tossupArray[i] = highlightTossupQuery({
            tossup: tossupArray[i],
            regExp,
            searchType,
            regex
          });
        }
      }
      setTossupCount(tossupCount);
      setTossups(tossupArray);
      const {
        count: bonusCount,
        questionArray: bonusArray
      } = bonuses;
      if (queryString !== '') {
        for (let i = 0; i < bonusArray.length; i++) {
          bonusArray[i] = highlightBonusQuery({
            bonus: bonusArray[i],
            regExp,
            searchType,
            regex
          });
        }
      }
      setBonusCount(bonusCount);
      setBonuses(bonusArray);
      setCurrentlySearching(false);
    }).catch(error => {
      console.error('Error:', error);
      alert('Invalid query. Please check your search parameters and try again.');
      setCurrentlySearching(false);
    });
  }
  const tossupCards = tossups.map(tossup => /*#__PURE__*/React.createElement(TossupCard, {
    key: tossup._id,
    tossup: tossup
  }));
  const bonusCards = bonuses.map(bonus => /*#__PURE__*/React.createElement(BonusCard, {
    key: bonus._id,
    bonus: bonus
  }));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CategoryModal, null), /*#__PURE__*/React.createElement("form", {
    className: "mt-3",
    onSubmit: event => {
      handleSubmit(event);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "input-group mb-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    id: "query",
    placeholder: "Query",
    value: queryString,
    onChange: event => {
      setQueryString(event.target.value);
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-info"
  }, "Search"), /*#__PURE__*/React.createElement("button", {
    id: "randomize",
    className: "btn btn-success",
    onClick: event => {
      handleSubmit(event, true);
    }
  }, "Random")), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    id: "difficulty-settings",
    className: "col-6 col-xl-3 mb-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    id: "difficulties",
    placeholder: "Difficulties (1-10)",
    value: difficulties,
    onChange: event => {
      setDifficulties(event.target.value);
    }
  })), /*#__PURE__*/React.createElement("div", {
    id: "max-query-return-length",
    className: "col-6 col-xl-3 mb-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    id: "max-return-length",
    placeholder: "Max # to Display (default: 50)",
    value: maxReturnLength,
    onChange: event => {
      setMaxReturnLength(event.target.value);
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "input-group col-12 col-xl-6 mb-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    id: "set-name",
    placeholder: "Set Name",
    list: "set-list"
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "set-list"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-danger",
    id: "category-select-button",
    "data-bs-toggle": "modal",
    "data-bs-target": "#category-modal"
  }, "Categories"))), /*#__PURE__*/React.createElement("div", {
    className: "row mb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-6"
  }, /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    id: "search-type",
    value: searchType,
    onChange: event => {
      setSearchType(event.target.value);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All text"), /*#__PURE__*/React.createElement("option", {
    value: "question"
  }, "Question"), /*#__PURE__*/React.createElement("option", {
    value: "answer"
  }, "Answer"))), /*#__PURE__*/React.createElement("div", {
    className: "col-6"
  }, /*#__PURE__*/React.createElement("select", {
    className: "form-select disabled",
    id: "question-type",
    value: questionType,
    onChange: event => {
      setQuestionType(event.target.value);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All questions"), /*#__PURE__*/React.createElement("option", {
    value: "tossup"
  }, "Tossups"), /*#__PURE__*/React.createElement("option", {
    value: "bonus"
  }, "Bonuses")))), /*#__PURE__*/React.createElement("div", {
    className: "row mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-12"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-check form-switch d-inline-block"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-check-input",
    type: "checkbox",
    role: "switch",
    id: "toggle-regex",
    checked: regex,
    onChange: () => {
      setRegex(!regex);
    }
  }), /*#__PURE__*/React.createElement("label", {
    className: "form-check-label",
    htmlFor: "toggle-regex"
  }, "Search using regular expression"), /*#__PURE__*/React.createElement("a", {
    href: "https://www.sitepoint.com/learn-regex/"
  }, " What's this?")), /*#__PURE__*/React.createElement("div", {
    className: "float-end"
  }, /*#__PURE__*/React.createElement("b", null, "Download as:"), /*#__PURE__*/React.createElement("a", {
    className: "ms-2 download-link",
    onClick: () => {
      downloadQuestionsAsText(tossups, bonuses);
    }
  }, "TXT"), /*#__PURE__*/React.createElement("a", {
    className: "ms-2 btn-link disabled"
  }, "CSV"), /*#__PURE__*/React.createElement("a", {
    className: "ms-2 download-link",
    onClick: () => {
      downloadQuestionsAsJSON(tossups, bonuses);
    }
  }, "JSON"))))), currentlySearching && /*#__PURE__*/React.createElement("div", {
    className: "d-block mx-auto mt-3 spinner-border",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d-none"
  }, "Loading...")), /*#__PURE__*/React.createElement("div", {
    className: "row text-center"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "mt-2",
    id: "tossups"
  }, "Tossups")), tossupCount > 0 ? /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-muted float-start"
  }, "Showing ", tossups.length, " of ", tossupCount, " results"), "\xA0", /*#__PURE__*/React.createElement("span", {
    className: "text-muted float-end"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#bonuses"
  }, "Jump to bonuses"))) : /*#__PURE__*/React.createElement("p", {
    className: "text-muted"
  }, "No tossups found"), /*#__PURE__*/React.createElement("div", null, tossupCards), /*#__PURE__*/React.createElement("div", {
    className: "mb-5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "row text-center"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "mt-3",
    id: "bonuses"
  }, "Bonuses")), bonusCount > 0 ? /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-muted float-start"
  }, "Showing ", bonuses.length, " of ", bonusCount, " results"), "\xA0", /*#__PURE__*/React.createElement("span", {
    className: "text-muted float-end"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#tossups"
  }, "Jump to tossups"))) : /*#__PURE__*/React.createElement("p", {
    className: "text-muted"
  }, "No bonuses found"), /*#__PURE__*/React.createElement("div", null, bonusCards), /*#__PURE__*/React.createElement("div", {
    className: "mb-5"
  }));
}

// eslint-disable-next-line no-undef
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render( /*#__PURE__*/React.createElement(QueryForm, null));

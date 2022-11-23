const CATEGORIES = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"];
const SUBCATEGORIES = {
  "Literature": ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature"],
  "History": ["American History", "Ancient History", "European History", "World History", "Other History"],
  "Science": ["Biology", "Chemistry", "Physics", "Math", "Other Science"],
  "Fine Arts": ["Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts"],
  "Religion": ["Religion"],
  "Mythology": ["Mythology"],
  "Philosophy": ["Philosophy"],
  "Social Science": ["Social Science"],
  "Current Events": ["Current Events"],
  "Geography": ["Geography"],
  "Other Academic": ["Other Academic"],
  "Trash": ["Trash"]
};
const SUBCATEGORIES_FLATTENED = ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature", "American History", "Ancient History", "European History", "World History", "Other History", "Biology", "Chemistry", "Physics", "Math", "Other Science", "Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"];
const CATEGORY_BUTTONS = [["Literature", "primary"], ["History", "success"], ["Science", "danger"], ["Fine Arts", "warning"], ["Religion", "secondary"], ["Mythology", "secondary"], ["Philosophy", "secondary"], ["Social Science", "secondary"], ["Current Events", "secondary"], ["Geography", "secondary"], ["Other Academic", "secondary"], ["Trash", "secondary"]];
const SUBCATEGORY_BUTTONS = [["American Literature", "primary"], ["British Literature", "primary"], ["Classical Literature", "primary"], ["European Literature", "primary"], ["World Literature", "primary"], ["Other Literature", "primary"], ["American History", "success"], ["Ancient History", "success"], ["European History", "success"], ["World History", "success"], ["Other History", "success"], ["Biology", "danger"], ["Chemistry", "danger"], ["Physics", "danger"], ["Math", "danger"], ["Other Science", "danger"], ["Visual Fine Arts", "warning"], ["Auditory Fine Arts", "warning"], ["Other Fine Arts", "warning"]];
const difficultyOptions = [{
  "value": 1,
  "label": "1 (Middle School)"
}, {
  "value": 2,
  "label": "2 (Easy High School)"
}, {
  "value": 3,
  "label": "3 (Regular High School)"
}, {
  "value": 4,
  "label": "4 (Hard High School)"
}, {
  "value": 5,
  "label": "5 (National High School)"
}, {
  "value": 6,
  "label": "6 (Easy College)"
}, {
  "value": 7,
  "label": "7 (Middle College)"
}, {
  "value": 8,
  "label": "8 (Regulars College)"
}, {
  "value": 9,
  "label": "9 (Nationals College)"
}, {
  "value": 10,
  "label": "10 (Open)"
}];
var validCategories = [];
var validSubcategories = [];
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function highlightTossupQuery(tossup, queryString, searchType = 'all') {
  if (searchType === 'question' || searchType === 'all') {
    tossup.question = tossup.question.replace(RegExp(escapeRegExp(queryString), 'ig'), '<span class="text-highlight">$&</span>');
  }
  if (searchType === 'answer' || searchType === 'all') {
    tossup.answer = tossup.answer.replace(RegExp(escapeRegExp(queryString), 'ig'), '<span class="text-highlight">$&</span>');
  }
  return tossup;
}
function highlightBonusQuery(bonus, queryString, searchType = 'all') {
  if (searchType === 'question' || searchType === 'all') {
    bonus.leadin = bonus.leadin.replace(RegExp(escapeRegExp(queryString), 'ig'), `<span class="text-highlight">$&</span>`);
    for (let i = 0; i < bonus.parts.length; i++) {
      bonus.parts[i] = bonus.parts[i].replace(RegExp(escapeRegExp(queryString), 'ig'), `<span class="text-highlight">$&</span>`);
    }
  }
  if (searchType === 'answer' || searchType === 'all') {
    for (let i = 0; i < bonus.parts.length; i++) {
      bonus.answers[i] = bonus.answers[i].replace(RegExp(escapeRegExp(queryString), 'ig'), `<span class="text-highlight">$&</span>`);
    }
  }
  return bonus;
}
function reportQuestion(_id, reason = "", description = "") {
  fetch('/api/report-question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      _id: _id,
      reason: reason,
      description: description
    })
  }).then(response => {
    if (response.status === 200) {
      alert('Question has been reported.');
    } else {
      alert('There was an error reporting the question.');
    }
  }).catch(error => {
    alert('There was an error reporting the question.');
  });
}
document.getElementById('report-question-submit').addEventListener('click', function () {
  reportQuestion(document.getElementById('report-question-id').value, document.getElementById('report-question-reason').value, document.getElementById('report-question-description').value);
});
function rangeToArray(string, max = 0) {
  if (string.length === 0) {
    string = `1-${max}`;
  }
  if (string.endsWith('-')) {
    string = string + max;
  }
  let tokens = string.split(",");
  let ranges = [];
  for (let i = 0; i < tokens.length; i++) {
    let range = tokens[i].trim().split("-");
    if (range.length === 1) {
      ranges.push([parseInt(range[0]), parseInt(range[0])]);
    } else {
      ranges.push([parseInt(range[0]), parseInt(range[1])]);
    }
  }
  let array = [];
  for (let i = 0; i < ranges.length; i++) {
    for (let j = ranges[i][0]; j <= ranges[i][1]; j++) {
      array.push(j);
    }
  }
  return array;
}
function updateCategory(category, validCategories, validSubcategories) {
  if (validCategories.includes(category)) {
    validCategories = validCategories.filter(a => a !== category);
    validSubcategories = validSubcategories.filter(a => !SUBCATEGORIES[category].includes(a));
  } else {
    validCategories.push(category);
    validSubcategories = validSubcategories.concat(SUBCATEGORIES[category]);
  }
  return [validCategories, validSubcategories];
}
function updateSubcategory(subcategory, validSubcategories) {
  if (validSubcategories.includes(subcategory)) {
    validSubcategories = validSubcategories.filter(a => a !== subcategory);
  } else {
    validSubcategories.push(subcategory);
  }
  return validSubcategories;
}

/**
 * Updates the category modal to show the given categories and subcategories.
 * @param {Array<String>} validCategories
 * @param {Array<String>} validSubcategories
 * @returns {void}
 */
function loadCategoryModal(validCategories, validSubcategories) {
  document.querySelectorAll('#categories input').forEach(element => element.checked = false);
  document.querySelectorAll('#subcategories input').forEach(element => element.checked = false);
  document.querySelectorAll('#subcategories label').forEach(element => element.classList.add('d-none'));
  if (validSubcategories.length === 0) {
    let subcategoryInfoText = document.createElement('div');
    subcategoryInfoText.className = 'text-muted text-center';
    subcategoryInfoText.innerHTML = 'You must select categories before you can select subcategories.';
    subcategoryInfoText.id = 'subcategory-info-text';
    document.getElementById('subcategories').appendChild(subcategoryInfoText);
  } else if (document.getElementById('subcategory-info-text')) {
    document.getElementById('subcategory-info-text').remove();
  }
  validCategories.forEach(category => {
    document.getElementById(category).checked = true;
    SUBCATEGORIES[category].forEach(subcategory => {
      document.querySelector(`[for="${subcategory}"]`).classList.remove('d-none');
    });
  });
  validSubcategories.forEach(subcategory => {
    document.getElementById(subcategory).checked = true;
  });
}
class TossupCard extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const tossup = this.props.tossup;
    return /*#__PURE__*/React.createElement("div", {
      className: "card my-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-header"
    }, /*#__PURE__*/React.createElement("b", null, tossup.setName, " | ", tossup.category, " | ", tossup.subcategory), /*#__PURE__*/React.createElement("b", {
      className: "float-end"
    }, "Packet ", tossup.packetNumber, " | Question ", tossup.questionNumber)), /*#__PURE__*/React.createElement("div", {
      className: "card-container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-body"
    }, /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: tossup.question
      }
    }), "\xA0", /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: () => {
        document.getElementById('report-question-id').value = tossup._id;
      },
      id: `report-question-${tossup._id}`,
      "data-bs-toggle": "modal",
      "data-bs-target": "#report-question-modal"
    }, "Report Question"), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "ANSWER:"), " ", /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: tossup.answer
      }
    })))));
  }
}
class BonusCard extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const bonus = this.props.bonus;
    return /*#__PURE__*/React.createElement("div", {
      className: "card my-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-header"
    }, /*#__PURE__*/React.createElement("b", null, bonus.setName, " | ", bonus.category, " | ", bonus.subcategory), /*#__PURE__*/React.createElement("b", {
      className: "float-end"
    }, "Packet ", bonus.packetNumber, " | Question ", bonus.questionNumber)), /*#__PURE__*/React.createElement("div", {
      className: "card-container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-body"
    }, /*#__PURE__*/React.createElement("p", {
      dangerouslySetInnerHTML: {
        __html: bonus.leadin
      }
    }), [0, 1, 2].map(i => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("p", null, "[10] ", /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: bonus.parts[i]
      }
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "ANSWER:"), " ", /*#__PURE__*/React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: bonus.answers[i]
      }
    })))))));
  }
}
class CategoryModalButton extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-danger",
      id: "category-select-button",
      "data-bs-toggle": "modal",
      "data-bs-target": "#category-modal"
    }, "Categories");
  }
}
class CategoryButton extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    document.getElementById(this.props.category).addEventListener('click', e => {
      [validCategories, validSubcategories] = updateCategory(this.props.category, validCategories, validSubcategories);
      loadCategoryModal(validCategories, validSubcategories);
    });
  }
  render() {
    const category = this.props.category;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "btn-check",
      autoComplete: "off",
      id: category
    }), /*#__PURE__*/React.createElement("label", {
      className: `btn btn-outline-${this.props.color} w-100 rounded-0 my-1`,
      htmlFor: category
    }, category, /*#__PURE__*/React.createElement("br", null)));
  }
}
class SubcategoryButton extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    document.getElementById(this.props.subcategory).addEventListener('click', e => {
      validSubcategories = updateSubcategory(this.props.subcategory, validSubcategories);
      loadCategoryModal(validCategories, validSubcategories);
    });
  }
  render() {
    const subcategory = this.props.subcategory;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "btn-check",
      autoComplete: "off",
      id: subcategory
    }), /*#__PURE__*/React.createElement("label", {
      className: `btn btn-outline-${this.props.color} w-100 rounded-0 my-1`,
      htmlFor: subcategory
    }, subcategory, /*#__PURE__*/React.createElement("br", null)));
  }
}
class CategoryModal extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    loadCategoryModal(validCategories, validSubcategories);
  }
  render() {
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
    }, "Subcategories"), SUBCATEGORY_BUTTONS.map(element => /*#__PURE__*/React.createElement(SubcategoryButton, {
      key: element[0],
      subcategory: element[0],
      color: element[1]
    }))))))));
  }
}
class QueryForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tossups: [],
      bonuses: [],
      tossupCount: 0,
      bonusCount: 0,
      difficulties: [],
      maxQueryReturnLength: '',
      queryString: '',
      questionType: 'all',
      searchType: 'all',
      currentlySearching: false
    };
    this.onDifficultyChange = this.onDifficultyChange.bind(this);
    this.onMaxQueryReturnLengthChange = this.onMaxQueryReturnLengthChange.bind(this);
    this.onQueryChange = this.onQueryChange.bind(this);
    this.onSearchTypeChange = this.onSearchTypeChange.bind(this);
    this.onQuestionTypeChange = this.onQuestionTypeChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  componentDidMount() {
    document.getElementById('randomize').addEventListener('click', event => {
      this.handleSubmit(event, true);
    });
    fetch(`/api/set-list`).then(response => response.json()).then(data => {
      data.forEach(setName => {
        let option = document.createElement('option');
        option.innerHTML = setName;
        document.getElementById('set-list').appendChild(option);
      });
    });
  }
  onDifficultyChange(event) {
    this.setState({
      difficulties: event
    });
  }
  onMaxQueryReturnLengthChange(event) {
    this.setState({
      maxQueryReturnLength: event.target.value
    });
  }
  onQueryChange(event) {
    this.setState({
      queryString: event.target.value
    });
  }
  onSearchTypeChange(event) {
    this.setState({
      searchType: event.target.value
    });
  }
  onQuestionTypeChange(event) {
    this.setState({
      questionType: event.target.value
    });
  }
  handleSubmit(event, randomize = false) {
    event.preventDefault();
    this.setState({
      currentlySearching: true
    });
    console.log('A query was submitted: ' + this.state.queryString);
    fetch(`/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categories: validCategories,
        subcategories: validSubcategories,
        difficulties: this.state.difficulties.map(option => option.value),
        maxQueryReturnLength: this.state.maxQueryReturnLength,
        queryString: this.state.queryString,
        questionType: this.state.questionType,
        randomize: randomize,
        searchType: this.state.searchType,
        setName: document.getElementById('set-name').value
      })
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
      let {
        count: tossupCount,
        questionArray: tossupArray
      } = tossups;
      for (let i = 0; i < tossupArray.length; i++) {
        if (tossupArray[i].hasOwnProperty('formatted_answer')) {
          tossupArray[i].answer = tossupArray[i].formatted_answer;
        }
      }
      if (this.state.queryString !== '') {
        for (let i = 0; i < tossupArray.length; i++) {
          tossupArray[i] = highlightTossupQuery(tossupArray[i], this.state.queryString, this.state.searchType);
        }
      }
      this.setState({
        tossupCount: tossupCount
      });
      this.setState({
        tossups: tossupArray
      });
      let {
        count: bonusCount,
        questionArray: bonusArray
      } = bonuses;
      for (let i = 0; i < bonusArray.length; i++) {
        if (bonusArray[i].hasOwnProperty('formatted_answers')) bonusArray[i].answers = bonusArray[i].formatted_answers;
      }
      if (this.state.queryString !== '') {
        for (let i = 0; i < bonusArray.length; i++) {
          bonusArray[i] = highlightBonusQuery(bonusArray[i], this.state.queryString, this.state.searchType);
        }
      }
      this.setState({
        bonusCount: bonusCount
      });
      this.setState({
        bonuses: bonusArray
      });
      this.setState({
        currentlySearching: false
      });
    }).catch(error => {
      console.error('Error:', error);
      alert('Invalid query. Please check your search parameters and try again.');
      this.setState({
        currentlySearching: false
      });
    });
  }
  render() {
    const tossupCards = this.state.tossups.map(tossup => /*#__PURE__*/React.createElement(TossupCard, {
      key: tossup._id,
      tossup: tossup
    }));
    const bonusCards = this.state.bonuses.map(bonus => /*#__PURE__*/React.createElement(BonusCard, {
      key: bonus._id,
      bonus: bonus
    }));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CategoryModal, null), /*#__PURE__*/React.createElement("form", {
      className: "mt-3",
      onSubmit: this.handleSubmit
    }, /*#__PURE__*/React.createElement("div", {
      className: "input-group mb-2"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      id: "query",
      placeholder: "Query",
      value: this.state.queryString,
      onChange: this.onQueryChange
    }), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "btn btn-info"
    }, "Search"), /*#__PURE__*/React.createElement("button", {
      id: "randomize",
      className: "btn btn-success"
    }, "Random")), /*#__PURE__*/React.createElement("div", {
      className: "row mb-2"
    }, /*#__PURE__*/React.createElement("div", {
      id: "difficulty-settings",
      className: "col-4"
    }, /*#__PURE__*/React.createElement(Select, {
      id: "difficulties",
      isMulti: true,
      placeholder: "Difficulties",
      options: difficultyOptions,
      value: this.state.difficulties,
      onChange: this.onDifficultyChange
    })), /*#__PURE__*/React.createElement("div", {
      id: "max-query-length",
      className: "col-3"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      id: "max-number",
      placeholder: "Max # to Display (default: 50)",
      value: this.state.maxQueryReturnLength,
      onChange: this.onMaxQueryReturnLengthChange
    })), /*#__PURE__*/React.createElement("div", {
      className: "col-5"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      id: "set-name",
      placeholder: "Set Name",
      list: "set-list"
    }), /*#__PURE__*/React.createElement("datalist", {
      id: "set-list"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "row"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col-5"
    }, /*#__PURE__*/React.createElement("select", {
      className: "form-select",
      id: "search-type",
      value: this.state.searchType,
      onChange: this.onSearchTypeChange
    }, /*#__PURE__*/React.createElement("option", {
      value: "all"
    }, "All text (question and answer)"), /*#__PURE__*/React.createElement("option", {
      value: "question"
    }, "Question"), /*#__PURE__*/React.createElement("option", {
      value: "answer"
    }, "Answer"))), /*#__PURE__*/React.createElement("div", {
      className: "col-5"
    }, /*#__PURE__*/React.createElement("select", {
      className: "form-select disabled",
      id: "question-type",
      value: this.state.questionType,
      onChange: this.onQuestionTypeChange
    }, /*#__PURE__*/React.createElement("option", {
      value: "all"
    }, "All questions (tossups and bonuses)"), /*#__PURE__*/React.createElement("option", {
      value: "tossup"
    }, "Tossups"), /*#__PURE__*/React.createElement("option", {
      value: "bonus"
    }, "Bonuses"))), /*#__PURE__*/React.createElement("div", {
      className: "col-2"
    }, /*#__PURE__*/React.createElement(CategoryModalButton, null)))), this.state.currentlySearching ? /*#__PURE__*/React.createElement("div", {
      className: "d-block mx-auto mt-3 spinner-border",
      role: "status"
    }, /*#__PURE__*/React.createElement("span", {
      className: "d-none"
    }, "Loading...")) : null, /*#__PURE__*/React.createElement("div", {
      className: "row text-center"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "mt-3",
      id: "tossups"
    }, "Tossups")), this.state.tossupCount > 0 ? /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("div", {
      className: "text-muted float-start"
    }, "Showing ", this.state.tossups.length, " out of ", this.state.tossupCount, " results"), "\xA0", /*#__PURE__*/React.createElement("div", {
      className: "text-muted float-end"
    }, /*#__PURE__*/React.createElement("a", {
      href: "#bonuses"
    }, "Jump to bonuses"))) : /*#__PURE__*/React.createElement("p", {
      className: "text-muted"
    }, "No tossups found"), /*#__PURE__*/React.createElement("div", null, tossupCards), /*#__PURE__*/React.createElement("p", {
      className: "mb-5"
    }), /*#__PURE__*/React.createElement("div", {
      className: "row text-center"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "mt-3",
      id: "bonuses"
    }, "Bonuses")), this.state.bonusCount > 0 ? /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("div", {
      className: "text-muted float-start"
    }, "Showing ", this.state.bonuses.length, " out of ", this.state.bonusCount, " results"), "\xA0", /*#__PURE__*/React.createElement("div", {
      className: "text-muted float-end"
    }, /*#__PURE__*/React.createElement("a", {
      href: "#tossups"
    }, "Jump to tossups"))) : /*#__PURE__*/React.createElement("p", {
      className: "text-muted"
    }, "No bonuses found"), /*#__PURE__*/React.createElement("div", null, bonusCards), /*#__PURE__*/React.createElement("p", {
      className: "mb-5"
    }));
  }
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render( /*#__PURE__*/React.createElement(QueryForm, null));

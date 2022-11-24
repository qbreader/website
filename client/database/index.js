const CATEGORY_BUTTONS = [['Literature', 'primary'], ['History', 'success'], ['Science', 'danger'], ['Fine Arts', 'warning'], ['Religion', 'secondary'], ['Mythology', 'secondary'], ['Philosophy', 'secondary'], ['Social Science', 'secondary'], ['Current Events', 'secondary'], ['Geography', 'secondary'], ['Other Academic', 'secondary'], ['Trash', 'secondary']];
const SUBCATEGORY_BUTTONS = [['American Literature', 'primary'], ['British Literature', 'primary'], ['Classical Literature', 'primary'], ['European Literature', 'primary'], ['World Literature', 'primary'], ['Other Literature', 'primary'], ['American History', 'success'], ['Ancient History', 'success'], ['European History', 'success'], ['World History', 'success'], ['Other History', 'success'], ['Biology', 'danger'], ['Chemistry', 'danger'], ['Physics', 'danger'], ['Math', 'danger'], ['Other Science', 'danger'], ['Visual Fine Arts', 'warning'], ['Auditory Fine Arts', 'warning'], ['Other Fine Arts', 'warning']];
var validCategories = [];
var validSubcategories = [];
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function highlightTossupQuery({
  tossup,
  queryString,
  regex = false,
  searchType = 'all'
}) {
  if (!regex) {
    queryString = escapeRegExp(queryString);
  }
  if (searchType === 'question' || searchType === 'all') {
    tossup.question = tossup.question.replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
  }
  if (searchType === 'answer' || searchType === 'all') {
    tossup.answer = tossup.answer.replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
  }
  return tossup;
}
function highlightBonusQuery({
  bonus,
  queryString,
  regex = false,
  searchType = 'all'
}) {
  if (!regex) {
    queryString = escapeRegExp(queryString);
  }
  if (searchType === 'question' || searchType === 'all') {
    bonus.leadin = bonus.leadin.replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
    for (let i = 0; i < bonus.parts.length; i++) {
      bonus.parts[i] = bonus.parts[i].replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
    }
  }
  if (searchType === 'answer' || searchType === 'all') {
    for (let i = 0; i < bonus.parts.length; i++) {
      bonus.answers[i] = bonus.answers[i].replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
    }
  }
  return bonus;
}
document.getElementById('report-question-submit').addEventListener('click', function () {
  reportQuestion(document.getElementById('report-question-id').value, document.getElementById('report-question-reason').value, document.getElementById('report-question-description').value);
});

// eslint-disable-next-line no-undef
class TossupCard extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const tossup = this.props.tossup;
    const powerParts = tossup.question.split('(*)');
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
        __html: powerParts.length > 1 ? '<b>' + powerParts[0] + '(*)</b>' + powerParts[1] : tossup.question
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

// eslint-disable-next-line no-undef
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
    }), [0, 1, 2].map(i => /*#__PURE__*/React.createElement("div", {
      key: `${bonus._id}-${i}`
    }, /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("p", null, "[10] ", /*#__PURE__*/React.createElement("span", {
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

// eslint-disable-next-line no-undef
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

// eslint-disable-next-line no-undef
class CategoryButton extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    document.getElementById(this.props.category).addEventListener('click', () => {
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

// eslint-disable-next-line no-undef
class SubcategoryButton extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    document.getElementById(this.props.subcategory).addEventListener('click', () => {
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

// eslint-disable-next-line no-undef
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

// eslint-disable-next-line no-undef
class QueryForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tossups: [],
      bonuses: [],
      tossupCount: 0,
      bonusCount: 0,
      difficulties: '',
      maxQueryReturnLength: '',
      queryString: '',
      questionType: 'all',
      regex: false,
      searchType: 'all',
      currentlySearching: false
    };
    this.onDifficultyChange = this.onDifficultyChange.bind(this);
    this.onMaxQueryReturnLengthChange = this.onMaxQueryReturnLengthChange.bind(this);
    this.onQueryChange = this.onQueryChange.bind(this);
    this.onQuestionTypeChange = this.onQuestionTypeChange.bind(this);
    this.onRegexChange = this.onRegexChange.bind(this);
    this.onSearchTypeChange = this.onSearchTypeChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  componentDidMount() {
    document.getElementById('randomize').addEventListener('click', event => {
      this.handleSubmit(event, true);
    });
    fetch('/api/set-list').then(response => response.json()).then(data => {
      data.forEach(setName => {
        let option = document.createElement('option');
        option.innerHTML = setName;
        document.getElementById('set-list').appendChild(option);
      });
    });
  }
  onDifficultyChange(event) {
    this.setState({
      difficulties: event.target.value
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
  onRegexChange(event) {
    this.setState({
      regex: event.target.checked
    });
  }
  handleSubmit(event, randomize = false) {
    event.preventDefault();
    this.setState({
      currentlySearching: true
    });
    console.log('A query was submitted: ' + this.state.queryString);
    fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categories: validCategories,
        subcategories: validSubcategories,
        difficulties: rangeToArray(this.state.difficulties),
        maxQueryReturnLength: this.state.maxQueryReturnLength,
        queryString: this.state.queryString,
        questionType: this.state.questionType,
        randomize: randomize,
        regex: this.state.regex,
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
        if (Object.prototype.hasOwnProperty.call(tossupArray[i], 'formatted_answer')) {
          tossupArray[i].answer = tossupArray[i].formatted_answer;
        }
      }
      if (this.state.queryString !== '') {
        for (let i = 0; i < tossupArray.length; i++) {
          tossupArray[i] = highlightTossupQuery({
            tossup: tossupArray[i],
            queryString: this.state.queryString,
            searchType: this.state.searchType,
            regex: this.state.regex
          });
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
        if (Object.prototype.hasOwnProperty.call(bonusArray[i], 'formatted_answers')) bonusArray[i].answers = bonusArray[i].formatted_answers;
      }
      if (this.state.queryString !== '') {
        for (let i = 0; i < bonusArray.length; i++) {
          bonusArray[i] = highlightBonusQuery({
            bonus: bonusArray[i],
            queryString: this.state.queryString,
            searchType: this.state.searchType,
            regex: this.state.regex
          });
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
      className: "col-2"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      id: "difficulties",
      placeholder: "Difficulties (1-10)",
      value: this.state.difficulties,
      onChange: this.onDifficultyChange
    })), /*#__PURE__*/React.createElement("div", {
      id: "max-query-length",
      className: "col-3"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      id: "difficulties",
      placeholder: "Max # to Display (default: 50)",
      value: this.state.maxQueryReturnLength,
      onChange: this.onMaxQueryReturnLengthChange
    })), /*#__PURE__*/React.createElement("div", {
      className: "col-7"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      id: "set-name",
      placeholder: "Set Name",
      list: "set-list"
    }), /*#__PURE__*/React.createElement("datalist", {
      id: "set-list"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "row mb-2"
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
    }, /*#__PURE__*/React.createElement(CategoryModalButton, null))), /*#__PURE__*/React.createElement("div", {
      className: "row mb-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col-12"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-check form-switch"
    }, /*#__PURE__*/React.createElement("input", {
      className: "form-check-input",
      type: "checkbox",
      role: "switch",
      id: "toggle-regex",
      checked: this.state.regex,
      onChange: this.onRegexChange
    }), /*#__PURE__*/React.createElement("label", {
      className: "form-check-label",
      htmlFor: "toggle-regex"
    }, "Search using regular expression"), /*#__PURE__*/React.createElement("a", {
      href: "https://www.sitepoint.com/learn-regex/"
    }, " What's this?"))))), this.state.currentlySearching ? /*#__PURE__*/React.createElement("div", {
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

// eslint-disable-next-line no-undef
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render( /*#__PURE__*/React.createElement(QueryForm, null));

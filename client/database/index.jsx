const CATEGORY_BUTTONS = [
    ['Literature', 'primary'],
    ['History', 'success'],
    ['Science', 'danger'],
    ['Fine Arts', 'warning'],
    ['Religion', 'secondary'],
    ['Mythology', 'secondary'],
    ['Philosophy', 'secondary'],
    ['Social Science', 'secondary'],
    ['Current Events', 'secondary'],
    ['Geography', 'secondary'],
    ['Other Academic', 'secondary'],
    ['Trash', 'secondary'],
];

const SUBCATEGORY_BUTTONS = [
    ['American Literature', 'primary'],
    ['British Literature', 'primary'],
    ['Classical Literature', 'primary'],
    ['European Literature', 'primary'],
    ['World Literature', 'primary'],
    ['Other Literature', 'primary'],
    ['American History', 'success'],
    ['Ancient History', 'success'],
    ['European History', 'success'],
    ['World History', 'success'],
    ['Other History', 'success'],
    ['Biology', 'danger'],
    ['Chemistry', 'danger'],
    ['Physics', 'danger'],
    ['Math', 'danger'],
    ['Other Science', 'danger'],
    ['Visual Fine Arts', 'warning'],
    ['Auditory Fine Arts', 'warning'],
    ['Other Fine Arts', 'warning'],
];

let validCategories = [];
let validSubcategories = [];


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


function highlightTossupQuery({ tossup, queryString, regex = false, searchType = 'all' }) {
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


function highlightBonusQuery({ bonus, queryString, regex = false, searchType = 'all' }) {
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
    reportQuestion(
        document.getElementById('report-question-id').value,
        document.getElementById('report-question-reason').value,
        document.getElementById('report-question-description').value
    );
});


// eslint-disable-next-line no-undef
class TossupCard extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const tossup = this.props.tossup;
        const powerParts = tossup.question.split('(*)');
        return (
            <div className="card my-2">
                <div className="card-header">
                    <b>{tossup.setName} | {tossup.category} | {tossup.subcategory}</b>
                    <b className="float-end">Packet {tossup.packetNumber} | Question {tossup.questionNumber}</b>
                </div>
                <div className="card-container">
                    <div className="card-body">
                        <span dangerouslySetInnerHTML={{ __html: powerParts.length > 1 ? '<b>' + powerParts[0] + '(*)</b>' + powerParts[1] : tossup.question }}></span>&nbsp;
                        <a href="#" onClick={() => { document.getElementById('report-question-id').value = tossup._id; }} id={`report-question-${tossup._id}`} data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>
                        <hr></hr>
                        <div><b>ANSWER:</b> <span dangerouslySetInnerHTML={{ __html: tossup.answer }}></span></div>
                    </div>
                </div>
            </div>
        );
    }
}


// eslint-disable-next-line no-undef
class BonusCard extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const bonus = this.props.bonus;
        return (
            <div className="card my-2">
                <div className="card-header">
                    <b>{bonus.setName} | {bonus.category} | {bonus.subcategory}</b>
                    <b className="float-end">Packet {bonus.packetNumber} | Question {bonus.questionNumber}</b>
                </div>
                <div className="card-container">
                    <div className="card-body">
                        <p dangerouslySetInnerHTML={{ __html: bonus.leadin }}></p>
                        {[0, 1, 2].map((i) =>
                            <div key={`${bonus._id}-${i}`}>
                                <hr></hr>
                                <p>[10] <span dangerouslySetInnerHTML={{ __html: bonus.parts[i] }}></span></p>
                                <div><b>ANSWER:</b> <span dangerouslySetInnerHTML={{ __html: bonus.answers[i] }}></span></div>
                            </div>
                        )}
                        {/* <a href="#" id={`report-question-${bonus._id}`} data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a> */}
                    </div>
                </div>
            </div>
        );
    }
}


// eslint-disable-next-line no-undef
class CategoryModalButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <button type="button" className="btn btn-danger" id="category-select-button" data-bs-toggle="modal" data-bs-target="#category-modal">Categories</button>
        );
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
        return (<div>
            <input type="checkbox" className="btn-check" autoComplete="off" id={category} />
            <label className={`btn btn-outline-${this.props.color} w-100 rounded-0 my-1`} htmlFor={category}>{category}<br /></label>
        </div>);
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
        return (<div>
            <input type="checkbox" className="btn-check" autoComplete="off" id={subcategory} />
            <label className={`btn btn-outline-${this.props.color} w-100 rounded-0 my-1`} htmlFor={subcategory}>{subcategory}<br /></label>
        </div>);
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
        return (
            <div className="modal" id="category-modal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Select Categories and Subcategories</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-6" id="categories">
                                    <h5 className="text-center">Categories</h5>
                                    {CATEGORY_BUTTONS.map((element) => <CategoryButton key={element[0]} category={element[0]} color={element[1]} />)}
                                </div>
                                <div className="col-6" id="subcategories">
                                    <h5 className="text-center">Subcategories</h5>
                                    {SUBCATEGORY_BUTTONS.map((element) => <SubcategoryButton key={element[0]} subcategory={element[0]} color={element[1]} />)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
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

            currentlySearching: false,
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
        document.getElementById('randomize').addEventListener('click', (event) => {
            this.handleSubmit(event, true);
        });
        fetch('/api/set-list')
            .then(response => response.json())
            .then(data => {
                data.forEach(setName => {
                    const option = document.createElement('option');
                    option.innerHTML = setName;
                    document.getElementById('set-list').appendChild(option);
                });
            });
    }

    onDifficultyChange(event) {
        this.setState({ difficulties: event.target.value });
    }

    onMaxQueryReturnLengthChange(event) {
        this.setState({ maxQueryReturnLength: event.target.value });
    }

    onQueryChange(event) {
        this.setState({ queryString: event.target.value });
    }

    onSearchTypeChange(event) {
        this.setState({ searchType: event.target.value });
    }

    onQuestionTypeChange(event) {
        this.setState({ questionType: event.target.value });
    }

    onRegexChange(event) {
        this.setState({ regex: event.target.checked });
    }

    handleSubmit(event, randomize = false) {
        event.preventDefault();
        this.setState({ currentlySearching: true });

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
                setName: document.getElementById('set-name').value,
            })
        }).then(response => {
            if (response.status === 400) {
                throw new Error('Invalid query');
            }
            return response;
        })
            .then(response => response.json())
            .then(response => {
                const { tossups, bonuses } = response;
                const { count: tossupCount, questionArray: tossupArray } = tossups;

                for (let i = 0; i < tossupArray.length; i++) {
                    if (Object.prototype.hasOwnProperty.call(tossupArray[i], 'formatted_answer')) {
                        tossupArray[i].answer = tossupArray[i].formatted_answer;
                    }
                }

                if (this.state.queryString !== '') {
                    for (let i = 0; i < tossupArray.length; i++) {
                        tossupArray[i] = highlightTossupQuery({ tossup: tossupArray[i], queryString: this.state.queryString, searchType: this.state.searchType, regex: this.state.regex } );
                    }
                }

                this.setState({ tossupCount: tossupCount });
                this.setState({ tossups: tossupArray });

                const { count: bonusCount, questionArray: bonusArray } = bonuses;
                for (let i = 0; i < bonusArray.length; i++) {
                    if (Object.prototype.hasOwnProperty.call(bonusArray[i], 'formatted_answers'))
                        bonusArray[i].answers = bonusArray[i].formatted_answers;
                }

                if (this.state.queryString !== '') {
                    for (let i = 0; i < bonusArray.length; i++) {
                        bonusArray[i] = highlightBonusQuery({ bonus: bonusArray[i], queryString: this.state.queryString, searchType: this.state.searchType, regex: this.state.regex });
                    }
                }

                this.setState({ bonusCount: bonusCount });
                this.setState({ bonuses: bonusArray });
                this.setState({ currentlySearching: false });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Invalid query. Please check your search parameters and try again.');
                this.setState({ currentlySearching: false });
            });
    }

    render() {
        const tossupCards = this.state.tossups.map((tossup) =>
            <TossupCard key={tossup._id} tossup={tossup} />
        );
        const bonusCards = this.state.bonuses.map((bonus) =>
            <BonusCard key={bonus._id} bonus={bonus} />
        );

        return (
            <div>
                <CategoryModal />
                <form className="mt-3" onSubmit={this.handleSubmit}>
                    <div className="input-group mb-2">
                        <input type="text" className="form-control" id="query" placeholder="Query" value={this.state.queryString} onChange={this.onQueryChange}></input>
                        <button type="submit" className="btn btn-info">Search</button>
                        <button id="randomize" className="btn btn-success">Random</button>
                    </div>
                    <div className="row mb-2">
                        <div id="difficulty-settings" className="col-2">
                            <input type="text" className="form-control" id="difficulties" placeholder="Difficulties (1-10)" value={this.state.difficulties} onChange={this.onDifficultyChange} />
                        </div>
                        <div id="max-query-length" className="col-3">
                            <input type="text" className="form-control" id="difficulties" placeholder="Max # to Display (default: 50)" value={this.state.maxQueryReturnLength} onChange={this.onMaxQueryReturnLengthChange} />
                        </div>
                        <div className="col-7">
                            <input type="text" className="form-control" id="set-name" placeholder="Set Name" list="set-list" />
                            <datalist id="set-list"></datalist>
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-5">
                            <select className="form-select" id="search-type" value={this.state.searchType} onChange={this.onSearchTypeChange}>
                                <option value="all">All text (question and answer)</option>
                                <option value="question">Question</option>
                                <option value="answer">Answer</option>
                            </select>
                        </div>
                        <div className="col-5">
                            <select className="form-select disabled" id="question-type" value={this.state.questionType} onChange={this.onQuestionTypeChange}>
                                <option value="all">All questions (tossups and bonuses)</option>
                                <option value="tossup">Tossups</option>
                                <option value="bonus">Bonuses</option>
                            </select>
                        </div>
                        <div className="col-2">
                            <CategoryModalButton />
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-12">
                            <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" role="switch" id="toggle-regex" checked={this.state.regex} onChange={this.onRegexChange} />
                                <label className="form-check-label" htmlFor="toggle-regex">Search using regular expression</label>
                                <a href="https://www.sitepoint.com/learn-regex/"> What&apos;s this?</a>
                            </div>
                        </div>
                    </div>
                </form>

                {this.state.currentlySearching ? <div className="d-block mx-auto mt-3 spinner-border" role="status"><span className="d-none">Loading...</span></div> : null
                }
                <div className="row text-center"><h3 className="mt-3" id="tossups">Tossups</h3></div>
                {
                    this.state.tossupCount > 0
                        ? <p><div className="text-muted float-start">Showing {this.state.tossups.length} out of {this.state.tossupCount} results</div>&nbsp;
                            <div className="text-muted float-end"><a href="#bonuses">Jump to bonuses</a></div></p>
                        : <p className="text-muted">No tossups found</p>
                }
                <div>{tossupCards}</div>
                <p className="mb-5"></p>
                <div className="row text-center"><h3 className="mt-3" id="bonuses">Bonuses</h3></div>
                {
                    this.state.bonusCount > 0
                        ? <p><div className="text-muted float-start">Showing {this.state.bonuses.length} out of {this.state.bonusCount} results</div>&nbsp;
                            <div className="text-muted float-end"><a href="#tossups">Jump to tossups</a></div></p>
                        : <p className="text-muted">No bonuses found</p>
                }
                <div>{bonusCards}</div>
                <p className="mb-5"></p>
            </div>
        );
    }
}


// eslint-disable-next-line no-undef
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<QueryForm />);

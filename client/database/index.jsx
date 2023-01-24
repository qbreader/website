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


function downloadQuestionsAsJSON(tossups, bonuses, filename = 'data.json') {
    const JSONdata = { tossups, bonuses };
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


function highlightTossupQuery({ tossup, queryString, regex = false, searchType = 'all' }) {
    if (!regex) {
        queryString = escapeRegExp(queryString);
    }

    if (searchType === 'question' || searchType === 'all') {
        tossup.question = tossup.question.replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
    }

    if (searchType === 'answer' || searchType === 'all') {
        if (tossup.formatted_answer) {
            tossup.formatted_answer = tossup.formatted_answer.replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
        } else {
            tossup.answer = tossup.answer.replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
        }
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
        if (bonus.formatted_answers) {
            for (let i = 0; i < bonus.answers.length; i++) {
                bonus.formatted_answers[i] = bonus.formatted_answers[i].replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
            }
        } else {
            for (let i = 0; i < bonus.answers.length; i++) {
                bonus.answers[i] = bonus.answers[i].replace(RegExp(queryString, 'ig'), '<span class="text-highlight">$&</span>');
            }
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


function TossupCard({ tossup }) {
    const _id = tossup._id;
    const powerParts = tossup.question.split('(*)');

    function onClick() {
        document.getElementById('report-question-id').value = _id;
    }

    return (
        <div className="card my-2">
            <div className="card-header">
                <b>{tossup.setName} | {tossup.category} | {tossup.subcategory} {tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | {tossup.difficulty}</b>
                <b className="float-end">Packet {tossup.packetNumber} | Question {tossup.questionNumber}</b>
            </div>
            <div className="card-container">
                <div className="card-body">
                    <span dangerouslySetInnerHTML={{ __html: powerParts.length > 1 ? '<b>' + powerParts[0] + '(*)</b>' + powerParts[1] : tossup.question }}></span>&nbsp;
                    <a href="#" onClick={onClick} id={`report-question-${_id}`} data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>
                    <hr></hr>
                    <div><b>ANSWER:</b> <span dangerouslySetInnerHTML={{ __html: tossup?.formatted_answer ?? tossup.answer }}></span></div>
                </div>
            </div>
        </div>
    );
}


function BonusCard({ bonus }) {
    const _id = bonus._id;
    const bonusLength = bonus.parts.length;
    const indices = [];

    for (let i = 0; i < bonusLength; i++) {
        indices.push(i);
    }

    function onClick() {
        document.getElementById('report-question-id').value = _id;
    }

    return (
        <div className="card my-2">
            <div className="card-header">
                <b>{bonus.setName} | {bonus.category} | {bonus.subcategory} {bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : ''} | {bonus.difficulty}</b>
                <b className="float-end">Packet {bonus.packetNumber} | Question {bonus.questionNumber}</b>
            </div>
            <div className="card-container">
                <div className="card-body">
                    <p dangerouslySetInnerHTML={{ __html: bonus.leadin }}></p>
                    {indices.map((i) =>
                        <div key={`${bonus._id}-${i}`}>
                            <hr></hr>
                            <p>
                                [10]&nbsp;
                                <span dangerouslySetInnerHTML={{ __html: bonus.parts[i] }}></span>&nbsp;
                                {
                                    i + 1 === bonusLength &&
                                    <a href="#" onClick={onClick} id={`report-question-${_id}`} data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>
                                }
                            </p>
                            <div><b>ANSWER:</b> <span dangerouslySetInnerHTML={{ __html: (bonus?.formatted_answers ?? bonus.answers)[i] }}></span></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


// eslint-disable-next-line no-undef
function CategoryButton({ category, color }) {
    function handleClick() {
        [validCategories, validSubcategories] = updateCategory(category, validCategories, validSubcategories);
        loadCategoryModal(validCategories, validSubcategories);
    }

    return (<div>
        <input type="checkbox" className="btn-check" autoComplete="off" id={category} onClick={handleClick}/>
        <label className={`btn btn-outline-${color} w-100 rounded-0 my-1`} htmlFor={category}>{category}<br /></label>
    </div>);
}


function SubcategoryButton({ subcategory, color, hidden = false }) {
    function handleClick() {
        validSubcategories = updateSubcategory(subcategory, validSubcategories);
        loadCategoryModal(validCategories, validSubcategories);
    }

    return (<div>
        <input type="checkbox" className="btn-check" autoComplete="off" id={subcategory} onClick={handleClick}/>
        <label className={`btn btn-outline-${color} w-100 rounded-0 my-1 ${hidden && 'd-none'}`} htmlFor={subcategory}>{subcategory}<br /></label>
    </div>);
}


function CategoryModal() {
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
                                <div className="text-muted text-center" id="subcategory-info-text">
                                    You must select categories before you can select subcategories.
                                </div>
                                {SUBCATEGORY_BUTTONS.map((element) => <SubcategoryButton key={element[0]} subcategory={element[0]} color={element[1]} hidden={true}/>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


function QueryForm() {
    const [tossups, setTossups] = React.useState([]);
    const [bonuses, setBonuses] = React.useState([]);
    const [tossupCount, setTossupCount] = React.useState(0);
    const [bonusCount, setBonusCount] = React.useState(0);
    const [difficulties, setDifficulties] = React.useState('');
    const [maxQueryReturnLength, setMaxQueryReturnLength] = React.useState('');
    const [queryString, setQueryString] = React.useState('');
    const [questionType, setQuestionType] = React.useState('all');
    const [regex, setRegex] = React.useState(false);
    const [searchType, setSearchType] = React.useState('all');
    const [currentlySearching, setCurrentlySearching] = React.useState(false);

    React.useEffect(() => {
        fetch('/api/set-list')
            .then(response => response.json())
            .then(data => {
                data.forEach(setName => {
                    document.getElementById('set-list').innerHTML += `<option>${setName}</option>`;
                });
            });
    }, []);

    function handleSubmit(event, randomize = false) {
        event.preventDefault();
        setCurrentlySearching(true);

        fetch('/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                categories: validCategories,
                subcategories: validSubcategories,
                difficulties: rangeToArray(difficulties),
                maxReturnLength: maxQueryReturnLength,
                queryString: queryString,
                questionType: questionType,
                randomize: randomize,
                regex: regex,
                searchType: searchType,
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

                if (queryString !== '') {
                    for (let i = 0; i < tossupArray.length; i++) {
                        tossupArray[i] = highlightTossupQuery({ tossup: tossupArray[i], queryString, searchType, regex } );
                    }
                }

                setTossupCount(tossupCount);
                setTossups(tossupArray);

                const { count: bonusCount, questionArray: bonusArray } = bonuses;

                if (queryString !== '') {
                    for (let i = 0; i < bonusArray.length; i++) {
                        bonusArray[i] = highlightBonusQuery({ bonus: bonusArray[i], queryString, searchType, regex });
                    }
                }

                setBonusCount(bonusCount);
                setBonuses(bonusArray);

                setCurrentlySearching(false);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Invalid query. Please check your search parameters and try again.');
                setCurrentlySearching(false);
            });
    }

    const tossupCards = tossups.map(tossup => <TossupCard key={tossup._id} tossup={tossup} />);
    const bonusCards = bonuses.map(bonus => <BonusCard key={bonus._id} bonus={bonus} />);

    return (
        <div>
            <CategoryModal />
            <form className="mt-3" onSubmit={event => {handleSubmit(event);}}>
                <div className="input-group mb-2">
                    <input type="text" className="form-control" id="query" placeholder="Query" value={queryString} onChange={event => {setQueryString(event.target.value);}}></input>
                    <button type="submit" className="btn btn-info">Search</button>
                    <button id="randomize" className="btn btn-success" onClick={event => {handleSubmit(event, true);}}>Random</button>
                </div>
                <div className="row">
                    <div id="difficulty-settings" className="col-6 col-xl-3 mb-2">
                        <input type="text" className="form-control" id="difficulties" placeholder="Difficulties (1-10)" value={difficulties} onChange={event => {setDifficulties(event.target.value);}} />
                    </div>
                    <div id="max-query-return-length" className="col-6 col-xl-3 mb-2">
                        <input type="text" className="form-control" id="difficulties" placeholder="Max # to Display (default: 50)" value={maxQueryReturnLength} onChange={event => {setMaxQueryReturnLength(event.target.value);}} />
                    </div>
                    <div className="input-group col-12 col-xl-6 mb-2">
                        <input type="text" className="form-control" id="set-name" placeholder="Set Name" list="set-list" />
                        <datalist id="set-list"></datalist>
                        <button type="button" className="btn btn-danger" id="category-select-button" data-bs-toggle="modal" data-bs-target="#category-modal">Categories</button>
                    </div>
                </div>
                <div className="row mb-2">
                    <div className="col-6">
                        <select className="form-select" id="search-type" value={searchType} onChange={event => {setSearchType(event.target.value);}}>
                            <option value="all">All text</option>
                            <option value="question">Question</option>
                            <option value="answer">Answer</option>
                        </select>
                    </div>
                    <div className="col-6">
                        <select className="form-select disabled" id="question-type" value={questionType} onChange={event => {setQuestionType(event.target.value);}}>
                            <option value="all">All questions</option>
                            <option value="tossup">Tossups</option>
                            <option value="bonus">Bonuses</option>
                        </select>
                    </div>
                </div>
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="form-check form-switch d-inline-block">
                            <input className="form-check-input" type="checkbox" role="switch" id="toggle-regex" checked={regex} onChange={() => {setRegex(!regex);}} />
                            <label className="form-check-label" htmlFor="toggle-regex">Search using regular expression</label>
                            <a href="https://www.sitepoint.com/learn-regex/"> What&apos;s this?</a>
                        </div>
                        <div className="float-end">
                            <b>Download as:</b>
                            <a className="ms-2 download-link" onClick={() => {downloadQuestionsAsText(tossups, bonuses);}}>TXT</a>
                            <a className="ms-2 btn-link disabled">CSV</a>
                            <a className="ms-2 download-link" onClick={() => {downloadQuestionsAsJSON(tossups, bonuses);}}>JSON</a>
                        </div>
                    </div>
                </div>
            </form>

            { currentlySearching && <div className="d-block mx-auto mt-3 spinner-border" role="status"><span className="d-none">Loading...</span></div> }
            <div className="row text-center"><h3 className="mt-2" id="tossups">Tossups</h3></div>
            {
                tossupCount > 0
                    ? <p><span className="text-muted float-start">Showing {tossups.length} of {tossupCount} results</span>&nbsp;
                        <span className="text-muted float-end"><a href="#bonuses">Jump to bonuses</a></span></p>
                    : <p className="text-muted">No tossups found</p>
            }
            <div>{tossupCards}</div>
            <div className="mb-5"></div>
            <div className="row text-center"><h3 className="mt-3" id="bonuses">Bonuses</h3></div>
            {
                bonusCount > 0
                    ? <p><span className="text-muted float-start">Showing {bonuses.length} of {bonusCount} results</span>&nbsp;
                        <span className="text-muted float-end"><a href="#tossups">Jump to tossups</a></span></p>
                    : <p className="text-muted">No bonuses found</p>
            }
            <div>{bonusCards}</div>
            <div className="mb-5"></div>
        </div>
    );
}


// eslint-disable-next-line no-undef
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<QueryForm />);

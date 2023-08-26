const paginationShiftLength = screen.width > 992 ? 10 : 5;

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

function escapeCSVString(string) {
    if (string === undefined || string === null)
        return '';

    if (typeof string !== 'string')
        string = string.toString();

    return `"${string.replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
}

function downloadTossupsAsCSV(tossups, filename = 'tossups.csv') {
    const header = [
        '_id',
        'question',
        'answer',
        'formatted_answer',
        'category',
        'subcategory',
        'setName',
        'packetNumber',
        'questionNumber',
        'difficulty',
        'setYear',
        'set',
        'packet',
        'createdAt',
        'updatedAt',
    ];

    let csvdata = header.join(',') + '\n';
    for (const tossup of tossups) {
        for (const key of header)
            csvdata += escapeCSVString(tossup[key]) + ',';

        csvdata = csvdata.slice(0, -1);
        csvdata += '\n';
    }

    const hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csvdata);
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
}


function downloadBonusesAsCSV(bonuses, filename = 'bonuses.csv') {
    const header = [
        '_id',
        'leadin',
        'parts.0',
        'parts.1',
        'parts.2',
        'answers.0',
        'answers.1',
        'answers.2',
        'formatted_answers.0',
        'formatted_answers.1',
        'formatted_answers.2',
        'category',
        'subcategory',
        'setName',
        'packetNumber',
        'questionNumber',
        'difficulty',
        'setYear',
        'set',
        'packet',
        'createdAt',
        'updatedAt',
    ];

    let csvdata = header.join(',') + '\n';
    for (const bonus of bonuses) {
        for (const key of header) {
            if (key.includes('parts') || key.includes('answers') || key.includes('formatted_answers')) {
                const [mainKey, index] = key.split('.');
                if (mainKey in bonus) {
                    csvdata += escapeCSVString(bonus[mainKey][index]) + ',';
                } else {
                    csvdata += ',';
                }
            } else {
                csvdata += escapeCSVString(bonus[key]) + ',';
            }
        }

        csvdata = csvdata.slice(0, -1);
        csvdata += '\n';
    }

    const hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csvdata);
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
}


function downloadQuestionsAsText(tossups, bonuses, filename = 'data.txt') {
    let textdata = '';
    for (let tossup of tossups) {
        textdata += `${tossup.set.name} Packet ${tossup.packet.number}\n`;
        textdata += `Question ID: ${tossup._id}\n`;
        textdata += `${tossup.questionNumber}. ${tossup.question}\n`;
        textdata += `ANSWER: ${tossup.answer}\n`;
        textdata += `<${tossup.category} / ${tossup.subcategory}>\n\n`;
    }

    for (let bonus of bonuses) {
        textdata += `${bonus.set.name} Packet ${bonus.packet.number}\n`;
        textdata += `Question ID: ${bonus._id}\n`;
        textdata += `${bonus.questionNumber}. ${bonus.leadin}\n`;
        for (let i = 0; i < bonus.parts.length; i++) {
            textdata += `${getBonusPartLabel(bonus, i)} ${bonus.parts[i]}\nANSWER: ${bonus.answers[i]}\n`;
        }
        textdata += `<${bonus.category} / ${bonus.subcategory}>\n\n`;
    }

    const hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text;charset=utf-8,' + encodeURIComponent(textdata);
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
}


/**
 * Return a string that represents the bonus part label for the given bonus and index.
 * For example, '[10m]' or '[10]'.
 * @param {*} bonus
 * @param {*} index
 * @param {*} defaultValue
 * @param {*} defaultDifficulty
 * @returns {String}
 */
function getBonusPartLabel(bonus, index, defaultValue = 10, defaultDifficulty = '') {
    const value = bonus.values ? (bonus.values[index] ?? defaultValue) : defaultValue;
    const difficulty = bonus.difficulties ? (bonus.difficulties[index] ?? defaultDifficulty) : defaultDifficulty;
    return `[${value}${difficulty}]`;
}


function highlightTossupQuery({ tossup, regExp, searchType = 'all' }) {
    if (searchType === 'question' || searchType === 'all')
        tossup.question = tossup.question.replace(regExp, '<span class="text-highlight">$&</span>');

    if (searchType === 'answer' || searchType === 'all') {
        if (tossup.formatted_answer) {
            tossup.formatted_answer = tossup.formatted_answer.replace(regExp, '<span class="text-highlight">$&</span>');
        } else {
            tossup.answer = tossup.answer.replace(regExp, '<span class="text-highlight">$&</span>');
        }
    }

    return tossup;
}


function highlightBonusQuery({ bonus, regExp, searchType = 'all' }) {
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


function TossupCard({ tossup, highlightedTossup, showCardFooter }) {
    const _id = tossup._id;
    const packetName = tossup.packet.name;

    function clickToCopy() {
        let textdata = `${tossup.question}\nANSWER: ${tossup.answer}`;

        if (tossup.category && tossup.subcategory && tossup.category !== tossup.subcategory) {
            textdata += `\n<${tossup.category} / ${tossup.subcategory}>`;
        } else if (tossup.category) {
            textdata += `\n<${tossup.category}>`;
        } else if (tossup.subcategory) {
            textdata += `\n<${tossup.subcategory}>`;
        }

        navigator.clipboard.writeText(textdata);

        const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
        toast.show();
    }

    function onClick() {
        document.getElementById('report-question-id').value = _id;
    }

    function showTossupStats() {
        fetch('/auth/stats/single-tossup?' + new URLSearchParams({ tossup_id: _id }))
            .then(response => {
                switch (response.status) {
                case 401:
                    document.getElementById('tossup-stats-body').textContent = 'You need to make an account with a verified email to view question stats.';
                    deleteAccountUsername();
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
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    const powerParts = highlightedTossup.question.split('(*)');

    return (
        <div className="card my-2">
            <div className="card-header d-flex justify-content-between">
                <b className="clickable" onClick={clickToCopy}>
                    {tossup.set.name} | {tossup.category} | {tossup.subcategory} {tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | {tossup.difficulty}
                </b>
                <b className="clickable" data-bs-toggle="collapse" data-bs-target={`#question-${_id}`}>
                    Packet {tossup.packet.number} | Question {tossup.questionNumber}
                </b>
            </div>
            <div className="card-container collapse show" id={`question-${_id}`}>
                <div className="card-body">
                    <span dangerouslySetInnerHTML={{
                        __html: powerParts.length > 1 ? '<b>' + powerParts[0] + '(*)</b>' + powerParts[1] : highlightedTossup.question,
                    }}></span>
                    <hr className="my-3"></hr>
                    <div><b>ANSWER:</b> <span dangerouslySetInnerHTML={{
                        __html: highlightedTossup?.formatted_answer ?? highlightedTossup.answer,
                    }}></span></div>
                </div>
                <div className={`card-footer ${!showCardFooter && 'd-none'}`} onClick={showTossupStats} data-bs-toggle="modal" data-bs-target="#tossup-stats-modal">
                    <small className="text-muted">{packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
                    <small className="text-muted float-end">
                        <a href="#" onClick={onClick} id={`report-question-${_id}`} data-bs-toggle="modal" data-bs-target="#report-question-modal">
                            Report Question
                        </a>
                    </small>
                </div>
            </div>
        </div>
    );
}


function BonusCard({ bonus, highlightedBonus, showCardFooter }) {
    const _id = bonus._id;
    const packetName = bonus.packet.name;
    const bonusLength = bonus.parts.length;
    const indices = [];

    for (let i = 0; i < bonusLength; i++) {
        indices.push(i);
    }

    function clickToCopy() {
        let textdata = `${bonus.leadin}\n`;
        for (let i = 0; i < bonus.parts.length; i++) {
            textdata += `${getBonusPartLabel(bonus, i)} ${bonus.parts[i]}\n`;
            textdata += `ANSWER: ${bonus.answers[i]}\n`;
        }

        if (bonus.category && bonus.subcategory && bonus.category !== bonus.subcategory) {
            textdata += `<${bonus.category} / ${bonus.subcategory}>`;
        } else if (bonus.category) {
            textdata += `<${bonus.category}>`;
        } else if (bonus.subcategory) {
            textdata += `<${bonus.subcategory}>`;
        }

        navigator.clipboard.writeText(textdata);

        const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
        toast.show();
    }

    function onClick() {
        document.getElementById('report-question-id').value = _id;
    }

    function showBonusStats() {
        fetch('/auth/stats/single-bonus?' + new URLSearchParams({ bonus_id: _id }))
            .then(response => {
                switch (response.status) {
                case 401:
                    document.getElementById('bonus-stats-body').textContent = 'You need to make an account with a verified email to view question stats.';
                    deleteAccountUsername();
                    throw new Error('Unauthenticated');
                case 403:
                    document.getElementById('bonus-stats-body').textContent = 'You need verify your account email to view question stats.';
                    throw new Error('Forbidden');
                }
                return response;
            })
            .then(response => response.json())
            .then(response => {
                document.getElementById('bonus-stats-question-id').value = _id;
                const { stats } = response;
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
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    return (
        <div className="card my-2">
            <div className="card-header d-flex justify-content-between">
                <b className="clickable" onClick={clickToCopy}>
                    {bonus.set.name} | {bonus.category} | {bonus.subcategory} {bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : ''} | {bonus.difficulty}
                </b>
                <b className="clickable" data-bs-toggle="collapse" data-bs-target={`#question-${_id}`}>
                    Packet {bonus.packet.number} | Question {bonus.questionNumber}
                </b>
            </div>
            <div className="card-container collapse show" id={`question-${_id}`}>
                <div className="card-body">
                    <p dangerouslySetInnerHTML={{ __html: highlightedBonus.leadin }}></p>
                    {indices.map((i) =>
                        <div key={`${bonus._id}-${i}`}>
                            <hr></hr>
                            <p>
                                <span>{getBonusPartLabel(bonus, i)} </span>
                                <span dangerouslySetInnerHTML={{ __html: highlightedBonus.parts[i] }}></span>
                            </p>
                            <div>
                                <b>ANSWER: </b>
                                <span dangerouslySetInnerHTML={{ __html: (highlightedBonus?.formatted_answers ?? highlightedBonus.answers)[i] }}></span>
                            </div>
                        </div>,
                    )}
                </div>
                <div className={`card-footer ${!showCardFooter && 'd-none'}`} onClick={showBonusStats} data-bs-toggle="modal" data-bs-target="#bonus-stats-modal">
                    <small className="text-muted">{packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
                    <small className="text-muted float-end">
                        <a href="#" onClick={onClick} id={`report-question-${_id}`} data-bs-toggle="modal" data-bs-target="#report-question-modal">
                            Report Question
                        </a>
                    </small>
                </div>
            </div>
        </div>
    );
}


// eslint-disable-next-line no-undef
function CategoryButton({ category, color }) {
    function handleClick() {
        ({ categories: validCategories, subcategories: validSubcategories } = updateCategory(category, validCategories, validSubcategories));
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
    const [highlightedTossups, setHighlightedTossups] = React.useState([]);
    const [highlightedBonuses, setHighlightedBonuses] = React.useState([]);
    const [tossupCount, setTossupCount] = React.useState(0);
    const [bonusCount, setBonusCount] = React.useState(0);

    const [difficulties, setDifficulties] = React.useState([]);
    const [maxReturnLength, setMaxReturnLength] = React.useState('');
    const [queryString, setQueryString] = React.useState('');
    const [questionType, setQuestionType] = React.useState('all');
    const [searchType, setSearchType] = React.useState('all');
    const [minYear, setMinYear] = React.useState('');
    const [maxYear, setMaxYear] = React.useState('');

    const [regex, setRegex] = React.useState(false);
    const [diacritics, setDiacritics] = React.useState(false);
    const [exactPhrase, setExactPhrase] = React.useState(false);
    const [powermarkOnly, setPowermarkOnly] = React.useState(false);
    const [showCardFooters, setShowCardFooters] = React.useState(true);

    const [currentlySearching, setCurrentlySearching] = React.useState(false);

    let [tossupPaginationNumber, setTossupPaginationNumber] = React.useState(1);
    let [bonusPaginationNumber, setBonusPaginationNumber] = React.useState(1);
    const [tossupPaginationLength, setTossupPaginationLength] = React.useState(1);
    const [bonusPaginationLength, setBonusPaginationLength] = React.useState(1);
    const [tossupPaginationShift, setTossupPaginationShift] = React.useState(0);
    const [bonusPaginationShift, setBonusPaginationShift] = React.useState(0);

    const [queryTime, setQueryTime] = React.useState(0);

    React.useEffect(() => {
        fetch('/api/set-list')
            .then(response => response.json())
            .then(data => data.setList)
            .then(data => {
                document.getElementById('set-list').innerHTML = data.map(setName => `<option>${setName}</option>`).join('');
            });
    }, []);

    function arrayBetween(start, end) {
        return Array(end - start).fill().map((_, idx) => start + idx);
    }

    function getMaxPagination() {
        return Math.floor(10000 / (maxReturnLength || 25));
    }

    function handleTossupPaginationClick(event, value) {
        event.preventDefault();

        switch (value) {
        case 'first':
            tossupPaginationNumber = 1;
            break;
        case 'previous':
            tossupPaginationNumber = Math.max(1, tossupPaginationNumber - 1);
            break;
        case 'next':
            tossupPaginationNumber = Math.min(tossupPaginationLength, tossupPaginationNumber + 1, getMaxPagination());
            break;
        case 'last':
            tossupPaginationNumber = Math.min(tossupPaginationLength, getMaxPagination());
            break;
        default:
            tossupPaginationNumber = value;
            break;
        }

        setTossupPaginationNumber(tossupPaginationNumber);
        setTossupPaginationShift(paginationShiftLength * Math.floor((tossupPaginationNumber - 1) / paginationShiftLength));
        handleSubmit(event, false, true);
    }

    function handleBonusPaginationClick(event, value) {
        event.preventDefault();

        switch (value) {
        case 'first':
            bonusPaginationNumber = 1;
            break;
        case 'previous':
            bonusPaginationNumber = Math.max(1, bonusPaginationNumber - 1);
            break;
        case 'next':
            bonusPaginationNumber = Math.min(bonusPaginationLength, bonusPaginationNumber + 1, getMaxPagination());
            break;
        case 'last':
            bonusPaginationNumber = Math.min(bonusPaginationLength, getMaxPagination());
            break;
        default:
            bonusPaginationNumber = value;
            break;
        }

        setBonusPaginationNumber(bonusPaginationNumber);
        setBonusPaginationShift(paginationShiftLength * Math.floor((bonusPaginationNumber - 1) / paginationShiftLength));
        handleSubmit(event, false, true);
    }

    function handleSubmit(event, randomize = false, paginationUpdate = false) {
        const startTime = performance.now();

        event.preventDefault();
        setCurrentlySearching(true);

        if (randomize || !paginationUpdate) {
            tossupPaginationNumber = 1;
            bonusPaginationNumber = 1;
            setTossupPaginationNumber(tossupPaginationNumber);
            setBonusPaginationNumber(bonusPaginationNumber);
        }

        fetch('/api/query?' + new URLSearchParams({
            queryString,
            categories: validCategories,
            subcategories: validSubcategories,
            difficulties,
            maxReturnLength,
            questionType,
            randomize,
            exactPhrase,
            ignoreDiacritics: diacritics,
            powermarkOnly,
            regex,
            searchType,
            setName: document.getElementById('set-name').value,
            tossupPagination: tossupPaginationNumber,
            bonusPagination: bonusPaginationNumber,
            minYear,
            maxYear,
        }))
            .then(response => {
                if (response.status === 400) {
                    throw new Error('Invalid query');
                }
                return response;
            })
            .then(response => response.json())
            .then(response => {
                const { tossups, bonuses, queryString: modifiedQueryString } = response;
                const regExp = RegExp(modifiedQueryString, 'ig');
                const workingMaxReturnLength = Math.max(1, maxReturnLength || 25);

                const { count: tossupCount, questionArray: tossupArray } = tossups;
                setTossupCount(tossupCount);
                setTossups(tossupArray);

                // create deep copy to highlight
                const highlightedTossupArray = JSON.parse(JSON.stringify(tossupArray));
                if (queryString !== '') {
                    for (let i = 0; i < highlightedTossupArray.length; i++) {
                        highlightedTossupArray[i] = highlightTossupQuery({ tossup: highlightedTossupArray[i], regExp, searchType, regex } );
                    }
                }
                setHighlightedTossups(highlightedTossupArray);

                const { count: bonusCount, questionArray: bonusArray } = bonuses;
                setBonusCount(bonusCount);
                setBonuses(bonusArray);

                const highlightedBonusArray = JSON.parse(JSON.stringify(bonusArray));
                if (queryString !== '') {
                    for (let i = 0; i < highlightedBonusArray.length; i++) {
                        highlightedBonusArray[i] = highlightBonusQuery({ bonus: highlightedBonusArray[i], regExp, searchType, regex });
                    }
                }
                setHighlightedBonuses(highlightedBonusArray);

                if (randomize) {
                    setTossupPaginationLength(1);
                    setBonusPaginationLength(1);
                } else {
                    setTossupPaginationLength(Math.ceil(tossupCount / workingMaxReturnLength));
                    setBonusPaginationLength(Math.ceil(bonusCount / workingMaxReturnLength));
                }

                setTossupPaginationShift(paginationShiftLength * Math.floor((tossupPaginationNumber - 1) / paginationShiftLength));
                setBonusPaginationShift(paginationShiftLength * Math.floor((bonusPaginationNumber - 1) / paginationShiftLength));

                const endTime = performance.now();
                const timeElapsed = ((endTime - startTime) / 1000).toFixed(2);
                setQueryTime(timeElapsed);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Invalid query. Please check your search parameters and try again.');
            })
            .finally(() => {
                setCurrentlySearching(false);
            });
    }

    const tossupCards = [];
    for (let i = 0; i < highlightedTossups.length; i++) {
        tossupCards.push(<TossupCard key={i} tossup={tossups[i]} highlightedTossup={highlightedTossups[i]} showCardFooter={showCardFooters}/>);
    }

    const bonusCards = [];
    for (let i = 0; i < highlightedBonuses.length; i++) {
        bonusCards.push(<BonusCard key={i} bonus={bonuses[i]} highlightedBonus={highlightedBonuses[i]} showCardFooter={showCardFooters}/>);
    }

    React.useEffect(() => {
        Array.from(document.querySelectorAll('.checkbox-menu input[type=\'checkbox\']')).forEach(input => {
            input.addEventListener('change', function () {
                if (input.checked)
                    input.closest('li').classList.add('active');
                else
                    input.closest('li').classList.remove('active');
            });
        });

        Array.from(document.querySelectorAll('.allow-focus')).forEach(dropdown => {
            dropdown.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        });

        document.getElementById('difficulties').addEventListener('change', function () {
            const tempDifficulties = [];
            Array.from(document.getElementById('difficulties').children).forEach(li => {
                const input = li.querySelector('input');
                if (input.checked) {
                    tempDifficulties.push(parseInt(input.value));
                }
            });
            setDifficulties(tempDifficulties);
        });
    }, []);

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
                    <div className="col-6 col-xl-3 mb-2">
                        <div className="dropdown-checklist btn-group w-100">
                            <button className="btn btn-default text-start w-100" id="dropdownMenu1" data-bs-toggle="dropdown"
                                type="button" aria-expanded="true" aria-haspopup="true">
                            Difficulties
                            </button>
                            <button className="btn btn-default dropdown-toggle dropdown-toggle-split" type="button"></button>
                            <ul className="dropdown-menu checkbox-menu allow-focus" id="difficulties" aria-labelledby="dropdownMenu1">
                                <li><label><input type="checkbox" value="1" /> 1: Middle School</label></li>
                                <li><label><input type="checkbox" value="2" /> 2: Easy High School</label></li>
                                <li><label><input type="checkbox" value="3" /> 3: Regular High School</label></li>
                                <li><label><input type="checkbox" value="4" /> 4: Hard High School</label></li>
                                <li><label><input type="checkbox" value="5" /> 5: National High School</label></li>
                                <li><label><input type="checkbox" value="6" /> 6: ● / Easy College</label></li>
                                <li><label><input type="checkbox" value="7" /> 7: ●● / Medium College</label></li>
                                <li><label><input type="checkbox" value="8" /> 8: ●●● / Regionals College</label></li>
                                <li><label><input type="checkbox" value="9" /> 9: ●●●● / Nationals College</label></li>
                                <li><label><input type="checkbox" value="10"/> 10: Open</label></li>
                            </ul>
                        </div>
                    </div>
                    <div className="col-6 col-xl-3 mb-2">
                        <input type="number" className="form-control" id="max-return-length" placeholder="# to Display" value={maxReturnLength} onChange={event => {setMaxReturnLength(event.target.value);}} />
                    </div>
                    <div className="input-group col-12 col-xl-6 mb-2">
                        <input type="text" className="form-control" id="set-name" placeholder="Set Name" list="set-list" />
                        <datalist id="set-list"></datalist>
                        <button type="button" className="btn btn-danger" id="category-select-button" data-bs-toggle="modal" data-bs-target="#category-modal">Categories</button>
                    </div>
                </div>
                <div className="row">
                    <div className="col-6 col-md-3 mb-2">
                        <select className="form-select" id="search-type" value={searchType} onChange={event => {setSearchType(event.target.value);}}>
                            <option value="all">All text</option>
                            <option value="question">Question</option>
                            <option value="answer">Answer</option>
                        </select>
                    </div>
                    <div className="col-6 col-md-3 mb-2">
                        <select className="form-select" id="question-type" value={questionType} onChange={event => {setQuestionType(event.target.value);}}>
                            <option value="all">All questions</option>
                            <option value="tossup">Tossups</option>
                            <option value="bonus">Bonuses</option>
                        </select>
                    </div>
                    <div className="col-6 col-md-3 mb-2">
                        <input type="number" className="form-control" id="min-year" placeholder="Min Year" value={minYear} onChange={event => {setMinYear(event.target.value);}} />
                    </div>
                    <div className="col-6 col-md-3 mb-2">
                        <input type="number" className="form-control" id="max-year" placeholder="Max Year" value={maxYear} onChange={event => {setMaxYear(event.target.value);}} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" role="switch" id="toggle-regex" checked={regex} onChange={() => {setRegex(!regex);}} />
                            <label className="form-check-label" htmlFor="toggle-regex">Search using regular expression</label>
                            <a href="https://www.sitepoint.com/learn-regex/"> What&apos;s this?</a>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" role="switch" id="toggle-ignore-diacritics" checked={!regex && diacritics} disabled={regex} onChange={() => {setDiacritics(!diacritics);}} />
                            <label className="form-check-label" htmlFor="toggle-ignore-diacritics">Ignore diacritics (May slow down search)</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" role="switch" id="toggle-exact-phrase" checked={!regex && exactPhrase} disabled={regex} onChange={() => {setExactPhrase(!exactPhrase);}} />
                            <label className="form-check-label" htmlFor="toggle-exact-phrase">Search for exact phrase</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" role="switch" id="toggle-powermark-only" checked={powermarkOnly} onChange={() => {setPowermarkOnly(!powermarkOnly);}} />
                            <label className="form-check-label" htmlFor="toggle-powermark-only">Powermarked tossups only</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" role="switch" id="toggle-show-card-footers" checked={showCardFooters} onChange={() => {setShowCardFooters(!showCardFooters);}} />
                            <label className="form-check-label" htmlFor="toggle-show-card-footers">Show card footers</label>
                        </div>
                        <div className="float-end">
                            <b>Download:</b>
                            <a className="ms-2 clickable" onClick={() => {downloadQuestionsAsText(tossups, bonuses);}}>TXT</a>
                            <a className="ms-2 clickable" onClick={() => {downloadTossupsAsCSV(tossups); downloadBonusesAsCSV(bonuses);}}>CSV</a>
                            <a className="ms-2 clickable" onClick={() => {downloadQuestionsAsJSON(tossups, bonuses);}}>JSON</a>
                        </div>
                    </div>
                </div>
            </form>

            { currentlySearching && <div className="d-block mx-auto mt-3 spinner-border" role="status"><span className="d-none">Loading...</span></div> }
            <div className="row text-center mt-2 mt-sm-0">
                <h3 id="tossups">Tossups</h3>
            </div>
            {
                tossupCount > 0
                    ? <div className="float-row mb-3">
                        <span className="text-muted float-start">Showing {tossups.length} of {tossupCount} results ({queryTime} seconds)</span>&nbsp;
                        <span className="text-muted float-end"><a href="#bonuses">Jump to bonuses</a></span>
                    </div>
                    : <div className="text-muted">No tossups found</div>
            }
            <div>{tossupCards}</div>
            {
                tossupPaginationLength > 1 &&
                <nav aria-label="tossup nagivation">
                    <ul className="pagination justify-content-center">
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="First" onClick={event => {handleTossupPaginationClick(event, 'first');}}>
                                &laquo;
                            </a>
                        </li>
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Previous" onClick={event => {handleTossupPaginationClick(event, 'previous');}}>
                                &lsaquo;
                            </a>
                        </li>
                        {
                            arrayBetween(
                                Math.min(tossupPaginationShift),
                                Math.min(tossupPaginationShift + paginationShiftLength, tossupPaginationLength),
                            ).map((i) => {
                                const isActive = tossupPaginationNumber === i + 1;
                                return <li key={`tossup-pagination-${i + 1}`} className="page-item">
                                    <a className={`page-link ${isActive && 'active'}`} href="#" onClick={event => {handleTossupPaginationClick(event, i + 1);}}>
                                        {i + 1}
                                    </a>
                                </li>;
                            })
                        }
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Next" onClick={event => {handleTossupPaginationClick(event, 'next');}}>
                                &rsaquo;
                            </a>
                        </li>
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Last" onClick={event => {handleTossupPaginationClick(event, 'last');}}>
                                <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            }
            <div className="mb-5"></div>
            <div className="row text-center">
                <h3 id="bonuses">Bonuses</h3>
            </div>
            {
                bonusCount > 0
                    ? <div className="float-row mb-3">
                        <span className="text-muted float-start">Showing {bonuses.length} of {bonusCount} results ({queryTime} seconds)</span>&nbsp;
                        <span className="text-muted float-end"><a href="#tossups">Jump to tossups</a></span>
                    </div>
                    : <div className="text-muted">No bonuses found</div>
            }
            <div>{bonusCards}</div>
            {
                bonusPaginationLength > 1 &&
                <nav aria-label="bonus nagivation">
                    <ul className="pagination justify-content-center">
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="First" onClick={event => {handleBonusPaginationClick(event, 'first');}}>
                                &laquo;
                            </a>
                        </li>
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Previous" onClick={event => {handleBonusPaginationClick(event, 'previous');}}>
                                &lsaquo;
                            </a>
                        </li>
                        {
                            arrayBetween(
                                Math.min(bonusPaginationShift),
                                Math.min(bonusPaginationShift + paginationShiftLength, bonusPaginationLength),
                            ).map((i) => {
                                const isActive = bonusPaginationNumber === i + 1;
                                return <li key={`bonus-pagination-${i + 1}`} className="page-item">
                                    <a className={`page-link ${isActive && 'active'}`} href="#" onClick={event => {handleBonusPaginationClick(event, i + 1);}}>
                                        {i + 1}
                                    </a>
                                </li>;
                            })
                        }
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Next" onClick={event => {handleBonusPaginationClick(event, 'next');}}>
                                &rsaquo;
                            </a>
                        </li>
                        <li className="page-item">
                            <a className="page-link" href="#" aria-label="Last" onClick={event => {handleBonusPaginationClick(event, 'last');}}>
                                <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            }
            <div className="mb-5"></div>
        </div>
    );
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<QueryForm />);

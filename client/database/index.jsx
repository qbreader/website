import { stringifyBonus, stringifyTossup } from './stringify.js';
import { downloadQuestionsAsText, downloadBonusesAsCSV, downloadTossupsAsCSV, downloadQuestionsAsJSON } from './download.js';

import account from '../accounts.js';
import api from '../api/index.js';
import CategoryManager from '../utilities/category-manager.js';
import { attachDropdownChecklist, getDropdownValues } from '../utilities/dropdown-checklist.js';
import { getBonusPartLabel } from '../utilities/index.js';
import { insertTokensIntoHTML } from '../utilities/insert-tokens-into-html.js';

const paginationShiftLength = window.screen.width > 992 ? 10 : 5;

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
  ['Trash', 'secondary']
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
  ['Other Science', 'danger'],
  ['Visual Fine Arts', 'warning'],
  ['Auditory Fine Arts', 'warning'],
  ['Other Fine Arts', 'warning']
];

const ALTERNATE_SUBCATEGORY_BUTTONS = [
  ['Drama', 'primary'],
  ['Long Fiction', 'primary'],
  ['Poetry', 'primary'],
  ['Short Fiction', 'primary'],
  ['Misc Literature', 'primary'],
  ['Math', 'danger'],
  ['Astronomy', 'danger'],
  ['Computer Science', 'danger'],
  ['Earth Science', 'danger'],
  ['Engineering', 'danger'],
  ['Misc Science', 'danger'],
  ['Architecture', 'warning'],
  ['Dance', 'warning'],
  ['Film', 'warning'],
  ['Jazz', 'warning'],
  ['Opera', 'warning'],
  ['Photography', 'warning'],
  ['Misc Arts', 'warning'],
  ['Anthropology', 'secondary'],
  ['Economics', 'secondary'],
  ['Linguistics', 'secondary'],
  ['Psychology', 'secondary'],
  ['Sociology', 'secondary'],
  ['Other Social Science', 'secondary']
];

const categoryManager = new CategoryManager();

function getMatchIndices (clean, regex) {
  const iterator = clean.matchAll(regex);
  const starts = [];
  const ends = [];

  let data = iterator.next();
  while (data.done === false) {
    starts.push(data.value.index);
    ends.push(data.value.index + data.value[0].length);
    data = iterator.next();
  }

  return { starts, ends };
}

function highlightTossupQuery ({ tossup, regExp, searchType = 'all', ignoreWordOrder, queryString }) {
  const words = ignoreWordOrder
    ? queryString.split(' ').filter(word => word !== '').map(word => new RegExp(word, 'ig'))
    : [regExp];

  for (const word of words) {
    if (searchType === 'question' || searchType === 'all') {
      const { starts, ends } = getMatchIndices(tossup.question_sanitized, word);
      tossup.question = insertTokensIntoHTML(tossup.question, tossup.question_sanitized, [starts, ends]);
    }

    if (searchType === 'answer' || searchType === 'all') {
      const { starts, ends } = getMatchIndices(tossup.answer_sanitized, word);
      tossup.answer = insertTokensIntoHTML(tossup.answer, tossup.answer_sanitized, [starts, ends]);
    }
  }

  return tossup;
}

function highlightBonusQuery ({ bonus, regExp, searchType = 'all', ignoreWordOrder, queryString }) {
  const words = ignoreWordOrder
    ? queryString.split(' ').filter(word => word !== '').map(word => new RegExp(word, 'ig'))
    : [regExp];

  for (const word of words) {
    if (searchType === 'question' || searchType === 'all') {
      {
        const { starts, ends } = getMatchIndices(bonus.leadin_sanitized, word);
        bonus.leadin = insertTokensIntoHTML(bonus.leadin, bonus.leadin_sanitized, [starts, ends]);
      }
      for (let i = 0; i < bonus.parts.length; i++) {
        const { starts, ends } = getMatchIndices(bonus.parts_sanitized[i], word);
        bonus.parts[i] = insertTokensIntoHTML(bonus.parts[i], bonus.parts_sanitized[i], [starts, ends]);
      }
    }

    if (searchType === 'answer' || searchType === 'all') {
      for (let i = 0; i < bonus.answers.length; i++) {
        const { starts, ends } = getMatchIndices(bonus.answers_sanitized[i], word);
        bonus.answers[i] = insertTokensIntoHTML(bonus.answers[i], bonus.answers_sanitized[i], [starts, ends]);
      }
    }
  }

  return bonus;
}

function TossupCard ({ tossup, highlightedTossup, hideAnswerline, showCardFooter, fontSize = 16 }) {
  const _id = tossup._id;
  const packetName = tossup.packet.name;

  function clickToCopy () {
    const textdata = stringifyTossup(tossup);
    navigator.clipboard.writeText(textdata);

    const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
    toast.show();
  }

  function onClick () {
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

  return (
    <div className='card my-2'>
      <div className='card-header d-flex justify-content-between'>
        <b className='clickable' onClick={clickToCopy}>
          {tossup.set.name} | {tossup.category} | {tossup.subcategory} {tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | {tossup.difficulty}
        </b>
        <b className='clickable' data-bs-toggle='collapse' data-bs-target={`#question-${_id}`}>
          Packet {tossup.packet.number} | Question {tossup.number}
        </b>
      </div>
      <div className='card-container collapse show' id={`question-${_id}`}>
        <div className='card-body' style={{ fontSize: `${fontSize}px` }}>
          <span dangerouslySetInnerHTML={{ __html: highlightedTossup.question }} />
          <hr className='my-3' />
          <div>
            <b>ANSWER:</b> <span dangerouslySetInnerHTML={{ __html: hideAnswerline ? '' : highlightedTossup?.answer }} />
          </div>
        </div>
        <div className={`card-footer clickable ${!showCardFooter && 'd-none'}`} onClick={showTossupStats} data-bs-toggle='modal' data-bs-target='#tossup-stats-modal'>
          <small className='text-muted'>{packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
          <small className='text-muted float-end'>
            <a href='#' onClick={onClick} id={`report-question-${_id}`} data-bs-toggle='modal' data-bs-target='#report-question-modal'>
              Report Question
            </a>
          </small>
        </div>
      </div>
    </div>
  );
}

function BonusCard ({ bonus, highlightedBonus, hideAnswerlines, showCardFooter, fontSize = 16 }) {
  const _id = bonus._id;
  const packetName = bonus.packet.name;
  const bonusLength = bonus.parts.length;
  const indices = [];

  for (let i = 0; i < bonusLength; i++) {
    indices.push(i);
  }

  function clickToCopy () {
    const textdata = stringifyBonus(bonus);
    navigator.clipboard.writeText(textdata);

    const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
    toast.show();
  }

  function onClick () {
    document.getElementById('report-question-id').value = _id;
  }

  function showBonusStats () {
    fetch('/auth/question-stats/single-bonus?' + new URLSearchParams({ bonus_id: _id }))
      .then(response => {
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
    <div className='card my-2'>
      <div className='card-header d-flex justify-content-between'>
        <b className='clickable' onClick={clickToCopy}>
          {bonus.set.name} | {bonus.category} | {bonus.subcategory} {bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : ''} | {bonus.difficulty}
        </b>
        <b className='clickable' data-bs-toggle='collapse' data-bs-target={`#question-${_id}`}>
          Packet {bonus.packet.number} | Question {bonus.number}
        </b>
      </div>
      <div className='card-container collapse show' id={`question-${_id}`}>
        <div className='card-body' style={{ fontSize: `${fontSize}px` }}>
          <p dangerouslySetInnerHTML={{ __html: highlightedBonus.leadin }} />
          {indices.map((i) =>
            <div key={`${bonus._id}-${i}`}>
              <hr />
              <p>
                <span>{getBonusPartLabel(bonus, i)} </span>
                <span dangerouslySetInnerHTML={{ __html: highlightedBonus.parts[i] }} />
              </p>
              <div>
                <b>ANSWER: </b>
                <span dangerouslySetInnerHTML={{
                  __html: hideAnswerlines ? '' : highlightedBonus?.answers[i]
                }}
                 />
              </div>
            </div>
          )}
        </div>
        <div className={`card-footer clickable ${!showCardFooter && 'd-none'}`} onClick={showBonusStats} data-bs-toggle='modal' data-bs-target='#bonus-stats-modal'>
          <small className='text-muted'>{packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
          <small className='text-muted float-end'>
            <a href='#' onClick={onClick} id={`report-question-${_id}`} data-bs-toggle='modal' data-bs-target='#report-question-modal'>
              Report Question
            </a>
          </small>
        </div>
      </div>
    </div>
  );
}

function CategoryButton ({ category, color }) {
  function handleClick () {
    categoryManager.updateCategory(category);
    categoryManager.loadCategoryModal();
  }

  return (
    <div>
      <input type='checkbox' className='btn-check' autoComplete='off' id={category} onClick={handleClick} />
      <label className={`btn btn-outline-${color} w-100 rounded-0 my-1`} htmlFor={category}>{category}<br /></label>
    </div>
  );
}

function SubcategoryButton ({ subcategory, color, hidden = false }) {
  function handleClick () {
    categoryManager.updateSubcategory(subcategory);
    categoryManager.loadCategoryModal();
  }

  return (
    <div>
      <input type='checkbox' className='btn-check' autoComplete='off' id={subcategory} onClick={handleClick} />
      <label className={`btn btn-outline-${color} w-100 rounded-0 my-1 ${hidden && 'd-none'}`} htmlFor={subcategory}>{subcategory}<br /></label>
    </div>
  );
}

function AlternateSubcategoryButton ({ subcategory, color, hidden = false }) {
  function handleClick () {
    categoryManager.updateAlternateSubcategory(subcategory);
    categoryManager.loadCategoryModal();
  }

  return (
    <div>
      <input type='checkbox' className='btn-check' autoComplete='off' id={subcategory} onClick={handleClick} />
      <label className={`btn btn-outline-${color} w-100 rounded-0 my-1 ${hidden && 'd-none'}`} htmlFor={subcategory}>{subcategory}<br /></label>
    </div>
  );
}

function CategoryModal () {
  return (
    <div className='modal modal-lg' id='category-modal' tabIndex='-1'>
      <div className='modal-dialog modal-dialog-scrollable'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h5 className='modal-title'>Select Categories and Subcategories</h5>
            <button type='button' className='btn-close' data-bs-dismiss='modal' aria-label='Close' />
          </div>
          <div className='modal-body'>
            <div className='row'>
              <div className='col-4' id='categories'>
                <h5 className='text-center'>Category</h5>
                {CATEGORY_BUTTONS.map((element) => <CategoryButton key={element[0]} category={element[0]} color={element[1]} />)}
              </div>
              <div className='col-4' id='subcategories'>
                <h5 className='text-center'>Subcategory</h5>
                <div className='text-muted text-center' id='subcategory-info-text'>
                  You must select categories before you can select subcategories.
                </div>
                {SUBCATEGORY_BUTTONS.map((element) => <SubcategoryButton key={element[0]} subcategory={element[0]} color={element[1]} hidden />)}
              </div>
              <div className='col-4' id='alternate-subcategories'>
                <h5 className='text-center'>Alternate <span className='d-none d-lg-inline'>Subcategory</span></h5>
                {ALTERNATE_SUBCATEGORY_BUTTONS.map((element) => <AlternateSubcategoryButton key={element[0]} subcategory={element[0]} color={element[1]} hidden />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueryForm () {
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
  const [ignoreWordOrder, setIgnoreWordOrder] = React.useState(false);
  const [exactPhrase, setExactPhrase] = React.useState(false);
  const [powermarkOnly, setPowermarkOnly] = React.useState(false);
  const [hideAnswerlines, setHideAnswerlines] = React.useState(false);
  const [showCardFooters, setShowCardFooters] = React.useState(true);

  const [currentlySearching, setCurrentlySearching] = React.useState(false);

  let [tossupPaginationNumber, setTossupPaginationNumber] = React.useState(1);
  let [bonusPaginationNumber, setBonusPaginationNumber] = React.useState(1);
  const [tossupPaginationLength, setTossupPaginationLength] = React.useState(1);
  const [bonusPaginationLength, setBonusPaginationLength] = React.useState(1);
  const [tossupPaginationShift, setTossupPaginationShift] = React.useState(0);
  const [bonusPaginationShift, setBonusPaginationShift] = React.useState(0);

  const [queryTime, setQueryTime] = React.useState(0);

  const fontSize = window.localStorage.getItem('database-font-size') === 'true' ? (window.localStorage.getItem('font-size') ?? 16) : 16;

  function arrayBetween (start, end) {
    return Array(end - start).fill().map((_, idx) => start + idx);
  }

  function getMaxPagination () {
    return Math.floor(10000 / (maxReturnLength || 25));
  }

  function handleTossupPaginationClick (event, value) {
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

    window.scrollTo({
      top: document.getElementById('tossups').offsetTop - 100,
      behavior: 'smooth'
    });
  }

  function handleBonusPaginationClick (event, value) {
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

    window.scrollTo({
      top: document.getElementById('bonuses').offsetTop - 100,
      behavior: 'smooth'
    });
  }

  function handleSubmit (event, randomize = false, paginationUpdate = false) {
    const startTime = performance.now();

    event.preventDefault();
    setCurrentlySearching(true);

    if (randomize || !paginationUpdate) {
      tossupPaginationNumber = 1;
      bonusPaginationNumber = 1;
      setTossupPaginationNumber(tossupPaginationNumber);
      setBonusPaginationNumber(bonusPaginationNumber);
    }

    const params = new URLSearchParams({
      queryString,
      ...categoryManager.export(),
      difficulties,
      maxReturnLength,
      questionType,
      randomize,
      exactPhrase,
      powermarkOnly,
      regex,
      ignoreWordOrder,
      searchType,
      setName: document.getElementById('set-name').value,
      tossupPagination: tossupPaginationNumber,
      bonusPagination: bonusPaginationNumber,
      minYear,
      maxYear
    }).toString();

    fetch(`/api/query?${params}`)
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
        const { count: bonusCount, questionArray: bonusArray } = bonuses;

        const highlightedTossupArray = JSON.parse(JSON.stringify(tossupArray));
        const highlightedBonusArray = JSON.parse(JSON.stringify(bonusArray));

        // create deep copy to highlight
        if (queryString !== '') {
          for (let i = 0; i < highlightedTossupArray.length; i++) {
            highlightedTossupArray[i] = highlightTossupQuery({ tossup: highlightedTossupArray[i], regExp, searchType, ignoreWordOrder, queryString });
          }

          for (let i = 0; i < highlightedBonusArray.length; i++) {
            highlightedBonusArray[i] = highlightBonusQuery({ bonus: highlightedBonusArray[i], regExp, searchType, ignoreWordOrder, queryString });
          }
        }

        setTossupCount(tossupCount);
        setTossups(tossupArray);
        setHighlightedTossups(highlightedTossupArray);

        setBonusCount(bonusCount);
        setBonuses(bonusArray);
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

        window.history.pushState({ tossups, highlightedTossupArray, bonuses, highlightedBonusArray, timeElapsed, workingMaxReturnLength, randomize }, '', '?' + params);
      })
      .catch(error => {
        console.error('Error:', error);
        window.alert('Invalid query. Please check your search parameters and try again.');
      })
      .finally(() => {
        document.querySelectorAll('b.collapsed[data-bs-toggle="collapse"]').forEach(element => element.classList.remove('collapsed'));
        document.querySelectorAll('div.card-container.collapse:not(.show)').forEach(element => element.classList.add('show'));
        setCurrentlySearching(false);
      });
  }

  const tossupCards = [];
  for (let i = 0; i < highlightedTossups.length; i++) {
    tossupCards.push(<TossupCard key={i} tossup={tossups[i]} highlightedTossup={highlightedTossups[i]} hideAnswerline={hideAnswerlines} showCardFooter={showCardFooters} fontSize={fontSize} />);
  }

  const bonusCards = [];
  for (let i = 0; i < highlightedBonuses.length; i++) {
    bonusCards.push(<BonusCard key={i} bonus={bonuses[i]} highlightedBonus={highlightedBonuses[i]} hideAnswerlines={hideAnswerlines} showCardFooter={showCardFooters} fontSize={fontSize} />);
  }

  React.useEffect(() => {
    attachDropdownChecklist();

    document.getElementById('difficulties').addEventListener('change', function () {
      setDifficulties(getDropdownValues('difficulties'));
    });

    document.getElementById('report-question-submit').addEventListener('click', function () {
      api.reportQuestion(
        document.getElementById('report-question-id').value,
        document.getElementById('report-question-reason').value,
        document.getElementById('report-question-description').value
      );
    });

    window.addEventListener('popstate', event => {
      if (event.state === null) {
        setTossupCount(0);
        setTossups([]);
        setHighlightedTossups([]);

        setBonusCount(0);
        setBonuses([]);
        setHighlightedBonuses([]);

        setTossupPaginationLength(1);
        setBonusPaginationLength(1);

        setTossupPaginationShift(0);
        setBonusPaginationShift(0);

        return;
      }

      const { tossups, highlightedTossupArray, bonuses, highlightedBonusArray, timeElapsed, workingMaxReturnLength, randomize } = event.state;
      const { count: tossupCount, questionArray: tossupArray } = tossups;
      const { count: bonusCount, questionArray: bonusArray } = bonuses;

      setTossupCount(tossupCount);
      setTossups(tossupArray);
      setHighlightedTossups(highlightedTossupArray);

      setBonusCount(bonusCount);
      setBonuses(bonusArray);
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

      setQueryTime(timeElapsed);
    });

    document.getElementById('set-list').innerHTML = api.getSetList().map(setName => `<option>${setName}</option>`).join('');
  }, []);

  return (
    <div>
      <CategoryModal />
      <form className='mt-3' onSubmit={event => { handleSubmit(event); }}>
        <div className='input-group mb-2'>
          <input type='text' className='form-control' id='query' placeholder='Query' value={queryString} onChange={event => { setQueryString(event.target.value); }} />
          <button type='submit' className='btn btn-info'>Search</button>
          <button id='randomize' className='btn btn-success' onClick={event => { handleSubmit(event, true); }}>Random</button>
        </div>
        <div className='row'>
          <div className='col-6 col-xl-3 mb-2'>
            <div className='dropdown-checklist btn-group w-100'>
              <button
                className='btn btn-default text-start w-100' id='dropdownMenu1' data-bs-toggle='dropdown'
                type='button' aria-expanded='true' aria-haspopup='true'
              >
                Difficulties
              </button>
              <button className='btn btn-default dropdown-toggle dropdown-toggle-split' data-bs-toggle='dropdown' type='button' />
              <ul className='dropdown-menu checkbox-menu allow-focus' id='difficulties' aria-labelledby='dropdownMenu1'>
                <li><label><input type='checkbox' value='1' /> 1: Middle School</label></li>
                <li><label><input type='checkbox' value='2' /> 2: Easy High School</label></li>
                <li><label><input type='checkbox' value='3' /> 3: Regular High School</label></li>
                <li><label><input type='checkbox' value='4' /> 4: Hard High School</label></li>
                <li><label><input type='checkbox' value='5' /> 5: National High School</label></li>
                <li><label><input type='checkbox' value='6' /> 6: ● / Easy College</label></li>
                <li><label><input type='checkbox' value='7' /> 7: ●● / Medium College</label></li>
                <li><label><input type='checkbox' value='8' /> 8: ●●● / Regionals College</label></li>
                <li><label><input type='checkbox' value='9' /> 9: ●●●● / Nationals College</label></li>
                <li><label><input type='checkbox' value='10' /> 10: Open</label></li>
              </ul>
            </div>
          </div>
          <div className='col-6 col-xl-3 mb-2'>
            <input type='number' className='form-control' id='max-return-length' placeholder='# to Display' value={maxReturnLength} onChange={event => { setMaxReturnLength(event.target.value); }} />
          </div>
          <div className='input-group col-12 col-xl-6 mb-2'>
            <input type='text' className='form-control' id='set-name' placeholder='Set Name' list='set-list' />
            <datalist id='set-list' />
            <button type='button' className='btn btn-danger' id='category-select-button' data-bs-toggle='modal' data-bs-target='#category-modal'>Categories</button>
          </div>
        </div>
        <div className='row'>
          <div className='col-6 col-md-3 mb-2'>
            <select className='form-select' id='search-type' value={searchType} onChange={event => { setSearchType(event.target.value); }}>
              <option value='all'>All text</option>
              <option value='question'>Question</option>
              <option value='answer'>Answer</option>
            </select>
          </div>
          <div className='col-6 col-md-3 mb-2'>
            <select className='form-select' id='question-type' value={questionType} onChange={event => { setQuestionType(event.target.value); }}>
              <option value='all'>All questions</option>
              <option value='tossup'>Tossups</option>
              <option value='bonus'>Bonuses</option>
            </select>
          </div>
          <div className='col-6 col-md-3 mb-2'>
            <input type='number' className='form-control' id='min-year' placeholder='Min Year' value={minYear} onChange={event => { setMinYear(event.target.value); }} />
          </div>
          <div className='col-6 col-md-3 mb-2'>
            <input type='number' className='form-control' id='max-year' placeholder='Max Year' value={maxYear} onChange={event => { setMaxYear(event.target.value); }} />
          </div>
        </div>
        <div className='row'>
          <div className='col-12'>
            <div className='form-check form-switch'>
              <input className='form-check-input' type='checkbox' role='switch' id='toggle-regex' checked={regex} onChange={() => { setRegex(!regex); }} />
              <label className='form-check-label' htmlFor='toggle-regex'>Search using regular expression</label>
              <a href='https://www.sitepoint.com/learn-regex/'> What&apos;s this?</a>
            </div>
            <div className='form-check form-switch'>
              <input className='form-check-input' type='checkbox' role='switch' id='toggle-ignore-word-order' checked={!regex && ignoreWordOrder} disabled={regex} onChange={() => { setIgnoreWordOrder(!ignoreWordOrder); }} />
              <label className='form-check-label' htmlFor='toggle-ignore-word-order'>Ignore word order</label>
            </div>
            <div className='form-check form-switch'>
              <input className='form-check-input' type='checkbox' role='switch' id='toggle-exact-phrase' checked={!regex && exactPhrase} disabled={regex} onChange={() => { setExactPhrase(!exactPhrase); }} />
              <label className='form-check-label' htmlFor='toggle-exact-phrase'>Search for exact phrase</label>
            </div>
            <div className='form-check form-switch'>
              <input className='form-check-input' type='checkbox' role='switch' id='toggle-powermark-only' checked={powermarkOnly} onChange={() => { setPowermarkOnly(!powermarkOnly); }} />
              <label className='form-check-label' htmlFor='toggle-powermark-only'>Powermarked tossups only</label>
            </div>
            <div className='form-check form-switch'>
              <input className='form-check-input' type='checkbox' role='switch' id='toggle-hide-answerlines' checked={hideAnswerlines} onChange={() => { setHideAnswerlines(!hideAnswerlines); }} />
              <label className='form-check-label' htmlFor='toggle-hide-answerlines'>Hide answerlines</label>
            </div>
            <div className='form-check form-switch'>
              <input className='form-check-input' type='checkbox' role='switch' id='toggle-show-card-footers' checked={showCardFooters} onChange={() => { setShowCardFooters(!showCardFooters); }} />
              <label className='form-check-label' htmlFor='toggle-show-card-footers'>Show card footers</label>
            </div>
            <div className='float-end'>
              <b>Download this page:</b>
              <a className='ms-2 clickable' onClick={() => { downloadQuestionsAsText(tossups, bonuses); }}>TXT</a>
              <a className='ms-2 clickable' onClick={() => { downloadTossupsAsCSV(tossups); downloadBonusesAsCSV(bonuses); }}>CSV</a>
              <a className='ms-2 clickable' onClick={() => { downloadQuestionsAsJSON(tossups, bonuses); }}>JSON</a>
            </div>
          </div>
        </div>
      </form>

      {currentlySearching && <div className='d-block mx-auto mt-3 spinner-border' role='status'><span className='d-none'>Loading...</span></div>}
      <div className='row text-center mt-2 mt-sm-0'>
        <h3 id='tossups'>Tossups</h3>
      </div>
      {
                tossupCount > 0
                  ? <div className='float-row mb-3'>
                    <span className='text-muted float-start'>Showing {tossups.length} of {tossupCount} results ({queryTime} seconds)</span>&nbsp;
                    <span className='text-muted float-end'>
                      <a className='clickable' onClick={() => window.scrollTo({ top: document.getElementById('bonuses').offsetTop, behavior: 'smooth' })}>
                        Jump to bonuses
                      </a>
                    </span>
                    </div>
                  : <div className='text-muted'>No tossups found</div>
            }
      <div>{tossupCards}</div>
      {
                tossupPaginationLength > 1 &&
                  <nav aria-label='tossup nagivation'>
                    <ul className='pagination justify-content-center'>
                      <li className='page-item'>
                        <a className='page-link' href='#' aria-label='First' onClick={event => { handleTossupPaginationClick(event, 'first'); }}>
                          &laquo;
                        </a>
                      </li>
                      <li className='page-item'>
                        <a className='page-link' href='#' aria-label='Previous' onClick={event => { handleTossupPaginationClick(event, 'previous'); }}>
                          &lsaquo;
                        </a>
                      </li>
                      {
                            arrayBetween(
                              Math.min(tossupPaginationShift),
                              Math.min(tossupPaginationShift + paginationShiftLength, tossupPaginationLength)
                            ).map((i) => {
                              const isActive = tossupPaginationNumber === i + 1;
                              return (
                                <li key={`tossup-pagination-${i + 1}`} className='page-item'>
                                  <a className={`page-link ${isActive && 'active'}`} href='#' onClick={event => { handleTossupPaginationClick(event, i + 1); }}>
                                    {i + 1}
                                  </a>
                                </li>
                              );
                            })
                        }
                      <li className='page-item'>
                        <a className='page-link' href='#' aria-label='Next' onClick={event => { handleTossupPaginationClick(event, 'next'); }}>
                          &rsaquo;
                        </a>
                      </li>
                      <li className='page-item'>
                        <a className='page-link' href='#' aria-label='Last' onClick={event => { handleTossupPaginationClick(event, 'last'); }}>
                          <span aria-hidden='true'>&raquo;</span>
                        </a>
                      </li>
                    </ul>
                  </nav>
            }
      <div className='mb-5' />
      <div className='row text-center'>
        <h3 id='bonuses'>Bonuses</h3>
      </div>
      {
                bonusCount > 0
                  ? <div className='float-row mb-3'>
                    <span className='text-muted float-start'>Showing {bonuses.length} of {bonusCount} results ({queryTime} seconds)</span>&nbsp;
                    <span className='text-muted float-end'>
                      <a className='clickable' onClick={() => window.scrollTo({ top: document.getElementById('tossups').offsetTop, behavior: 'smooth' })}>
                        Jump to tossups
                      </a>
                    </span>
                    </div>
                  : <div className='text-muted'>No bonuses found</div>
            }
      <div>{bonusCards}</div>
      {
                bonusPaginationLength > 1 &&
                  <nav aria-label='bonus nagivation'>
                    <ul className='pagination justify-content-center'>
                      <li className='page-item'>
                        <a className='page-link' href='#' aria-label='First' onClick={event => { handleBonusPaginationClick(event, 'first'); }}>
                          &laquo;
                        </a>
                      </li>
                      <li className='page-item'>
                        <a className='page-link' href='#' aria-label='Previous' onClick={event => { handleBonusPaginationClick(event, 'previous'); }}>
                          &lsaquo;
                        </a>
                      </li>
                      {
                            arrayBetween(
                              Math.min(bonusPaginationShift),
                              Math.min(bonusPaginationShift + paginationShiftLength, bonusPaginationLength)
                            ).map((i) => {
                              const isActive = bonusPaginationNumber === i + 1;
                              return (
                                <li key={`bonus-pagination-${i + 1}`} className='page-item'>
                                  <a className={`page-link ${isActive && 'active'}`} href='#' onClick={event => { handleBonusPaginationClick(event, i + 1); }}>
                                    {i + 1}
                                  </a>
                                </li>
                              );
                            })
                        }
                      <li className='page-item'>
                        <a className='page-link' href='#' aria-label='Next' onClick={event => { handleBonusPaginationClick(event, 'next'); }}>
                          &rsaquo;
                        </a>
                      </li>
                      <li className='page-item'>
                        <a className='page-link' href='#' aria-label='Last' onClick={event => { handleBonusPaginationClick(event, 'last'); }}>
                          <span aria-hidden='true'>&raquo;</span>
                        </a>
                      </li>
                    </ul>
                  </nav>
            }
      <div className='mb-5' />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<QueryForm />);

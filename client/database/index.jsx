import { downloadQuestionsAsText, downloadBonusesAsCSV, downloadTossupsAsCSV, downloadQuestionsAsJSON } from './download.js';

import api from '../scripts/api/index.js';
import star from '../scripts/auth/star.js';
import TossupCard from '../scripts/components/TossupCard.min.js';
import BonusCard from '../scripts/components/BonusCard.min.js';
import CategoryModal from '../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../scripts/components/DifficultyDropdown.min.js';
import Star from '../scripts/components/Star.min.js';
import CategoryManager from '../scripts/utilities/category-manager.js';
import { getDropdownValues } from '../scripts/utilities/dropdown-checklist.js';
import { insertTokensIntoHTML } from '../insert-tokens-into-html.js';

const starredTossupIds = new Set(await star.getStarredTossupIds());
const starredBonusIds = new Set(await star.getStarredBonusIds());

const paginationShiftLength = window.screen.width > 992 ? 10 : 5;

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

function QueryForm () {
  const [tossups, setTossups] = React.useState([]);
  const [bonuses, setBonuses] = React.useState([]);
  const [highlightedTossups, setHighlightedTossups] = React.useState([]);
  const [highlightedBonuses, setHighlightedBonuses] = React.useState([]);
  const [tossupCount, setTossupCount] = React.useState(0);
  const [bonusCount, setBonusCount] = React.useState(0);

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
      difficulties: getDropdownValues('difficulties'),
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
    const _id = tossups[i]._id;
    const starComponent = <Star key={_id} _id={_id} questionType='tossup' initiallyStarred={starredTossupIds.has(_id)} />;
    tossupCards.push(<TossupCard key={i} tossup={tossups[i]} highlightedTossup={highlightedTossups[i]} hideAnswerline={hideAnswerlines} showCardFooter={showCardFooters} fontSize={fontSize} topRightComponent={starComponent} />);
  }

  const bonusCards = [];
  for (let i = 0; i < highlightedBonuses.length; i++) {
    const _id = bonuses[i]._id;
    const starComponent = <Star key={_id} _id={_id} questionType='bonus' initiallyStarred={starredBonusIds.has(_id)} />;
    bonusCards.push(<BonusCard key={i} bonus={bonuses[i]} highlightedBonus={highlightedBonuses[i]} hideAnswerlines={hideAnswerlines} showCardFooter={showCardFooters} fontSize={fontSize} topRightComponent={starComponent} />);
  }

  React.useEffect(() => {
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
      <CategoryModal categoryManager={categoryManager} disablePercentView />
      <form className='mt-3' onSubmit={event => { handleSubmit(event); }}>
        <div className='input-group mb-2'>
          <input type='text' className='form-control' id='query' placeholder='Query' value={queryString} onChange={event => { setQueryString(event.target.value); }} />
          <button type='submit' className='btn btn-info'>Search</button>
          <button id='randomize' className='btn btn-success' onClick={event => { handleSubmit(event, true); }}>Random</button>
        </div>
        <div className='row'>
          <div className='col-6 col-xl-3 mb-2'>
            <DifficultyDropdown />
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
                    </div> // eslint-disable-line
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
                    </div> // eslint-disable-line
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

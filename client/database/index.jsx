import { downloadQuestionsAsText, downloadBonusesAsCSV, downloadTossupsAsCSV, downloadQuestionsAsJSON } from './download.js';
import { highlightBonusQuery, highlightTossupQuery } from './highlight-query.js';
import star from '../scripts/auth/star.js';
import TossupCard from './TossupCard.min.js';
import BonusCard from './BonusCard.min.js';
import CategoryModal from '../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../scripts/components/DifficultyDropdown.min.js';
import Star from '../scripts/components/Star.min.js';
import { getDropdownValues, setDropdownValues } from '../scripts/utilities/dropdown-checklist.js';
import filterParams from '../scripts/utilities/filter-params.js';
import CategoryManager from '../../quizbowl/category-manager.js';
import reportQuestion from '../scripts/api/report-question.js';
import getSetList from '../scripts/api/get-set-list.js';

const starredTossupIds = new Set(await star.getStarredTossupIds());
const starredBonusIds = new Set(await star.getStarredBonusIds());

const fontSize = window.localStorage.getItem('database-font-size') === 'true' ? (window.localStorage.getItem('font-size') ?? 16) : 16;
const paginationShiftLength = window.screen.width > 992 ? 10 : 5;

const categoryManager = new CategoryManager();

function arrayBetween (start, end) {
  return Array(end - start).fill().map((_, idx) => start + idx);
}

function QueryForm () {
  const [tossups, setTossups] = React.useState([]);
  const [bonuses, setBonuses] = React.useState([]);
  const [highlightedTossups, setHighlightedTossups] = React.useState([]);
  const [highlightedBonuses, setHighlightedBonuses] = React.useState([]);
  const [tossupCount, setTossupCount] = React.useState(0);
  const [bonusCount, setBonusCount] = React.useState(0);

  // query form
  const initialParams = new window.URLSearchParams(window.location.search);
  const [queryString, setQueryString] = React.useState(initialParams.get('queryString') ?? '');
  const [maxReturnLength, setMaxReturnLength] = React.useState(initialParams.get('maxReturnLength') ?? '');
  const [setName, setSetName] = React.useState(initialParams.get('setName') ?? '');
  const [searchType, setSearchType] = React.useState(initialParams.get('searchType') ?? 'all');
  const [questionType, setQuestionType] = React.useState(initialParams.get('questionType') ?? 'all');
  const [minYear, setMinYear] = React.useState(initialParams.get('minYear') ?? '');
  const [maxYear, setMaxYear] = React.useState(initialParams.get('maxYear') ?? '');

  // toggleable options
  const [regex, setRegex] = React.useState(initialParams.get('regex') === 'true');
  const [ignoreWordOrder, setIgnoreWordOrder] = React.useState(initialParams.get('ignoreWordOrder') === 'true');
  const [exactPhrase, setExactPhrase] = React.useState(initialParams.get('exactPhrase') === 'true');
  const [caseSensitive, setCaseSensitive] = React.useState(initialParams.get('caseSensitive') === 'true');
  const [powermarkOnly, setPowermarkOnly] = React.useState(initialParams.get('powermarkOnly') === 'true');
  const [hideAnswerlines, setHideAnswerlines] = React.useState(false);
  const [hideCardFooters, setHideCardFooters] = React.useState(false);

  const [currentlySearching, setCurrentlySearching] = React.useState(false);

  let [tossupPaginationNumber, setTossupPaginationNumber] = React.useState(1);
  let [bonusPaginationNumber, setBonusPaginationNumber] = React.useState(1);
  const [tossupPaginationLength, setTossupPaginationLength] = React.useState(1);
  const [bonusPaginationLength, setBonusPaginationLength] = React.useState(1);
  // paginationShift is one less than the first pagination number selectable
  // so if the options are 11, 12, ..., 19, 20, then paginationShift=10
  //    if the options are 86, 87, ..., 89, 90, then paginationShift=85
  const [tossupPaginationShift, setTossupPaginationShift] = React.useState(0);
  const [bonusPaginationShift, setBonusPaginationShift] = React.useState(0);

  const [queryTime, setQueryTime] = React.useState(0);

  function getMaxPagination () {
    return Math.floor(10000 / (maxReturnLength || 25));
  }

  /**
   *
   * @param {"tossup" | "bonus"} type - The type of question to handle pagination for.
   */
  function handlePaginationClick (event, value, type) {
    event.preventDefault();
    let paginationNumber = type === 'tossup' ? tossupPaginationNumber : bonusPaginationNumber;
    const valueToNumber = {
      first: 1,
      previous: Math.max(1, paginationNumber - 1),
      next: Math.min(type === 'tossup' ? tossupPaginationLength : bonusPaginationLength, paginationNumber + 1, getMaxPagination()),
      last: Math.min(type === 'tossup' ? tossupPaginationLength : bonusPaginationLength, getMaxPagination())
    };
    if (value in valueToNumber) {
      paginationNumber = valueToNumber[value];
    } else {
      paginationNumber = value;
    }

    const paginationShift = paginationShiftLength * Math.floor((paginationNumber - 1) / paginationShiftLength);
    if (type === 'tossup') {
      tossupPaginationNumber = paginationNumber;
      setTossupPaginationNumber(paginationNumber);
      setTossupPaginationShift(paginationShift);
    } else {
      bonusPaginationNumber = paginationNumber;
      setBonusPaginationNumber(paginationNumber);
      setBonusPaginationShift(paginationShift);
    }
    handleSubmit(event, false, true);

    window.scrollTo({
      top: document.getElementById(type === 'tossup' ? 'tossups' : 'bonuses').offsetTop - 100,
      behavior: 'smooth'
    });
  }

  function handleTossupPaginationClick (event, value) {
    return handlePaginationClick(event, value, 'tossup');
  }

  function handleBonusPaginationClick (event, value) {
    return handlePaginationClick(event, value, 'bonus');
  }

  function handleSubmit (event = null, randomize = false, paginationUpdate = false) {
    const startTime = window.performance.now();

    event?.preventDefault();
    setCurrentlySearching(true);

    if (randomize || !paginationUpdate) {
      tossupPaginationNumber = 1;
      bonusPaginationNumber = 1;
      setTossupPaginationNumber(tossupPaginationNumber);
      setBonusPaginationNumber(bonusPaginationNumber);
    }

    const unfilteredParams = {
      queryString,
      ...categoryManager.export(),
      difficulties: getDropdownValues('difficulties'),
      maxReturnLength,
      questionType,
      randomize,
      exactPhrase,
      caseSensitive,
      powermarkOnly,
      regex,
      ignoreWordOrder,
      searchType,
      setName,
      tossupPagination: tossupPaginationNumber === 1 ? '' : tossupPaginationNumber,
      bonusPagination: bonusPaginationNumber === 1 ? '' : bonusPaginationNumber,
      minYear,
      maxYear
    };

    delete unfilteredParams.categoryPercents;

    const filteredParams = filterParams(unfilteredParams);
    const params = new window.URLSearchParams(filteredParams);

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
        const regExp = RegExp(modifiedQueryString, caseSensitive ? 'g' : 'ig');
        const workingMaxReturnLength = Math.max(1, maxReturnLength || 25);

        const { count: tossupCount, questionArray: tossupArray } = tossups;
        const { count: bonusCount, questionArray: bonusArray } = bonuses;

        const highlightedTossupArray = JSON.parse(JSON.stringify(tossupArray));
        const highlightedBonusArray = JSON.parse(JSON.stringify(bonusArray));

        // create deep copy to highlight
        if (queryString !== '') {
          for (let i = 0; i < highlightedTossupArray.length; i++) {
            highlightedTossupArray[i] = highlightTossupQuery({ tossup: highlightedTossupArray[i], regExp, searchType, ignoreWordOrder, queryString: modifiedQueryString });
          }

          for (let i = 0; i < highlightedBonusArray.length; i++) {
            highlightedBonusArray[i] = highlightBonusQuery({ bonus: highlightedBonusArray[i], regExp, searchType, ignoreWordOrder, queryString: modifiedQueryString });
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

        const endTime = window.performance.now();
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
    tossupCards.push(<TossupCard key={i} tossup={tossups[i]} highlightedTossup={highlightedTossups[i]} hideAnswerline={hideAnswerlines} hideCardFooter={hideCardFooters} fontSize={fontSize} topRightComponent={starComponent} />);
  }

  const bonusCards = [];
  for (let i = 0; i < highlightedBonuses.length; i++) {
    const _id = bonuses[i]._id;
    const starComponent = <Star key={_id} _id={_id} questionType='bonus' initiallyStarred={starredBonusIds.has(_id)} />;
    bonusCards.push(<BonusCard key={i} bonus={bonuses[i]} highlightedBonus={highlightedBonuses[i]} hideAnswerlines={hideAnswerlines} hideCardFooter={hideCardFooters} fontSize={fontSize} topRightComponent={starComponent} />);
  }

  React.useEffect(async () => {
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

    const setList = await getSetList();
    document.getElementById('set-list').innerHTML = setList.map(setName => `<option>${setName}</option>`).join('');

    if (window.location.search !== '') {
      const difficulties = initialParams.get('difficulties')?.split(',')?.map(difficulty => parseInt(difficulty));
      if (difficulties) { setDropdownValues('difficulties', difficulties); }
      handleSubmit(null, initialParams.get('randomize') === 'true');
    }
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
            <input type='text' className='form-control' id='set-name' placeholder='Set Name' list='set-list' value={setName} onChange={event => { setSetName(event.target.value); }} />
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
              <input className='form-check-input' type='checkbox' role='switch' id='toggle-case-sensitive' checked={caseSensitive} onChange={() => { setCaseSensitive(!caseSensitive); }} />
              <label className='form-check-label' htmlFor='toggle-case-sensitive'>Case sensitive search</label>
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
              <input className='form-check-input' type='checkbox' role='switch' id='toggle-hide-card-footers' checked={hideCardFooters} onChange={() => { setHideCardFooters(!hideCardFooters); }} />
              <label className='form-check-label' htmlFor='toggle-hide-card-footers'>Hide card footers</label>
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

document.getElementById('report-question-submit').addEventListener('click', function () {
  reportQuestion(
    document.getElementById('report-question-id').value,
    document.getElementById('report-question-reason').value,
    document.getElementById('report-question-description').value
  );
});

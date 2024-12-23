import { getBonusPartLabel } from '../../scripts/utilities/index.js';
import QuestionCard from '../../scripts/components/QuestionCard.min.js';

const fontSize = window.localStorage.getItem('database-font-size') === 'true' ? (window.localStorage.getItem('font-size') ?? 16) : 16;

const ALTERNATE_SUBCATEGORIES = {
  Literature: ['Drama', 'Long Fiction', 'Poetry', 'Short Fiction', 'Misc Literature'],
  History: [],
  Science: [],
  'Fine Arts': [],
  Religion: [],
  Mythology: [],
  Philosophy: [],
  'Social Science': ['Anthropology', 'Economics', 'Linguistics', 'Psychology', 'Sociology', 'Other Social Science'],
  'Current Events': [],
  Geography: [],
  'Other Academic': [],
  Trash: [],

  'Other Science': ['Math', 'Astronomy', 'Computer Science', 'Earth Science', 'Engineering', 'Misc Science'],
  'Other Fine Arts': ['Architecture', 'Dance', 'Film', 'Jazz', 'Opera', 'Photography', 'Misc Arts']
};

const SUBCATEGORY_TO_CATEGORY = {
  'American Literature': 'Literature',
  'British Literature': 'Literature',
  'Classical Literature': 'Literature',
  'European Literature': 'Literature',
  'World Literature': 'Literature',
  'Other Literature': 'Literature',
  'American History': 'History',
  'Ancient History': 'History',
  'European History': 'History',
  'World History': 'History',
  'Other History': 'History',
  Biology: 'Science',
  Chemistry: 'Science',
  Physics: 'Science',
  'Other Science': 'Other Science',
  'Visual Fine Arts': 'Fine Arts',
  'Auditory Fine Arts': 'Fine Arts',
  'Other Fine Arts': 'Other Fine Arts',
  Religion: 'Religion',
  Mythology: 'Mythology',
  Philosophy: 'Philosophy',
  'Social Science': 'Social Science',
  'Current Events': 'Current Events',
  Geography: 'Geography',
  'Other Academic': 'Other Academic',
  Trash: 'Trash'
};

function TossupCard ({ tossup }) {
  const _id = tossup._id;
  const packetName = tossup.packet.name;

  function onClick () {
    document.getElementById('old-category').value = `${tossup.category} / ${tossup.subcategory}`;
    document.getElementById('question-id').value = _id;
    document.getElementById('question-type').textContent = 'tossup';
    const reason = tossup.reports.map(report => report.description).join('; ') || 'None given';
    document.getElementById('report-reason').value = reason;
  }

  return (
    <QuestionCard
      onClickHeader='collapse'
      question={tossup}
    >
      <div className='card-body' style={{ fontSize: `${fontSize}px` }}>
        <span dangerouslySetInnerHTML={{ __html: tossup.question }} />
        <hr className='my-3' />
        <div><b>ANSWER:</b> <span dangerouslySetInnerHTML={{ __html: tossup?.answer }} /></div>
      </div>
      <div className='card-footer clickable' onClick={onClick} id={`fix-category-${_id}`} data-bs-toggle='modal' data-bs-target='#fix-category-modal'>
        <small className='text-muted'>{packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
        <small className='text-muted float-end'>
          <a href='javascript:void(0);'>Fix Category</a>
        </small>
      </div>
    </QuestionCard>
  );
}

function BonusCard ({ bonus }) {
  const _id = bonus._id;
  const packetName = bonus.packet.name;
  const bonusLength = bonus.parts.length;
  const indices = [];

  for (let i = 0; i < bonusLength; i++) {
    indices.push(i);
  }

  function onClick () {
    document.getElementById('old-category').value = `${bonus.category} / ${bonus.subcategory}`;
    document.getElementById('question-id').value = _id;
    document.getElementById('question-type').textContent = 'bonus';
    const reason = bonus.reports.map(report => report.description).join('; ') || 'None given';
    document.getElementById('report-reason').value = reason;
  }

  return (
    <QuestionCard
      onClickHeader='collapse'
      question={bonus}
    >
      <div className='card-body'>
        <p dangerouslySetInnerHTML={{ __html: bonus.leadin }} />
        {indices.map((i) =>
          <div key={`${bonus._id}-${i}`}>
            <hr />
            <p>{getBonusPartLabel(i)} <span dangerouslySetInnerHTML={{ __html: bonus.parts[i] }} /></p>
            <b>ANSWER: </b>
            <span dangerouslySetInnerHTML={{ __html: bonus?.answers[i] }} />
          </div>
        )}
      </div>
      <div className='card-footer clickable' onClick={onClick} data-bs-toggle='modal' data-bs-target='#fix-category-modal'>
        <small className='text-muted'>{packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
        <small className='text-muted float-end'>
          <a href='javascript:void(0);'>Fix Category</a>
        </small>
      </div>
    </QuestionCard>
  );
}

function Reports () {
  let [tossups, setTossups] = React.useState([]);
  let [bonuses, setBonuses] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/admin/list-reports?' + new URLSearchParams({ reason: 'wrong-category' }))
      .then(response => response.json())
      .then(data => {
        tossups = data.tossups;
        bonuses = data.bonuses;
        setTossups(tossups);
        setBonuses(bonuses);
      });

    document.getElementById('fix-category-submit').addEventListener('click', function () {
      const _id = document.getElementById('question-id').value;
      const type = document.getElementById('question-type').textContent;

      this.disabled = true;
      this.textContent = 'Submitting...';

      fetch('/api/admin/update-subcategory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id,
          type,
          subcategory: document.getElementById('new-category').value,
          alternate_subcategory: document.getElementById('new-alternate-subcategory').value
        })
      }).then(response => {
        document.getElementById('fix-category-close').click();
        this.disabled = false;
        this.textContent = 'Submit';

        if (!response.ok) {
          window.alert('Error updating subcategory');
          return;
        }

        switch (type) {
          case 'tossup':
            tossups = tossups.filter(tossup => tossup._id !== _id);
            setTossups(tossups);
            break;
          case 'bonus':
            bonuses = bonuses.filter(bonus => bonus._id !== _id);
            setBonuses(bonuses);
            break;
        }
      });
    });
  }, []);

  return (
    <>
      <div className='row text-center'>
        <h3 id='tossups'>Tossups</h3>
      </div>
      <div className='float-row mb-3'>
        <span className='text-muted float-start'>Showing {tossups.length} tossups</span>
        <a className='float-end' href='#bonuses'>Jump to bonuses</a>
      </div>
      {tossups.map(tossup => <TossupCard key={tossup._id} tossup={tossup} />)}
      <div className='row text-center mt-5'>
        <h3 id='bonuses'>Bonuses</h3>
      </div>
      <div className='float-row mb-3'>
        <span className='text-muted float-start'>Showing {bonuses.length} bonuses</span>
        <a className='float-end' href='#tossups'>Jump to tossups</a>
      </div>
      {bonuses.map(bonus => <BonusCard key={bonus._id} bonus={bonus} />)}
    </>
  );
}

document.getElementById('new-category').addEventListener('input', function () {
  const subcategory = this.value;
  const category = SUBCATEGORY_TO_CATEGORY[subcategory];
  const alternateCategories = ALTERNATE_SUBCATEGORIES[category];

  const select = document.getElementById('new-alternate-subcategory');
  select.innerHTML = '';

  for (const alternateCategory of alternateCategories) {
    const option = document.createElement('option');
    option.value = alternateCategory;
    option.textContent = alternateCategory;
    select.appendChild(option);
  }

  if (alternateCategories.length === 0) {
    document.getElementById('alternate-subcategory-selection').classList.add('d-none');
  } else {
    document.getElementById('alternate-subcategory-selection').classList.remove('d-none');
    select.value = alternateCategories.at(-1);
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Reports />);

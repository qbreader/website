const DIFFICULTIES = [
  [0, 'Pop Culture'],
  [1, 'Middle School'],
  [2, 'Easy High School'],
  [3, 'Regular High School'],
  [4, 'Hard High School'],
  [5, 'National High School'],
  [6, '● / Easy College'],
  [7, '●● / Medium College'],
  [8, '●●● / Regionals College'],
  [9, '●●●● / Nationals College'],
  [10, 'Open']
];

function DifficultyCheckbox ({ startChecked = false, label, value }) {
  const [checked, setChecked] = React.useState(startChecked);

  function handleClick (event) {
    setChecked(event.target.checked);
  }

  return (
    <li className={checked ? 'active' : undefined}>
      <label>
        <input type='checkbox' value={value} onClick={handleClick} defaultChecked={checked} />
        {value}: {label}
      </label>
    </li>
  );
}

function DifficultyDropdown ({ startingDifficulties = [], onChange = () => {} }) {
  return (
    <div className='dropdown-checklist btn-group w-100'>
      <button
        className='btn btn-default text-start w-100'
        id='dropdownMenu1'
        data-bs-toggle='dropdown'
        type='button'
        aria-expanded='true'
        aria-haspopup='true'
      >
        Difficulties
      </button>
      <button
        className='btn btn-default dropdown-toggle dropdown-toggle-split' data-bs-toggle='dropdown'
        type='button'
      />
      <ul
        className='dropdown-menu checkbox-menu allow-focus'
        id='difficulties'
        aria-labelledby='dropdownMenu1'
        onClick={(e) => e.stopPropagation()}
        onChange={onChange}
      >
        {DIFFICULTIES.map(([value, label]) => (
          <DifficultyCheckbox key={value} label={label} startChecked={startingDifficulties.includes(value)} value={value} />
        ))}
      </ul>
    </div>
  );
}

export default DifficultyDropdown;

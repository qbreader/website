import Checkbox, { toggleItem } from './Checkbox.jsx';

const DIFFICULTIES = [
  [0, '0: Pop Culture'],
  [1, '1: Middle School'],
  [2, '2: Easy High School'],
  [3, '3: Regular High School'],
  [4, '4: Hard High School'],
  [5, '5: National High School'],
  [6, '6: ● / Easy College'],
  [7, '7: ●● / Medium College'],
  [8, '8: ●●● / Regionals College'],
  [9, '9: ●●●● / Nationals College'],
  [10, '10: Open']
];

function DifficultyDropdown ({ startingDifficulties = [], onChange = () => {} }) {
  const [difficulties, setDifficulties] = React.useState(startingDifficulties);
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
          <Checkbox
            key={value} value={value} label={label} checked={difficulties.includes(value)}
            onClick={() => { setDifficulties(prevDifficulties => toggleItem(value, prevDifficulties)); }}
          />
        ))}
      </ul>
    </div>
  );
}

export default DifficultyDropdown;

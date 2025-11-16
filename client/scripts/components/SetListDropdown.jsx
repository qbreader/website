import Checkbox, { toggleItem } from './Checkbox.jsx';
import getSetList from '../api/get-set-list';

const setList = await getSetList();

export default function SetListDropdown ({ onChange = () => {} }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedItems, setSelectedItems] = React.useState([]);

  // Filter options based on search term and sort selected to top
  const filteredOptions = setList
    .filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aSelected = selectedItems.includes(a);
      const bSelected = selectedItems.includes(b);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });

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
        {selectedItems.length === 0 ? 'Select Sets' : `${selectedItems.length} Set${selectedItems.length !== 1 ? 's' : ''} Selected`}
      </button>
      <button className='btn btn-default dropdown-toggle' type='button' />
      <ul
        className='dropdown-menu checkbox-menu allow-focus w-100'
        id='set-names-1'
        aria-labelledby='dropdownMenu1'
        onClick={(e) => e.stopPropagation()}
        onChange={onChange}
      >
        <form className='mx-2 mb-1'>
          <input
            type='text' class='form-control mb-2' id='set-name-query' placeholder='Filter sets...'
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className='btn btn-primary'
            onClick={(event) => { event.preventDefault(); setSelectedItems(filteredOptions); }}
          >Select All
          </button>
          <button
            className='btn btn-warning float-end'
            onClick={(event) => { event.preventDefault(); setSelectedItems([]); }}
          >
            Clear
          </button>
        </form>
        {filteredOptions.map((setName) => (
          <Checkbox
            key={setName} value={setName} label={setName} checked={selectedItems.includes(setName)}
            onClick={() => { setSelectedItems(prevSelected => toggleItem(setName, prevSelected)); }}
          />
        ))}
      </ul>
    </div>
  );
}

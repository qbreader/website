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

function CategoryModal ({ categoryManager, disablePercentView = false, onClose = () => {} }) {
  React.useEffect(() => {
    categoryManager.loadCategoryModal();
    document.getElementById('category-modal').addEventListener('hidden.bs.modal', onClose);
  }, [onClose]);

  function ToggleAllButton () {
    function handleClick () {
      if (categoryManager.categories.length === 0) {
        categoryManager.import(
          {
            categories: CATEGORY_BUTTONS.map(element => element[0]),
            subcategories: SUBCATEGORY_BUTTONS.map(element => element[0]),
            alternateSubcategories: ALTERNATE_SUBCATEGORY_BUTTONS.map(element => element[0])
          }
        );
      } else {
        categoryManager.import();
      }
      categoryManager.loadCategoryModal();
    }
    return (
      <button className='btn btn-primary me-1' id='toggle-all' onClick={handleClick}>Toggle all</button>
    );
  }

  function TogglePercentView () {
    function handleClick () {
      categoryManager.percentView = !categoryManager.percentView;
      categoryManager.loadCategoryModal();
    }
    return (
      <button className='btn btn-primary' onClick={handleClick}>% view</button>
    );
  }

  function PercentButtonRow ({ category, index }) {
    function adjustPercent (amount) {
      // clamp the percent between 0 and 100
      const percent = Math.min(100, Math.max(0, categoryManager.categoryPercents[index] + amount));
      categoryManager.categoryPercents[index] = percent;
      categoryManager.loadCategoryModal();
    }

    return (
      <tr>
        <th style={{ width: '50%' }}>{category}</th>
        <td style={{ width: '50%' }}>
          <span className='font-monospace me-1 category-percent'>
            {/* set by categoryManager.loadCategoryModal */}
          </span>
          <div class='btn-group btn-group-sm me-1' role='group'>
            <button type='button' className='btn btn-outline-secondary' onClick={() => adjustPercent(-5)}>-</button>
            <button type='button' className='btn btn-outline-secondary' onClick={() => adjustPercent(5)}>+</button>
          </div>
          <div class='btn-group btn-group-sm' role='group'>
            <button type='button' className='btn btn-outline-secondary' onClick={() => adjustPercent(-100)}>Min</button>
            <button type='button' className='btn btn-outline-secondary' onClick={() => adjustPercent(50 - categoryManager.categoryPercents[index])}>50%</button>
            <button
              type='button'
              className='btn btn-outline-secondary'
              onClick={() => adjustPercent(100 - categoryManager.categoryPercents.reduce((a, b) => a + b))}
            >
              Max
            </button>
          </div>
        </td>
      </tr>
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

  return (
    <div className='modal modal-lg' id='category-modal' tabIndex='-1'>
      <div className='modal-dialog modal-dialog-scrollable'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h5 className='modal-title me-2'>Select Categories</h5>
            <ToggleAllButton />
            {disablePercentView || <TogglePercentView />}
            <button type='button' className='btn-close' data-bs-dismiss='modal' aria-label='Close' />
          </div>
          <div className='modal-body'>
            <div className='row' id='non-percent-view'>
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
            <div className='d-none' id='percent-view'>
              <table className='table'>
                <tbody>
                  {CATEGORY_BUTTONS.map((element, index) => <PercentButtonRow key={element[0]} category={element[0]} index={index} />)}
                  <tr>
                    <th>Total Percent:</th>
                    <td className='font-monospace'>
                      {/* '\u00A0' === &nbsp; */}
                      <span className='me-1'>{String(categoryManager.categoryPercents.reduce((a, b) => a + b, 0)).padStart(3, '\u00A0')}%</span>
                      <button
                        type='button'
                        className='btn btn-sm btn-outline-secondary'
                        onClick={() => { categoryManager.categoryPercents = categoryManager.categoryPercents.map(() => 0); categoryManager.loadCategoryModal(); }}
                      >
                        Reset
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryModal;

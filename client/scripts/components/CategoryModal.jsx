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

function CategoryModal ({ categoryManager }) {
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

export default CategoryModal;

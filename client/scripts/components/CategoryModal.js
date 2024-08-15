const CATEGORY_BUTTONS = [['Literature', 'primary'], ['History', 'success'], ['Science', 'danger'], ['Fine Arts', 'warning'], ['Religion', 'secondary'], ['Mythology', 'secondary'], ['Philosophy', 'secondary'], ['Social Science', 'secondary'], ['Current Events', 'secondary'], ['Geography', 'secondary'], ['Other Academic', 'secondary'], ['Trash', 'secondary']];
const SUBCATEGORY_BUTTONS = [['American Literature', 'primary'], ['British Literature', 'primary'], ['Classical Literature', 'primary'], ['European Literature', 'primary'], ['World Literature', 'primary'], ['Other Literature', 'primary'], ['American History', 'success'], ['Ancient History', 'success'], ['European History', 'success'], ['World History', 'success'], ['Other History', 'success'], ['Biology', 'danger'], ['Chemistry', 'danger'], ['Physics', 'danger'], ['Other Science', 'danger'], ['Visual Fine Arts', 'warning'], ['Auditory Fine Arts', 'warning'], ['Other Fine Arts', 'warning']];
const ALTERNATE_SUBCATEGORY_BUTTONS = [['Drama', 'primary'], ['Long Fiction', 'primary'], ['Poetry', 'primary'], ['Short Fiction', 'primary'], ['Misc Literature', 'primary'], ['Math', 'danger'], ['Astronomy', 'danger'], ['Computer Science', 'danger'], ['Earth Science', 'danger'], ['Engineering', 'danger'], ['Misc Science', 'danger'], ['Architecture', 'warning'], ['Dance', 'warning'], ['Film', 'warning'], ['Jazz', 'warning'], ['Opera', 'warning'], ['Photography', 'warning'], ['Misc Arts', 'warning'], ['Anthropology', 'secondary'], ['Economics', 'secondary'], ['Linguistics', 'secondary'], ['Psychology', 'secondary'], ['Sociology', 'secondary'], ['Other Social Science', 'secondary']];
function CategoryModal({
  categoryManager
}) {
  function CategoryButton({
    category,
    color
  }) {
    function handleClick() {
      categoryManager.updateCategory(category);
      categoryManager.loadCategoryModal();
    }
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "btn-check",
      autoComplete: "off",
      id: category,
      onClick: handleClick
    }), /*#__PURE__*/React.createElement("label", {
      className: `btn btn-outline-${color} w-100 rounded-0 my-1`,
      htmlFor: category
    }, category, /*#__PURE__*/React.createElement("br", null)));
  }
  function SubcategoryButton({
    subcategory,
    color,
    hidden = false
  }) {
    function handleClick() {
      categoryManager.updateSubcategory(subcategory);
      categoryManager.loadCategoryModal();
    }
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "btn-check",
      autoComplete: "off",
      id: subcategory,
      onClick: handleClick
    }), /*#__PURE__*/React.createElement("label", {
      className: `btn btn-outline-${color} w-100 rounded-0 my-1 ${hidden && 'd-none'}`,
      htmlFor: subcategory
    }, subcategory, /*#__PURE__*/React.createElement("br", null)));
  }
  function AlternateSubcategoryButton({
    subcategory,
    color,
    hidden = false
  }) {
    function handleClick() {
      categoryManager.updateAlternateSubcategory(subcategory);
      categoryManager.loadCategoryModal();
    }
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "btn-check",
      autoComplete: "off",
      id: subcategory,
      onClick: handleClick
    }), /*#__PURE__*/React.createElement("label", {
      className: `btn btn-outline-${color} w-100 rounded-0 my-1 ${hidden && 'd-none'}`,
      htmlFor: subcategory
    }, subcategory, /*#__PURE__*/React.createElement("br", null)));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "modal modal-lg",
    id: "category-modal",
    tabIndex: "-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-dialog-scrollable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, "Select Categories and Subcategories"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-close",
    "data-bs-dismiss": "modal",
    "aria-label": "Close"
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-4",
    id: "categories"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "text-center"
  }, "Category"), CATEGORY_BUTTONS.map(element => /*#__PURE__*/React.createElement(CategoryButton, {
    key: element[0],
    category: element[0],
    color: element[1]
  }))), /*#__PURE__*/React.createElement("div", {
    className: "col-4",
    id: "subcategories"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "text-center"
  }, "Subcategory"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted text-center",
    id: "subcategory-info-text"
  }, "You must select categories before you can select subcategories."), SUBCATEGORY_BUTTONS.map(element => /*#__PURE__*/React.createElement(SubcategoryButton, {
    key: element[0],
    subcategory: element[0],
    color: element[1],
    hidden: true
  }))), /*#__PURE__*/React.createElement("div", {
    className: "col-4",
    id: "alternate-subcategories"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "text-center"
  }, "Alternate ", /*#__PURE__*/React.createElement("span", {
    className: "d-none d-lg-inline"
  }, "Subcategory")), ALTERNATE_SUBCATEGORY_BUTTONS.map(element => /*#__PURE__*/React.createElement(AlternateSubcategoryButton, {
    key: element[0],
    subcategory: element[0],
    color: element[1],
    hidden: true
  }))))))));
}
export default CategoryModal;
/**
 *
 * @param {*} param0
 * @param {*} children
 * @param {*} onClickHeader - 'collapse' or a function
 * @param {*} question
 * @param {*} topRightComponent
 * @returns
 */
export default function QuestionCard({
  children,
  onClickHeader,
  question,
  topRightComponent
}) {
  const {
    _id
  } = question;
  return /*#__PURE__*/React.createElement("div", {
    className: "card my-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header d-flex justify-content-between"
  }, /*#__PURE__*/React.createElement("b", {
    className: "clickable",
    onClick: onClickHeader === 'collapse' ? null : onClickHeader,
    "data-bs-toggle": onClickHeader === 'collapse' ? 'collapse' : null,
    "data-bs-target": onClickHeader === 'collapse' ? `#question-${_id}` : null
  }, question.set.name, " | ", question.category, " | ", question.subcategory, " ", question.alternate_subcategory ? ' | ' + question.alternate_subcategory : '', " | ", question.difficulty), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    className: "clickable",
    "data-bs-toggle": "collapse",
    "data-bs-target": `#question-${_id}`
  }, "Packet ", question.packet.number, " |"), /*#__PURE__*/React.createElement("span", null, " "), topRightComponent)), /*#__PURE__*/React.createElement("div", {
    className: "card-container collapse show",
    id: `question-${_id}`
  }, children));
}
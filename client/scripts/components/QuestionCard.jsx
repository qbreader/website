/**
 *
 * @param {*} param0
 * @param {*} children
 * @param {*} onClickHeader - 'collapse' or a function
 * @param {*} question
 * @param {*} topRightComponent
 * @returns
 */
export default function QuestionCard ({ children, onClickHeader, question, topRightComponent }) {
  const { _id } = question;
  return (
    <div className='card my-2'>
      <div className='card-header d-flex justify-content-between'>
        <b
          className='clickable'
          onClick={onClickHeader === 'collapse' ? null : onClickHeader}
          data-bs-toggle={onClickHeader === 'collapse' ? 'collapse' : null}
          data-bs-target={onClickHeader === 'collapse' ? `#question-${_id}` : null}
        >
          {question.set.name} | {question.category} | {question.subcategory} {question.alternate_subcategory ? ' | ' + question.alternate_subcategory : ''} | {question.difficulty}
        </b>
        <span>
          <b className='clickable' data-bs-toggle='collapse' data-bs-target={`#question-${_id}`}>
            Packet {question.packet.number} |
          </b>
          <span> </span>
          {topRightComponent}
        </span>
      </div>
      <div className='card-container collapse show' id={`question-${_id}`}>
        {children}
      </div>
    </div>
  );
}

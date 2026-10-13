/**
 *
 * @param {*} param0
 * @param {*} children
 * @param {*} onClickHeader - 'collapse' or a function
 * @param {*} question
 * @param {*} topRightComponent
 * @param {'tossup' | 'bonus'} [type] - if provided, shows a button that copies the link to the question
 * @returns
 */
export default function QuestionCard ({ children, onClickHeader, question, topRightComponent, type }) {
  const { _id } = question;
  const [linkCopied, setLinkCopied] = React.useState(false);

  function copyLinkToClipboard (e) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(new URL(`/db/${type}/?_id=${_id}`, window.location.origin).toString());
    const toast = new bootstrap.Toast(document.getElementById('clipboard-toast'));
    toast.show();

    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  return (
    <div className='card my-2'>
      <div className='card-header d-flex justify-content-between'>
        <span className='d-flex align-items-center gap-2'>
          <b
            className='clickable'
            onClick={onClickHeader === 'collapse' ? null : onClickHeader}
            data-bs-toggle={onClickHeader === 'collapse' ? 'collapse' : null}
            data-bs-target={onClickHeader === 'collapse' ? `#question-${_id}` : null}
          >
            {question.set.name} | {question.category} | {question.subcategory} {question.alternate_subcategory ? ' | ' + question.alternate_subcategory : ''} | {question.difficulty}
          </b>
          {type && (
            <a href={`/db/${type}/?_id=${_id}`} onClick={copyLinkToClipboard} aria-label={`Copy ${type} link`} title={`Copy ${type} link`}>
              <i className={`bi ${linkCopied ? 'bi-check-lg' : 'bi-copy'}`} />
            </a>
          )}
        </span>
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

export default function tossupToHtml (tossup) {
  const alternateSubcategory = tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : '';
  return `
    <div class="card mb-2">
        <div class="card-header">
            <b>${tossup.set.name} | ${tossup.category} | ${tossup.subcategory} ${alternateSubcategory} | ${tossup.difficulty}</b>
            <b class="float-end">Packet ${tossup.packet.number} | Question ${tossup.number}</b>
        </div>
        <div class="card-container" id="question-${tossup._id}">
            <div class="card-body">
                <span>${tossup.question}</span>
                <hr></hr>
                <div><b>ANSWER:</b> ${tossup.answer}</div>
            </div>
            <div class="card-footer">
                <small class="text-muted">${tossup.packet.name ? 'Packet ' + tossup.packet.name : '&nbsp;'}</small>
                <small class="text-muted float-end">
                    <a href="#" onClick={onClick} id="report-question-${tossup._id}" data-bs-toggle="modal" data-bs-target="#report-question-modal">
                        Report Question
                    </a>
                </small>
            </div>
        </div>
    </div>
  `;
}

fetch('/auth/stars/')
    .then(response => response.json())
    .then(response => response.bonuses)
    .then(bonuses => {
        const bonusList = document.getElementById('bonus-list');
        bonuses.forEach(bonus => {
            bonusList.innerHTML += `
                <div className="card my-2">
                <div className="card-header d-flex justify-content-between">
                    <b className="clickable">
                        ${bonus.set.name} | ${bonus.category} | ${bonus.subcategory} ${bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : ''} | ${bonus.difficulty}
                    </b>
                    <b className="clickable" data-bs-toggle="collapse" data-bs-target=${`#question-${_id}`}>
                        Packet {bonus.packet.number} | Question {bonus.questionNumber}
                    </b>
                </div>
                <div className="card-container collapse show" id=${`question-${_id}`}>
                    <div className="card-body">
                        <p dangerouslySetInnerHTML={{ __html: highlightedBonus.leadin }}></p>
                        {indices.map((i) =>
                            <div key=${`${bonus._id}-${i}`}>
                                <hr></hr>
                                <p>
                                    <span>{getBonusPartLabel(bonus, i)} </span>
                                    <span dangerouslySetInnerHTML={{ __html: highlightedBonus.parts[i] }}></span>
                                </p>
                                <div>
                                    <b>ANSWER: </b>
                                    <span dangerouslySetInnerHTML={{ __html: (highlightedBonus?.formatted_answers ?? highlightedBonus.answers)[i] }}></span>
                                </div>
                            </div>,
                        )}
                    </div>
                    <div className="card-footer clickable" data-bs-toggle="modal" data-bs-target="#bonus-stats-modal">
                        <small className="text-muted">${packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
                        <small className="text-muted float-end">
                            <a href="#" onClick={onClick} id=report-question-${_id} data-bs-toggle="modal" data-bs-target="#report-question-modal">
                                Report Question
                            </a>
                        </small>
                    </div>
                </div>
            </div>
            `;
        });
    });

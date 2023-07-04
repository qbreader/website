function TossupCard({ tossup  }) {
    const _id = tossup._id;
    const packetName = tossup.packetName;

    function onClick() {
        document.getElementById('question-id').value = _id;
        document.getElementById('old-category').value = `${tossup.category} / ${tossup.subcategory}`;
    }

    const powerParts = tossup.question.split('(*)');

    return (
        <div className="card my-2">
            <div className="card-header d-flex justify-content-between clickable" data-bs-toggle="collapse" data-bs-target={`#question-${_id}`}>
                <b>
                    {tossup.setName} | {tossup.category} | {tossup.subcategory} {tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | {tossup.difficulty}
                </b>
                <b>
                    Packet {tossup.packetNumber} | Question {tossup.questionNumber}
                </b>
            </div>
            <div className="card-container collapse show" id={`question-${_id}`}>
                <div className="card-body">
                    <span dangerouslySetInnerHTML={{
                        __html: powerParts.length > 1 ? '<b>' + powerParts[0] + '(*)</b>' + powerParts[1] : tossup.question,
                    }}></span>
                    <hr className="my-3"></hr>
                    <div><b>ANSWER:</b> <span dangerouslySetInnerHTML={{
                        __html: tossup?.formatted_answer ?? tossup.answer,
                    }}></span></div>
                </div>
                <div className="card-footer" onClick={onClick} id={`fix-category-${_id}`} data-bs-toggle="modal" data-bs-target="#fix-category-modal">
                    <small className="text-muted">{packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
                    <small className="text-muted float-end">
                        <a href="#">Fix Category</a>
                    </small>
                </div>
            </div>
        </div>
    );
}


function BonusCard({ bonus }) {
    const _id = bonus._id;
    const packetName = bonus.packetName;
    const bonusLength = bonus.parts.length;
    const indices = [];

    for (let i = 0; i < bonusLength; i++) {
        indices.push(i);
    }

    function getBonusPartLabel(index, defaultValue = 10, defaultDifficulty = '') {
        const value = bonus.values ? (bonus.values[index] ?? defaultValue) : defaultValue;
        const difficulty = bonus.difficulties ? (bonus.difficulties[index] ?? defaultDifficulty) : defaultDifficulty;
        return `[${value}${difficulty}]`;
    }

    function onClick() {
        document.getElementById('question-id').value = _id;
        document.getElementById('old-category').value = `${bonus.category} / ${bonus.subcategory}`;
    }

    return (
        <div className="card my-2">
            <div className="card-header d-flex justify-content-between clickable" data-bs-toggle="collapse" data-bs-target={`#question-${_id}`}>
                <b>
                    {bonus.setName} | {bonus.category} | {bonus.subcategory} {bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : ''} | {bonus.difficulty}
                </b>
                <b>
                    Packet {bonus.packetNumber} | Question {bonus.questionNumber}
                </b>
            </div>
            <div className="card-container collapse show" id={`question-${_id}`}>
                <div className="card-body">
                    <p>{bonus.leadin}</p>
                    {indices.map((i) =>
                        <div key={`${bonus._id}-${i}`}>
                            <hr></hr>
                            <p>
                                <span>{getBonusPartLabel(i)} </span>
                                <span>{bonus.parts[i]}</span>
                            </p>
                            <div>
                                <b>ANSWER: </b>
                                <span dangerouslySetInnerHTML={{ __html: (bonus?.formatted_answers ?? bonus.answers)[i] }}></span>
                            </div>
                        </div>,
                    )}
                </div>
                <div className="card-footer" onClick={onClick} data-bs-toggle="modal" data-bs-target="#fix-category-modal">
                    <small className="text-muted">{packetName ? 'Packet ' + packetName : <span>&nbsp;</span>}</small>
                    <small className="text-muted float-end">
                        <a href="#">Fix Category</a>
                    </small>
                </div>
            </div>
        </div>
    );
}

function Reports({ tossups, bonuses }) {
    return (<>
        <h3 className="text-center mb-3">Tossups</h3>
        {tossups.map(tossup => <TossupCard key={tossup._id} tossup={tossup}/>)}
        <h3 className="text-center mt-5 mb-3">Bonuses</h3>
        {bonuses.map(bonus => <BonusCard key={bonus._id} bonus={bonus} />)}
    </>);
}

fetch('/api/admin/list-reports?' + new URLSearchParams({ reason: 'wrong-category' }))
    .then(response => response.json())
    .then(data => {
        const { tossups, bonuses } = data;
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<Reports tossups={tossups} bonuses={bonuses} />);
    });

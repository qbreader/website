function TossupCard({ tossup }) {
    const _id = tossup._id;
    const packetName = tossup.packet.name;

    function onClick() {
        document.getElementById('question-id').value = _id;
        document.getElementById('question-type').textContent = 'tossup';
        document.getElementById('old-category').value = `${tossup.category} / ${tossup.subcategory}`;
    }

    const powerParts = tossup.question.split('(*)');

    return (
        <div className="card my-2">
            <div className="card-header d-flex justify-content-between clickable" data-bs-toggle="collapse" data-bs-target={`#question-${_id}`}>
                <b>
                    {tossup.set.name} | {tossup.category} | {tossup.subcategory} {tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | {tossup.difficulty}
                </b>
                <b>
                    Packet {tossup.packet.number} | Question {tossup.questionNumber}
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
    const packetName = bonus.packet.name;
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
        document.getElementById('question-type').textContent = 'bonus';
        document.getElementById('old-category').value = `${bonus.category} / ${bonus.subcategory}`;
    }

    return (
        <div className="card my-2">
            <div className="card-header d-flex justify-content-between clickable" data-bs-toggle="collapse" data-bs-target={`#question-${_id}`}>
                <b>
                    {bonus.set.name} | {bonus.category} | {bonus.subcategory} {bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : ''} | {bonus.difficulty}
                </b>
                <b>
                    Packet {bonus.packet.number} | Question {bonus.questionNumber}
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

function Reports() {
    let [tossups, setTossups] = React.useState([]);
    let [bonuses, setBonuses] = React.useState([]);

    React.useEffect(() => {
        fetch('/api/admin/list-reports?' + new URLSearchParams({ reason: 'wrong-category' }))
            .then(response => response.json())
            .then(data => {
                tossups = data.tossups;
                bonuses = data.bonuses;
                setTossups(tossups);
                setBonuses(bonuses);
            });

        document.getElementById('fix-category-submit').addEventListener('click', function () {
            const _id = document.getElementById('question-id').value;
            const type = document.getElementById('question-type').textContent;

            this.disabled = true;
            this.textContent = 'Submitting...';

            fetch('/api/admin/update-subcategory', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id,
                    type,
                    subcategory: document.getElementById('new-category').value,
                }),
            }).then(response => {
                document.getElementById('fix-category-close').click();
                this.disabled = false;
                this.textContent = 'Submit';

                if (!response.ok) {
                    alert('Error updating subcategory');
                    return;
                }

                switch (type) {
                case 'tossup':
                    tossups = tossups.filter(tossup => tossup._id !== _id);
                    setTossups(tossups);
                    break;
                case 'bonus':
                    bonuses = bonuses.filter(bonus => bonus._id !== _id);
                    setBonuses(bonuses);
                    break;
                }
            });
        });
    }, []);

    return (<>
        <div className="row text-center">
            <h3 id="tossups">Tossups</h3>
        </div>
        <div className="float-row mb-3">
            <span className="text-muted float-start">Showing {tossups.length} tossups</span>
            <a className="float-end" href="#bonuses">Jump to bonuses</a>
        </div>
        {tossups.map(tossup => <TossupCard key={tossup._id} tossup={tossup}/>)}
        <div className="row text-center mt-5">
            <h3 id="bonuses">Bonuses</h3>
        </div>
        <div className="float-row mb-3">
            <span className="text-muted float-start">Showing {bonuses.length} bonuses</span>
            <a className="float-end" href="#tossups">Jump to tossups</a>
        </div>
        {bonuses.map(bonus => <BonusCard key={bonus._id} bonus={bonus} />)}
    </>);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Reports />);

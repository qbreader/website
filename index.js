currentlyBuzzing = false
currentQuestionNumber = 0

questions = 0;
packetnumbers = -1;
packetnumber = -1;

document.getElementById('start').addEventListener('click', async () => {
    packetname = document.getElementById('year-select').value + '-' + document.getElementById('name-select').value;
    if (packetname.length == 1) return;
    packetname = packetname.toLowerCase();
    packetnumbers = document.getElementById('packet-select').value;
    if (packetnumbers.length == 1) return;
    // process string
    packetnumbers = packetnumbers.split(',');
    for (let i = 0; i < packetnumbers.length; i++) {
        packetnumbers[i] = packetnumbers[i].trim();
        packetnumbers[i] = parseInt(packetnumbers[i]);
    }

    packetnumber = packetnumbers.shift();
    questions = await getquestions(packetname, packetnumber);

    currentQuestionNumber = document.getElementById('question-select').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';
    currentQuestionNumber = parseInt(currentQuestionNumber) - 1;
    readQuestion();
});


async function getquestions(set, packet) {
    return await fetch(`/getpacket?directory=${encodeURI(set)}&packetnumber=${encodeURI(packet)}`)
    .then(response => response.json())
    .then(data => {
        console.log(data['tossups']);
        return data['tossups'];
    });
}

async function next() {
    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    currentQuestionNumber++;
    currentlyBuzzing = false;
    if (currentQuestionNumber >= questions.length) {
        packetnumber = packetnumbers.shift();
        questions = await getquestions('2018-nasat', packetnumber);
        currentQuestionNumber = 0;
    }
    readQuestion();
}

function readQuestion() {
    document.getElementById('question-info').innerHTML = `${packetname} Packet ${packetnumber} Question ${currentQuestionNumber+1}`

    questiontext = questions[currentQuestionNumber]['question_sanitized'];
    console.log(questiontext);
    questiontextsplit = questiontext.split(' ');
    readingspeed = document.getElementById('reading-speed').value;
    var intervalId = window.setInterval(() => {
        document.getElementById('question').innerHTML += questiontextsplit.shift() + ' ';
        if (currentlyBuzzing || questiontext.length == 0) {
            clearInterval(intervalId);
        }
    }, readingspeed);
}

function displayRestOfQuestion() {
    document.getElementById('question').innerHTML = questiontext;
    document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[currentQuestionNumber]['answer_sanitized'];
}

document.getElementById('buzz').addEventListener('click', buzz);
document.getElementById('next').addEventListener('click', next);

document.addEventListener('keyup', () => {
    if (packetnumbers != -1) {
        if (event.which == 32) {  // spacebar
            if (currentlyBuzzing) {
                displayRestOfQuestion();
            } else {
                currentlyBuzzing = true;
            }
        } else if (event.which == 78) { // pressing 'N'
            next();
        }
    }
});
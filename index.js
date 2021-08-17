currentlyBuzzing = false;
currentQuestionNumber = 0;
intervalId = -1;
packetName = '';
packetNumbers = [];
packetNumber = -1;
questions = [{}];
validCategories = [];

function buzz() {
    if (currentlyBuzzing) {
        displayRestOfQuestion();
        document.getElementById('buzz').innerHTML = 'Buzz';
    } else {
        currentlyBuzzing = true;
        document.getElementById('buzz').innerHTML = 'Reveal';
    }
}

function displayRestOfQuestion() {
    document.getElementById('question').innerHTML = questiontext;
    document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[currentQuestionNumber]['answer_sanitized'];
}

async function getQuestions(set, packet) {
    return await fetch(`/getpacket?directory=${encodeURI(set)}&packetNumber=${encodeURI(packet)}`)
        .then(response => response.json())
        .then(data => {
            return data['tossups'];
        });
}

async function readQuestion() {
    clearInterval(intervalId);
    currentlyBuzzing = false;

    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('info-text').innerHTML = 'Press space to buzz';

    do {
        currentQuestionNumber++;
        if (currentQuestionNumber >= questions.length) {
            if (packetNumbers.length == 0) return;  // do nothing if there are no more packets
            packetNumber = packetNumbers.shift();
            questions = await getQuestions(packetName, packetNumber);
            currentQuestionNumber = 0;
        }
    } while (!validCategories.includes(questions[currentQuestionNumber]['category']));

    document.getElementById('question-info').innerHTML = `${packetName} Packet ${packetNumber} Question ${currentQuestionNumber + 1}`

    questiontext = questions[currentQuestionNumber]['question_sanitized'];
    questionTextSplit = questiontext.split(' ');
    intervalId = window.setInterval(() => {
        document.getElementById('question').innerHTML += questionTextSplit.shift() + ' ';
        if (currentlyBuzzing || questionTextSplit.length == 0) {
            clearInterval(intervalId);
            document.getElementById('info-text').innerHTML = 'Press space to reveal';
        }
    }, document.getElementById('reading-speed').value);
}


document.getElementById('start').addEventListener('click', async () => {
    packetyear = document.getElementById('year-select').value.trim();
    if (packetyear.length == 0) {
        window.alert('Enter a packet year.');
        return;
    }
    packetabbreviation = document.getElementById('name-select').value.trim();
    if (packetabbreviation.length == 0) {
        window.alert('Enter a packet name.');
        return;
    }
    packetabbreviation = packetabbreviation.replaceAll(' ', '_');
    packetName = packetyear + '-' + packetabbreviation;
    packetName = packetName.toLowerCase();

    packetNumbers = document.getElementById('packet-select').value.trim();
    if (packetNumbers.length == 0) packetNumbers = '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24'
    packetNumbers = packetNumbers.split(',');
    for (let i = 0; i < packetNumbers.length; i++) {
        packetNumbers[i] = packetNumbers[i].trim();
    }
    for (let i = 0; i < packetNumbers.length; i++) {
        if (packetNumbers[i].toString().includes('-')) {
            let bounds = packetNumbers[i].split('-');
            for (let i = parseInt(bounds[0]); i <= parseInt(bounds[1]); i++) {
                packetNumbers.push(i);
            }
            packetNumbers.splice(i, 1);
            i--;
        }
    }
    console.log(packetNumbers);
    packetNumber = packetNumbers.shift();

    currentQuestionNumber = document.getElementById('question-select').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';  // default = 1
    currentQuestionNumber = parseInt(currentQuestionNumber) - 2;

    validCategories = [];
    if (document.getElementById('literature').checked) validCategories.push('Literature');
    if (document.getElementById('history').checked) validCategories.push('History');
    if (document.getElementById('science').checked) validCategories.push('Science');
    if (document.getElementById('arts').checked) validCategories.push('Fine Arts');
    if (document.getElementById('religion').checked) validCategories.push('Religion');
    if (document.getElementById('mythology').checked) validCategories.push('Mythology');
    if (document.getElementById('philosophy').checked) validCategories.push('Philosophy');
    if (document.getElementById('ss').checked) validCategories.push('Social Science');

    questions = await getQuestions(packetName, packetNumber);

    readQuestion();
});

document.getElementById('buzz').addEventListener('click', buzz);
document.getElementById('next').addEventListener('click', readQuestion);

document.addEventListener('keyup', () => {
    if (document.activeElement.tagName != 'BODY') return;
    if (packetNumbers != -1) {
        if (event.which == 32) {  // spacebar
            buzz();
        } else if (event.which == 78) { // pressing 'N'
            readQuestion();
        }
    }
});
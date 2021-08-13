currentlyBuzzing = false;
currentQuestionNumber = 0;
intervalId = -1;
packetName = '';
packetNumbers = [];
packetNumber = -1;
questions = [{}];


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

async function nextQuestion() {
    clearInterval(intervalId);
    currentlyBuzzing = false;

    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('info-text').innerHTML = 'Press space to buzz';
    
    currentQuestionNumber++;
    if (currentQuestionNumber >= questions.length) {
        packetNumber = packetNumbers.shift();
        questions = await getQuestions(packetName, packetNumber);
        currentQuestionNumber = 0;
    }
    
    readQuestion();
}

function readQuestion() {
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
    clearInterval(intervalId);
    currentlyBuzzing = false;

    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('info-text').innerHTML = 'Press space to buzz';

    packetyear = document.getElementById('year-select').value;
    if (packetyear.length == 0) {
        window.alert('Enter a packet year.');
        return;
    }
    packetabbreviation = document.getElementById('name-select').value;
    if (packetabbreviation.length == 0) {
        window.alert('Enter a packet name.');
        return;
    }
    packetName = packetyear + '-' + packetabbreviation;
    packetName = packetName.toLowerCase();

    packetNumbers = document.getElementById('packet-select').value;
    if (packetNumbers.length == 0) {
        window.alert('Enter packet numbers.');
        return;
    }
    packetNumbers = packetNumbers.split(',');
    for (let i = 0; i < packetNumbers.length; i++) {
        packetNumbers[i] = packetNumbers[i].trim();
    }
    packetNumber = packetNumbers.shift();

    questions = await getQuestions(packetName, packetNumber);

    currentQuestionNumber = document.getElementById('question-select').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';  // default = 1
    currentQuestionNumber = parseInt(currentQuestionNumber) - 1;

    readQuestion();
});

document.getElementById('buzz').addEventListener('click', buzz);
document.getElementById('next').addEventListener('click', nextQuestion);

document.addEventListener('keyup', () => {
    if (document.activeElement.tagName != 'BODY') return;
    if (packetNumbers != -1) {
        if (event.which == 32) {  // spacebar
            buzz();
        } else if (event.which == 78) { // pressing 'N'
            nextQuestion();
        }
    }
});
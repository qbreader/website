function checkAnswerCorrectness(answer, givenAnswer) {
    answer = answer.toLowerCase();
    givenAnswer = givenAnswer.toLowerCase();

    return answer.indexOf(givenAnswer) !== -1;
}

function parseSetTitle(setTitle) {
    let year = parseInt(setTitle.substring(0, 4));
    let name = setTitle.substring(5);

    return [year, name];
}

function isValidCategory(question, validCategories, validSubcategories) {
    if (validCategories.length === 0) return true;
    if (!validCategories.includes(question['category'])) return false;

    if ('subcategory' in question === false) return true;
    if (validSubcategories.includes(question['subcategory'])) return true;

    // check to see if none of the subcategories of the question are selected
    let index = CATEGORIES.indexOf(question['category']);
    if (!(index in SUBCATEGORIES)) return true;

    for (let i = 0; i < SUBCATEGORIES[index].length; i++) {
        if (validSubcategories.includes(SUBCATEGORIES[index][i])) return false;
    }

    // if there are no subcategories selected in the field, then it is valid
    return true;
}

function getNextQuestion(year, name, packetNumbers, currentQuestionNumber, validCategories, validSubcategories, mode = 'tossups') {
    let packetNumber = packetNumbers[0];
    let questions = getPacket(year, name, packetNumber)[mode];
    do {  // Get the next question
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            if (packetNumbers.length == 0) {
                return {};  // alert the user if there are no more packets
            }
            packetNumber = packetNumbers.shift();
            questions = getPacket(year, name, packetNumber)[mode];
            currentQuestionNumber = 0;
        }

        // Get the next question if the current one is in the wrong category and subcategory
    } while (!isValidCategory(questions[currentQuestionNumber], validCategories, validSubcategories));

    return {
        'question': questions[currentQuestionNumber],
        'packetNumber': packetNumber,
        'packetNumbers': packetNumbers,
        'currentQuestionNumber': currentQuestionNumber
    }
}

function getPacket(year, name, packetNumber) {
    let directory = `./packets/${year}-${name}/${packetNumber}.json`;
    try {
        let jsonfile = require(directory);
        return jsonfile;
    } catch (error) {
        console.log('ERROR: Could not find packet located at ' + directory);
    }
}

module.exports = { checkAnswerCorrectness, parseSetTitle, getNextQuestion, getPacket };
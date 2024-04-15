class QuizBot {
    constructor() {
        this.username = 'QuizBot';
        this.isOnline = true;

        this.powers = 0;
        this.tens = 0;
        this.zeroes = 0;
        this.negs = 0;
        this.points = 0;
        this.tuh = 0;
        this.celerity = {
            all: {
                total: 0,
                average: 0,
            },
            correct: {
                total: 0,
                average: 0,
            },
        };
    }

    decideBuzzPoint(questionLength) {
        // Calculate the minimum index for buzzing, ensuring it's at least 40% into the question
        const minIndex = Math.floor(questionLength * 0.4);

        // Calculate a random index between the minimum index and the end of the question
        // The "+ 1" ensures that the end of the question is inclusive in the range
        const buzzIndex = Math.floor(Math.random() * (questionLength - minIndex + 1)) + minIndex;

        return buzzIndex;
    }
}

export default QuizBot;
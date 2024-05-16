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

    decideBuzzPoint(questionLength, botDifficulty) {
        // Ensure botDifficulty is within the range 0-100
        botDifficulty = Math.max(0, Math.min(100, botDifficulty));

        // Calculate the buzz point based on the difficulty
        // If difficulty is 90, buzz in when 90% of the question is left (i.e., at 10% of the length)
        const buzzPoint = Math.ceil(questionLength * (1 - botDifficulty / 100));
        
        return buzzPoint;
    }
}

export default QuizBot;
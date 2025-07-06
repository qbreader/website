export default class QuestionClient {
  onmessage (message) {
    const data = JSON.parse(message.data);
    switch (data.type) {
      case 'end-of-set': return this.endOfSet(data);
      case 'no-questions-found': return this.noQuestionsFound(data);
    }
  }

  endOfSet () {
    window.alert('You have reached the end of the set');
  }

  noQuestionsFound () {
    window.alert('No questions found');
  }
}

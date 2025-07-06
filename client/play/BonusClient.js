import QuestionClient from './QuestionClient.js';

export default class BonusClient extends QuestionClient {
  onmessage (message) {
    const data = JSON.parse(message.data);
    switch (data.type) {
      default: super.onmessage(message);
    }
  }
}

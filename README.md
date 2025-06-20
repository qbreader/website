# qbreader/website

A website for practicing quizbowl online, including singleplayer, multiplayer, and a searchable database of questions.
Inspired by [QuizBug](https://quizbug2.karangurazada.com/) and [Protobowl](https://protobowl.com/).
See [qbwiki](https://www.qbwiki.com/wiki/QBReader) and the official [about page](https://www.qbreader.org/about) for more information.

## Running the Server

Please read the [contributing guidelines](.github/CONTRIBUTING.md#running-the-server) for instructions on how to run the server.

## Contributing

Pull requests and Github issues are welcome!
Please read the [contributing guidelines](.github/CONTRIBUTING.md) before making changes.

### Answer Checking

Feel free to contribute to the answer checking code located at [this repository](https://github.com/qbreader/qb-answer-checker) which is published as an [npm package](https://www.npmjs.com/package/qb-answer-checker).

## Tech Stack

qbreader.org uses:

- Heroku to host its backend
- MongoDB to store the question data
- [MailerSend](https://www.mailersend.com/) to send emails
- [Namecheap](https://www.namecheap.com/) to manage the domain
- [BetterStack/Logtail](https://elements.heroku.com/addons/logtail) for logging integration with Heroku
- [Heroku Scheduler](https://elements.heroku.com/addons/scheduler) to restart the server at 8:00 AM UTC (3 AM EST / 4 AM EDT) every day
  - Based on [protobowl always restarting at 4 am](https://github.com/neotenic/protobowl?tab=readme-ov-file), since supposedly that's when it's the least busy
  - See https://stackoverflow.com/questions/43926740/schedule-heroku-to-restart-dynos-every-10-or-so-minutes for more information

# qbreader/website
- A [QuizBug](https://quizbug2.karangurazada.com/)/[Protobowl](https://protobowl.com/)/tkbot where you pick a packet and it reads tossups or bonuses to you.
- Supports both singleplayer and multiplayer.

## Running the Server
If you're interested in running the server locally or deploying a clone, please **contact me** @geoffrey-wu so I can give you (read-only) credentials to the server.

1) Clone the repository and navigate to its root directory.
e.g. `git clone https://github.com/qbreader/website && cd website`
2) Run `npm install`.
3) Run `npm start`.
The website is at localhost:3000

## Tech Stack

qbreader.org uses Heroku to host its backend, which is a NodeJS Express app that serves static HTML/CSS/JS connected to a Namecheap domain.
The front-end is all vanilla JS.
The CSS is compiled from source from Bootstrap Sass + my own modifications (especially for dark mode!)

## Contributing

Pull requests are welcome.
I also appreciate feedback and feature suggestions through email, discord, or issues.

## Inspiration
- https://github.com/kgurazad/quizbug2

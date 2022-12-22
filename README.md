# qbreader/website

- A [QuizBug](https://quizbug2.karangurazada.com/)/[Protobowl](https://protobowl.com/)/tkbot where you pick a packet and it reads tossups or bonuses to you.
- Supports both singleplayer and multiplayer.
- Also contains a searchable database.

## Running the Server

If you're interested in running the server locally or deploying a clone, please **contact me** on discord at [thedoge#1189](https://discord.com/users/298250592135020545) so I can give you (read-only) credentials to the server.

1. Clone the repository and navigate to its root directory.
   e.g. `git clone https://github.com/qbreader/website && cd website`
2. Run `npm install`.
3. Run `npm start`.
   The website is at localhost:3000

The website is built by default, but if you make any changes, you can rebuild using `npm run build`.

## Tech Stack

qbreader.org uses Heroku to host its backend, which is a NodeJS Express app that serves static HTML/CSS/JS connected to a Namecheap domain.
The front-end uses react for the database page and pure vanilla JS for the other pages.
The CSS is compiled from source from Bootstrap Sass + my own modifications (especially for dark mode!)

## Contributing

Pull requests are welcome.
I also appreciate feedback and feature suggestions through email, discord, or issues.
Make sure to format your code using the provided eslint rules.
I recommend sorting your HTML attributes using [this vscode extension](https://marketplace.visualstudio.com/items?itemName=mrmlnc.vscode-attrs-sorter),
which I have configured to follow https://codeguide.co/#attribute-order.

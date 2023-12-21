# qbreader/website

- A [QuizBug](https://quizbug2.karangurazada.com/)/[Protobowl](https://protobowl.com/) where you pick a packet and it reads tossups or bonuses to you.
- Supports both singleplayer and multiplayer.
- Contains a searchable database.

## Running the Server

If you're interested in running the server locally or deploying a clone, please **contact me** on discord at [thedoge42](https://discord.com/users/298250592135020545) so I can give you (read-only) credentials to the server.

1. Clone the repository and navigate to its root directory.
   e.g. `git clone https://github.com/qbreader/website && cd website`
2. Run `npm install`.
3. Create a `.env` file in the root of the directory, and insert values for `MONGODB_USERNAME` and `MONGODB_PASSWORD` (will need to ask me for credentials).
4. Run `npm start`.
   The website is at localhost:3000

The website is built by default, but if you make any changes, you can rebuild using `npm run build`.

## Contributing

Pull requests are welcome!
I also appreciate feedback and feature suggestions through email, discord, or issues.
Make sure to format your code using the provided eslint rules and check by running `npm run lint`.
I recommend sorting your HTML attributes using [this vscode extension](https://marketplace.visualstudio.com/items?itemName=mrmlnc.vscode-attrs-sorter), which I have configured to follow https://codeguide.co/#attribute-order.

### Answer Checking

Feel free to contribute to the answer checking code located at [this repository](https://github.com/qbreader/qb-answer-checker) which is published as an [npm package](https://www.npmjs.com/package/qb-answer-checker).

### Code Structure

All code that is sent to the **client** is located in `client/`.
However, the raw .scss files are located in the `scss/` folder and are compiled into .css files using `npm run sass`.

All code that directly interfaces with the **database** is located in `database/`.

All code that deals with **routing** is located in `routes/`, with the folder structure inside the folder mirroring the url structure.
For example, `routes/api/packets.js` handles all requests to `/api/packets`.
`index.js` files handle the root of a folder, so `routes/api/index.js` handles all requests to `/api`.

All remaining server-side code is located in `server/`.

## Tech Stack

qbreader.org uses Heroku to host its backend and MongoDB to store the question data and geoword audio[^1].

[^1]: This may change; see [this Github issue](https://github.com/qbreader/website/issues/213).

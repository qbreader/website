Users interested in contributing to this repository should read this document before making changes.

# Running the Server

If you're interested in running the server locally or deploying a clone, please **contact me** on discord at [thedoge42](https://discord.com/users/298250592135020545) so I can give you (read-only) credentials to the MongoDB server.

1. Clone the repository and navigate to its root directory.
   e.g. `git clone https://github.com/qbreader/website && cd website`
2. Run `npm install`.
3. Run `npm run build` to build `.jsx` files to `.js` and `.scss` files to `.css`.
4. Create a `.env` file in the root of the directory, and insert values for `MONGODB_USERNAME` and `MONGODB_PASSWORD` (will need to ask me for credentials).
5. Run `npm start`.
   The website is at localhost:3000

If you make any changes, you can rebuild using `npm run build`.
You can watch changes in .jsx files by running `npm run webpack-watch`.

# Code Structure

All code that is sent to the **client** is located in `client/`.
However, the raw .scss files are located in the `scss/` folder and are compiled into .css files using `npm run sass`.

All code that directly interfaces with the **database** is located in `database/`.

All code that deals with **routing** is located in `routes/`, with the folder structure inside the folder mirroring the url structure.
For example, `routes/api/packets.js` handles all requests to `/api/packets`.
`index.js` files handle the root of a folder, so `routes/api/index.js` handles all requests to `/api`.

- Static files are served using express.static (in /routes/index.js) based on the folder structure in `client/`.
- Type validation should occur in the code for a route endpoint inside `routes/`.
- Functions in the `database/` folder can assume that the arguments have the correct type, but may logically be incorrect.

All remaining server-side code is located in `server/`.

## innerText vs. textContent vs. innerHTML

Do **not** use innerText - use textContent instead for these cases.
See <https://kellegous.com/j/2013/02/27/innertext-vs-textcontent/> for an explanation why.
Think carefully about using innerHTML on user input, but it's generally fine to use otherwise.

# Style Guide

You must use [semistandard](https://github.com/standard/semistandard) to format your javascript code, which you can do by running `npm run lint`.
Github actions will fail if this requirement is not met.
You can install [this VS Code extension](https://marketplace.visualstudio.com/items?itemName=standard.vscode-standard) to autoformat your code.

- Classes with a lowercase name should consist of all static methods.
  Conversely, one should expect to make instances of classes that begin with a capital letter.

## Code Order

Generally speaking, within a javascript file in the `client/` folder, the following order should occur from top to bottom:

1. imports
2. global variables
3. function definitions
4. HTML DOM event listeners
5. other code

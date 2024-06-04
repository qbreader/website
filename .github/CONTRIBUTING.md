Users interested in contributing to this repository should read this document before making changes.

# Running the Server

If you're interested in running the server locally or deploying a clone, please **contact me** on discord at [thedoge42](https://discord.com/users/298250592135020545) so I can give you (read-only) credentials to the server.

1. Clone the repository and navigate to its root directory.
   e.g. `git clone https://github.com/qbreader/website && cd website`
2. Run `npm install`.
3. Create a `.env` file in the root of the directory, and insert values for `MONGODB_USERNAME` and `MONGODB_PASSWORD` (will need to ask me for credentials).
4. Run `npm start`.
   The website is at localhost:3000

The website is built by default, but if you make any changes, you can rebuild using `npm run build`.

# Code Structure

All code that is sent to the **client** is located in `client/`.
However, the raw .scss files are located in the `scss/` folder and are compiled into .css files using `npm run sass`.

All code that directly interfaces with the **database** is located in `database/`.

All code that deals with **routing** is located in `routes/`, with the folder structure inside the folder mirroring the url structure.
For example, `routes/api/packets.js` handles all requests to `/api/packets`.
`index.js` files handle the root of a folder, so `routes/api/index.js` handles all requests to `/api`.

- Type validation should occur in the code for a route endpoint inside `routes/`.
- Functions in the `database/` folder can assume that the arguments have the correct type, but may logically be incorrect.

All remaining server-side code is located in `server/`.

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

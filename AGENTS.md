# AGENTS.md

Guidance for AI agents working on the qbreader/website codebase. Read this fully before making changes — the repo has strong conventions and an unusual isomorphic architecture that are easy to violate if you pattern-match from typical Node/React projects.

## What This Project Is

[qbreader.org](https://www.qbreader.org) is a website for practicing quizbowl (competitive academic trivia). It offers:

- **Singleplayer practice** — tossups and bonuses read word-by-word in the browser, with buzzing, answer checking, and stat tracking. Runs entirely client-side.
- **Multiplayer rooms** — real-time rooms over WebSockets where players hear the same question and race to buzz.
- **A searchable question database** — tens of thousands of tossups/bonuses from real tournaments, stored in MongoDB.
- **Geoword** — a paid audio-based geography competition (Stripe integration).
- **User accounts** — stats, starred questions, email verification, leaderboards.

The production stack is Heroku + MongoDB Atlas. The server intentionally restarts daily at 8:00 AM UTC.

## Philosophy

These are the principles this codebase is built on. Work within them rather than against them.

1. **Boring, dependency-light JavaScript.** This is a plain ES-modules Node.js + vanilla-browser-JS project. There is no TypeScript, no framework on the server beyond Express, and React is used only on a handful of complex pages. Do not introduce new frameworks, build steps, or dependencies when the existing tools can do the job. A new npm package needs a strong justification.

2. **Types are documentation, enforced by discipline.** Types live in JSDoc comments (see `types.js` for the core `Tossup`/`Bonus`/`Packet`/`Set` typedefs). Keep JSDoc accurate on any function you touch. Do not add TypeScript.

3. **Validate at the boundary, trust inside.** Every HTTP query parameter is validated/coerced in `routes/` using the helpers in `routes/validators/`. Functions in `database/` **assume their arguments are already type-correct** (though they may be logically wrong, e.g. a set name that doesn't exist). Never put type validation in `database/`; never skip it in `routes/`.

4. **Write once, run on both sides.** The quizbowl game engine in `shared/` runs unchanged in the browser (solo play) and on the server (multiplayer). Code in `shared/` must never import server-only (`fs`, `mongodb`, …) or browser-only (`document`, `window`, …) dependencies. This isomorphism is the most valuable property of the architecture — protect it.

5. **Small files, one job each.** Database functions are one-per-file (`get-tossup.js`, `create-user.js`). Routes mirror the URL structure one-per-file. Follow this granularity; don't create grab-bag utility files.

6. **Match the house style exactly.** Lint (`semistandard`) is a hard CI gate. Beyond lint, follow the naming and ordering conventions below — consistency is valued over personal preference.

7. **Verify before you claim done.** There is no automated test suite. Correctness is established by building (`npm run build`), running the server, and exercising the affected page or endpoint. Never consider a task complete on the strength of "it should work."

## Repository Layout

```
app.js                 Express app assembly (middleware, session, security headers)
server.js              Entry point: HTTP server + WebSocket server
types.js               JSDoc typedefs for core question data shapes

client/                Everything served to the browser (static, no server code)
  play/                Game pages: tossups/, bonuses/, mp/ (multiplayer), geoword/
  db/                  Question database explorer (React)
  scripts/             Shared client utilities, api wrappers, React components
  user/                Account pages (login, signup, stats, stars)
  ssi/                 HTML fragments injected server-side (nav, head, modals)
  admin/, settings/, about/, tools/  Misc pages

shared/                Isomorphic game engine + constants (client AND server)
  Room.js → QuestionRoom.js → TossupRoom.js / BonusRoom.js / TossupBonusRoom.js
  Player.js, Team.js, CategoryManager (category-manager.js), categories.js

routes/                Express routers; folder structure mirrors URL structure
  api/                 Public JSON API (/api/tossup, /api/query, …)
  auth/                Account endpoints (login, signup, password reset, stars)
  validators/          Query-param validation helpers (int, enum, string, …)
  ssi-middleware.js    Injects client/ssi/ fragments into served HTML

database/              All MongoDB access, one function per file
  databases.js         MongoClient connection (top-level await on import)
  qbreader/            Question data (three databases: qbreader,
  account-info/         account-info, geoword — each folder has a
  geoword/              collections.js exporting its collections)

server/                Remaining server-only code
  multiplayer/         WebSocket room server (wraps shared/ room classes)
  moderation/          IP bans, username filtering, profanity checks
  authentication.js    Password hashing, JWTs, email verification tokens

scss/                  Source styles → compiled to client/style.css via sass
tools/                 Operator CLI scripts (upload sets, backups, migrations)
docs/                  Static assets served by GitHub Pages (not documentation)
.github/CONTRIBUTING.md  Human contributor guide — the conventions there apply
```

Routing example: `routes/api/packet.js` handles `/api/packet`; `routes/api/index.js` handles `/api`. Static files are served from `client/` by express.static with `.html` extension inference, plus `node_modules/` and `shared/` are served statically (client code imports Bootstrap and shared modules by URL path).

## The Game Engine (read before touching gameplay)

The core abstraction is a **Room** that receives typed messages and emits typed messages, defined in `shared/`:

- `Room` — players, sockets, timer, `message()` dispatch, `emitMessage()` broadcast.
- `QuestionRoom` — query settings (set, categories, difficulties), question fetching.
- `TossupRoom` / `BonusRoom` / `TossupBonusRoom` — game-mode logic (buzzing, reading speed, scoring), built partly via mixins (`TossupRoomMixin`).

**Solo play** (`client/play/tossups/`, `client/play/bonuses/`): the room class runs *in the browser* (`SoloTossupRoom`), wired to a fake socket object whose `sendToServer` calls `room.message(...)` directly and whose `send` calls the client's `onmessage`. No server round-trips during gameplay.

**Multiplayer** (`server/multiplayer/`): `ServerTossupRoom` etc. extend the same shared classes, adding persistence, moderation, vote-kick, and real WebSocket sockets (`handle-wss-connection.js`). The browser side (`client/play/mp/`) uses a real WebSocket with the same message protocol.

Client counterparts live in `client/play/*Client.js` (`QuestionClient` → `TossupClient` → …): they receive room messages and update the DOM. When you add a message type, you must handle it in the room class (game state), the client class (DOM), and — for multiplayer — confirm it serializes over the wire (10 KB max WebSocket payload).

## Build, Run, Verify

```sh
npm install
npm run build        # webpack (.jsx → .min.js) + sass (scss → client/style.css)
npm start            # serve on localhost:3000
npm run lint         # semistandard --fix (CI gate)

npm run webpack -- --watch   # rebuild .jsx on change
npm run sass -- --watch      # rebuild .scss on change
```

Requirements and gotchas:

- **`.env` is required.** `MONGODB_USERNAME`/`MONGODB_PASSWORD` (or `MONGODB_URI`) must point at a MongoDB instance with the qbreader data; credentials for the real read-only DB come from the maintainer (see CONTRIBUTING.md). `databases.js` uses **top-level await** — merely importing anything that touches `database/` connects to MongoDB, so the server won't boot without a reachable DB. Other env vars: `SECRET`, `SALT`, `SECRET_KEY_1`, `SECRET_KEY_2` (required in production, defaulted in dev), `EMAIL_USERNAME`/`EMAIL_PASSWORD`, `STRIPE_SECRET_KEY`/`STRIPE_SIGNING_SECRET`, `BASE_URL`, `PORT`, `NODE_ENV`.
- **Build artifacts are gitignored.** `**.min.js`, `**.css`, `**.css.map` are never committed. If a page looks broken or unstyled, run `npm run build` first. Never edit a `.min.js` or `client/style.css` directly — edit the `.jsx` or `scss/` source.
- React pages are only the six webpack entries in `webpack.config.js` (tossups, bonuses, mp room, db explorer, frequency list, category reports). Everything else is plain JS/HTML served as-is — **plain `.js` client files are not transpiled or bundled**, so they must be valid browser ES modules as written.
- Some client files import directly from CDNs (e.g. `qb-answer-checker` from jsdelivr in `client/scripts/api/index.js`); this is intentional.
- HTML pages use a homegrown SSI system: `<!--#include virtual="/ssi/nav.html" -->` comments are replaced server-side (`routes/ssi-middleware.js`) with fragments from `client/ssi/`. New pages should include `head.html` and `nav.html` the same way.

### Verification expectations

Lint must pass (`npm run lint` — it auto-fixes most issues). Then actually exercise your change: load the affected page, hit the endpoint with curl, or play through the game flow you modified. For gameplay changes test both solo and multiplayer paths if the change is in `shared/`.

## Code Conventions

- **Style**: [semistandard](https://github.com/standard/semistandard) — 2-space indent, semicolons, single quotes. CI fails otherwise.
- **Modules**: ESM everywhere (`"type": "module"`). Use explicit file extensions in imports (`./foo.js`).
- **Naming**: kebab-case filenames for modules (`get-random-name.js`); PascalCase filenames for classes (`TossupRoom.js`). A class with a **lowercase name consists of all static methods** (e.g. `api`, `account`); a **capitalized class is meant to be instantiated**.
- **Client file ordering** (top to bottom): imports → global variables → function definitions → DOM event listeners → other code.
- **DOM**: use `textContent`, never `innerText`. Think hard before using `innerHTML` with user-influenced input — user-facing multiplayer strings are sanitized with DOMPurify on the server; don't create new unsanitized paths.
- **Routes**: validate every query param through `routes/validators/` helpers (they coerce, clamp, and default rather than reject where sensible). Return proper status codes: 400 for invalid input, 404 for not found, JSON bodies for data.
- **Database**: one exported function per file; JSDoc the parameters and return type; get collections from the folder's `collections.js`.

## Boundaries and Cautions

- **Don't touch money or auth casually.** `routes/api/webhook.js` (Stripe, uses raw body parsing mounted *before* `express.json()` — order matters), `server/authentication.js`, and `database/geoword/` payment code should only change when the task explicitly requires it.
- **Rate limiting and moderation exist for a reason** (`server/RateLimit.js`, `server/moderation/`). Don't loosen limits, ban logic, or the 10 KB WebSocket max payload as a side effect.
- **Deprecated API routes** (`routes/api/deprecated/`) are kept for external consumers. Don't delete or change their behavior.
- **The answer checker is a separate package** ([qb-answer-checker](https://github.com/qbreader/qb-answer-checker)). Answer-judging bugs are usually fixed there, not here.
- **`docs/` is not documentation** — it's static assets for GitHub Pages. Real contributor docs are `README.md` and `.github/CONTRIBUTING.md`.
- The MongoDB data itself is shared infrastructure. Tools in `tools/` mutate the live database — never run them speculatively.

## How to Approach a Task

1. **Locate by URL.** Given a page or endpoint, the file is where the URL says it is: `/api/query` → `routes/api/query.js`; `/play/tossups` → `client/play/tossups/`.
2. **Trace the layer boundary.** Route → validator → database function, or client → room message → client handler. Make your change at the correct layer.
3. **Check `shared/` impact.** If your change touches anything in `shared/`, it affects solo play, multiplayer, and possibly the server simultaneously.
4. **Keep diffs minimal and idiomatic.** Small files, small functions, house naming. A change that requires reformatting unrelated code is a smell.
5. **Build, run, click through it, lint.** Then you're done — not before.

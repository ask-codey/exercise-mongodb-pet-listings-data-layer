# Exercise: Pet Listings Data Layer

Exercise code for the lesson **Exercise: Pet Listings Data Layer** in the MongoDB in Depth course on [ask-codey.com](https://www.ask-codey.com).

The Maple Street Pet Adoption Center's API kept its pets in an array, so every restart lost them. Now it's moving to MongoDB. The routes, the app and the server are ready; the data layer isn't. You'll finish `data/pets.js`, the one file that talks to MongoDB: the list with its filters and pages, one pet by its id, adding a pet, changing a pet, telling a real id from text that can't be one, and the indexes the list needs. Tests send requests to the API on a throwaway MongoDB of their own and check every answer.

## What's here

- `data/pets.js`: the data layer. Six functions are for you to finish: `isPetId`, `listPets`, `getPet`, `addPet`, `updatePet` and `createIndexes`. The comment above each one says what it should give back, with examples. `useDatabase`, `toPet` and `toListing` are ready to use.
- `routes/pets.js`: the routes, `GET /pets`, `GET /pets/:id`, `POST /pets` and `PATCH /pets/:id`. Each one reads the request, awaits a function from `data/pets.js`, and answers: 400 when `isPetId` says no, 404 when the data layer gives back `null`. Ready to use.
- `app.js`: `createApp(db)`, which builds the Express app around the database it's given and hands that database to the data layer. Its error handler answers 409 for a duplicate name and 500 for anything unexpected. The comment at its top lists every request and its answer. Ready to use.
- `problems.js`: `sendProblem`, which sends every error in one shape, `{ status, title, detail }`. Ready to use.
- `server.js`: connects to your MongoDB once, builds the app with your `maple_street` database, creates the indexes, and starts the API at `http://localhost:3100`. Ready to use.
- `.env.example`: the connection string `npm start` uses, to copy to `.env`. Ready to use.
- `pets.http`: the requests to try, for VS Code's REST Client extension. Ready to use.
- `test/pets.test.js`: the tests. Tests 1 to 3 call the data layer's functions, and tests 4 to 17 send requests to `createApp` with Supertest. You don't need to change this file.
- `test/test-database.js`: starts the throwaway MongoDB the tests use, and puts the 12 pets back before every test. You don't need to change it: the lesson *Testing the Data Layer with mongodb-memory-server* explains how it works.
- `test/seed/pets.json`: the center's 12 pets, with fixed ids, so the answers match the examples. `test/seed/load-into-mongosh.js` puts them into your own database for `npm start`.
- `package.json`: the project's settings, its scripts (`start`, `dev` and `test`), and the packages it uses at exact versions: Express and the MongoDB driver, and for the tests Supertest and mongodb-memory-server. Ready to use.

## Before you start

In VS Code's terminal, in this folder, install the packages (once):

```bash
npm install
```

It makes a `node_modules` folder. That folder is in `.gitignore`, so Git leaves it out: `npm install` makes it again on any computer.

Then copy `.env.example` to a new file named `.env`: `Copy-Item .env.example .env` in PowerShell, or `cp .env.example .env` on a Mac. `.env` is in `.gitignore` too, so a connection string with a password never reaches GitHub.

## Run it

`npm start` uses the `maple_street` database in your own MongoDB. To give it the center's 12 pets, start mongosh in this folder and load them (it empties the `pets` collection first, so running it twice is safe):

```bash
mongosh
```

```mongodb
use maple_street
load("test/seed/load-into-mongosh.js")
```

It prints `pets: 12 documents`, then `true`. Type `exit`, then start the API:

```bash
npm start
```

The terminal says `Maple Street's pet API is listening on http://localhost:3100` and keeps running. Open `pets.http` and click **Send Request** above any request; REST Client shows the answer beside it. Until you finish the data layer, most requests answer 500. Stop the server with **Ctrl+C**: it closes the database connection and says so.

`npm run dev` starts it with `node --watch`, so it restarts each time you save a file.

## Check your work

```bash
npm test
```

No server and no MongoDB of your own need to be running: the tests start a throwaway MongoDB, put the 12 pets in it before every test, and never touch your own databases. At first all 17 tests fail: that is expected. Each function you finish turns its tests green. A failing test's message says what it expected and what came back, for example *GET /pets should answer 200, but it answered 500 with {"status":500,"title":"Internal Server Error","detail":"Something went wrong on our side."}.*

If you installed MongoDB in the course's setup lesson, the tests use it. If you didn't, the first `npm test` downloads MongoDB 9.0.8 for the tests (about 950 MB on Windows, about 180 MB on a Mac) and keeps it for every exercise after this one.

## The rules

- Change only `data/pets.js`. The routes, `app.js`, `server.js` and the tests stay as they are.
- Every MongoDB call goes in `data/pets.js`, through the `pets` collection that `useDatabase` fills in.
- Every pet the data layer gives back is made with `toPet` (a whole pet) or `toListing` (a pet in a list), so its id is text and no `_id` reaches an answer.
- `listPets` sorts by name and shows 5 pets a page: page 1 is the first 5, page 2 the next 5, and so on.
- A new pet's `status` is `"available"`.
- `getPet` and `updatePet` give back `null`, not `undefined`, when no pet has the id.
- `createIndexes` makes exactly two indexes: `{ species: 1, name: 1 }`, and `{ name: 1 }` with `unique: true`.

## Tips

- Start with `isPetId`: the driver's `ObjectId.isValid(id)` answers it without asking the database.
- Build `listPets`'s filter piece by piece: an empty object, then `species` only when it isn't `undefined`, then `traits: "good with kids"` only when `goodWithKids` is true. Then `sort`, `skip` and `limit`, before `toArray()`.
- Page 3 skips the first 10 pets: `(page - 1) * 5`.
- An id from the address is text. `new ObjectId(id)` turns it into the ObjectId that `_id` holds.
- `insertOne` gives back `insertedId`, the new pet's `_id`. Put it on the document before you hand it to `toPet`.
- `findOneAndUpdate` with `$set` and `{ returnDocument: "after" }` changes a pet and gives back the changed document, or `null` when nothing matched.
- `createIndex` is the same call as in mongosh, awaited.

## Hand it in

When it works, push your solution to a public repo of your own on GitHub, then paste that repo's address into **Submit your exercise** on the lesson page at [ask-codey.com](https://www.ask-codey.com). That's what completes the lesson. The lesson page shows the Git commands, step by step.

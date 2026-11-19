// The Maple Street Pet Adoption Center's API, with its pets in MongoDB. createApp(db) builds the Express app around
// the database it's given. Ready to use.
//
// server.js hands createApp your maple_street database, and the tests hand it a throwaway one. createApp passes it
// to the data layer with useDatabase(db). Every address that starts with /pets goes to routes/pets.js.
//
//   GET   /pets                                    200, the first 5 pets in name order, Bean to Juniper
//   GET   /pets?species=cat&goodWithKids=true      200, only cats, only the ones good with kids
//   GET   /pets?page=3                             200, the third page of 5: Rocket and Ziggy
//   GET   /pets/6740c0000000000000000002           200, Mochi
//   GET   /pets/6740c0000000000000000099           404, { "status": 404, "title": "Not Found",
//                                                        "detail": "There's no pet 6740c0000000000000000099." }
//   GET   /pets/2                                  400, { "status": 400, "title": "Bad Request",
//                                                        "detail": "2 isn't a pet id." }
//   POST  /pets                                    201, the new pet, for a JSON body such as
//                                                  { "name": "Waffles", "species": "dog", "age": 4, "traits": ["good with kids"] }
//                                                  400 when the body has no name or no species
//                                                  409 when another pet already has that name
//   PATCH /pets/6740c0000000000000000006           200, Rocket with the changes in the JSON body, such as
//                                                  { "status": "adopted" }; 404 and 400 as for GET
//   any other address                              404
//   an error in any route                          500, with the details in the terminal
import express from "express";
import { useDatabase } from "./data/pets.js";
import { petsRouter } from "./routes/pets.js";
import { sendProblem } from "./problems.js";

export function createApp(db) {
  // The data layer works with this database from now on.
  useDatabase(db);

  const app = express();

  // Reads a request's JSON body into req.body.
  app.use(express.json());

  // Every address that starts with /pets goes to the routes in routes/pets.js.
  app.use("/pets", petsRouter);

  // Any other address: 404.
  app.use((req, res) => {
    sendProblem(res, 404, `There's nothing at ${req.path}.`);
  });

  // An error in any route ends up here, including one from MongoDB.
  app.use((err, req, res, next) => {
    // A body that isn't valid JSON is the caller's mistake: 400.
    if (err.type === "entity.parse.failed") {
      sendProblem(res, 400, "The request body isn't valid JSON.");
      return;
    }
    // 11000 is MongoDB's duplicate key error: the unique index on name refused a second pet with that name.
    if (err.code === 11000) {
      sendProblem(res, 409, "Another pet already has that name.");
      return;
    }
    // 121 means a validator refused the document (this exercise adds none, but the lesson's API has one).
    if (err.code === 121) {
      sendProblem(res, 400, "That pet breaks the center's rules: check its name, species and age.");
      return;
    }
    // Anything else, such as MongoDB being down, is the server's problem: the details go to the terminal, never
    // to the caller.
    console.error(err);
    sendProblem(res, 500, "Something went wrong on our side.");
  });

  return app;
}

// Starts the Maple Street Pet Adoption Center's API at http://localhost:3100, with its pets in your MongoDB's
// maple_street database.
// Run it with: npm start (or npm run dev, which restarts it each time you save a file). Stop it with Ctrl+C.
// npm start reads MONGODB_URI from .env (node --env-file=.env), so copy .env.example to .env before the first start.
// Ready to use: you don't need to change this file.
import { MongoClient } from "mongodb";
import { createApp } from "./app.js";
import { createIndexes } from "./data/pets.js";

const port = 3100;

// One client for the whole app, connected once, before the server takes its first request.
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const app = createApp(client.db("maple_street"));
await createIndexes();

const server = app.listen(port, () => {
  console.log(`Maple Street's pet API is listening on http://localhost:${port}`);
});

// Ctrl+C: stop taking requests, then close the database connection.
process.on("SIGINT", async () => {
  server.close();
  await client.close();
  console.log("Stopped the server and closed the database connection.");
});

// Starts the throwaway MongoDB the tests use. You don't need to change it: it works like the helper in the course's
// earlier exercises, which the lesson "Testing the Data Layer with mongodb-memory-server" opens up.
//
// What it does, in order:
//   1. Starts a throwaway MongoDB for the tests (mongodb-memory-server), so your own databases are never touched.
//      If MongoDB is installed on this computer (the course's setup lesson), it uses that one. If not, the first
//      run downloads one into a cache folder, once per computer, as package.json's "config" asks.
//   2. Before every test, empties that database and loads each file in test/seed: pets.json becomes the pets
//      collection, with the center's 12 pets.
//   3. Gives the tests that database, with testDatabase().

import { before, after, beforeEach } from "node:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, BSON } from "mongodb";

const seedFolder = new URL("./seed/", import.meta.url);
let server;
let client;
let database;

// The mongod program the course's setup lesson installs, if this computer has it.
function installedMongoDB() {
  if (process.env.MONGOMS_SYSTEM_BINARY) {
    return undefined; // you named one yourself, and mongodb-memory-server uses that
  }
  const places = ["/opt/homebrew/bin/mongod", "/usr/local/bin/mongod", "/usr/bin/mongod"]; // macOS and Linux
  const windows = "C:\\Program Files\\MongoDB\\Server"; // one folder per version, such as 9.0
  if (process.platform === "win32" && existsSync(windows)) {
    const versions = readdirSync(windows).sort((a, b) => parseFloat(b) - parseFloat(a)); // newest first
    places.unshift(...versions.map((version) => `${windows}\\${version}\\bin\\mongod.exe`));
  }
  return places.find((place) => existsSync(place));
}

// Call this once at the top of a test file: it starts the database before the tests, reloads the seed data before
// each test, and stops everything after the last one.
export function startTestDatabase() {
  before(async () => {
    const installed = installedMongoDB();
    server = await MongoMemoryServer.create(installed ? { binary: { systemBinary: installed } } : {});
    client = await MongoClient.connect(server.getUri());
    database = client.db("maple_street");
  });

  beforeEach(async () => {
    await database.dropDatabase();
    for (const file of readdirSync(seedFolder).filter((name) => name.endsWith(".json"))) {
      // Extended JSON, so the ids come back as real ObjectIds.
      const documents = BSON.EJSON.parse(readFileSync(new URL(file, seedFolder), "utf8"));
      await database.collection(file.replace(".json", "")).insertMany(documents);
    }
  });

  after(async () => {
    await client?.close();
    await server?.stop();
  });
}

// The throwaway database, once startTestDatabase's before has run: the tests hand it to createApp(db).
export function testDatabase() {
  return database;
}

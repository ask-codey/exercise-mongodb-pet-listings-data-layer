// Tests for data/pets.js. Run them with: npm test (run npm install once first).
// Before every test, a throwaway MongoDB (test/test-database.js) holds the center's 12 pets from test/seed/pets.json.
// Tests 1 to 3 call the data layer's functions; tests 4 to 17 send requests to createApp(db) with Supertest and check
// the answer, and the ones that change pets also check MongoDB. No server needs to be running, and your own
// databases are never touched. You don't need to change this file.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { ObjectId } from "mongodb";
import { createApp } from "../app.js";
import { useDatabase, isPetId, listPets, createIndexes } from "../data/pets.js";
import { startTestDatabase, testDatabase } from "./test-database.js";

startTestDatabase();

// The data layer works with the throwaway database in every test, even the ones that don't call createApp.
beforeEach(() => {
  useDatabase(testDatabase());
});

const mochi = {
  id: "6740c0000000000000000002", name: "Mochi", species: "cat", age: 2, traits: ["calm", "indoor only"],
  status: "available",
};
const missingId = "6740c0000000000000000099";

// The pets collection in the throwaway database, for the tests that check a change.
function storedPets() {
  return testDatabase().collection("pets");
}

// The names of the pets in an answer, in order, such as ["Juniper", "Olive"].
function names(body) {
  return Array.isArray(body) ? body.map((pet) => pet.name) : body;
}

// What a list answer held, for a failing test's message: "It gave back ["Bean","Biscuit"]."
function gave(response) {
  return ` It gave back ${JSON.stringify(names(response.body))}.`;
}

// Checks an answer's status code, and that it is JSON.
function assertJson(response, status, what) {
  assert.equal(response.status, status,
    `${what} should answer ${status}, but it answered ${response.status} with ${JSON.stringify(response.body)}.`);
  assert.match(response.headers["content-type"] ?? "(none)", /application\/json/, `${what} should answer with JSON.`);
}

// Checks an error answer: its status code and the API's error shape.
function assertProblem(response, status, title, detail, what) {
  assertJson(response, status, what);
  assert.deepEqual(response.body, { status, title, detail }, `${what} should answer with the API's error shape.`);
}

// The index the list query used, by name, from MongoDB's explain() of that query. (Some MongoDB versions wrap the
// plan in queryPlan.)
function indexUsed(plan) {
  if (plan.queryPlan !== undefined) {
    return indexUsed(plan.queryPlan);
  }
  if (plan.stage === "IXSCAN") {
    return plan.indexName;
  }
  const next = plan.inputStage ?? plan.inputStages?.[0];
  return next === undefined ? "none (a COLLSCAN, which reads every pet)" : indexUsed(next);
}

test("1) isPetId(\"6740c0000000000000000002\") gives true, and isPetId(\"2\") gives false", () => {
  assert.equal(isPetId("6740c0000000000000000002"), true,
    "isPetId should give back true for 24 characters of 0-9 and a-f, an ObjectId written as text.");
  assert.equal(isPetId("2"), false, "isPetId should give back false for \"2\": it can't be an ObjectId.");
});

test("2) listPets({ species: \"cat\", goodWithKids: true, page: 1 }) gives Juniper, Olive and Pickles", async () => {
  const pets = await listPets({ species: "cat", goodWithKids: true, page: 1 });
  assert.deepEqual(names(pets), ["Juniper", "Olive", "Pickles"],
    `listPets should give back the cats whose traits include "good with kids", in name order. It gave back ${JSON.stringify(names(pets))}.`);
});

test("3) listPets gives listings: Bean is { id, name, species, age, status }, with his id as text", async () => {
  const pets = await listPets({ species: undefined, goodWithKids: false, page: 1 });
  assert.deepEqual(pets[0],
    { id: "6740c0000000000000000012", name: "Bean", species: "dog", age: 2, status: "available" },
    "The first listing on page 1 should be Bean's, made with toListing: id, name, species, age and status, and no _id or traits.");
});

test("4) GET /pets answers 200 with the first 5 pets in name order, Bean to Juniper", async () => {
  const response = await request(createApp(testDatabase())).get("/pets");
  assertJson(response, 200, "GET /pets");
  assert.deepEqual(names(response.body), ["Bean", "Biscuit", "Clover", "Hazel", "Juniper"],
    "Page 1 should be the first 5 of the 12 pets, sorted by name." + gave(response));
});

test("5) GET /pets?page=3 answers 200 with Rocket and Ziggy, the last 2 pets", async () => {
  const response = await request(createApp(testDatabase())).get("/pets?page=3");
  assertJson(response, 200, "GET /pets?page=3");
  assert.deepEqual(names(response.body), ["Rocket", "Ziggy"],
    "Page 3 should skip the first 10 pets and show what's left." + gave(response));
});

test("6) GET /pets?species=cat answers 200 with the 5 cats, Juniper to Ziggy", async () => {
  const response = await request(createApp(testDatabase())).get("/pets?species=cat");
  assertJson(response, 200, "GET /pets?species=cat");
  assert.deepEqual(names(response.body), ["Juniper", "Mochi", "Olive", "Pickles", "Ziggy"],
    "Only the cats, in name order. Juniper and Pickles are adopted, and still cats." + gave(response));
});

test("7) GET /pets?species=dog&goodWithKids=true answers 200 with Bean, Biscuit and Maple", async () => {
  const response = await request(createApp(testDatabase())).get("/pets?species=dog&goodWithKids=true");
  assertJson(response, 200, "GET /pets?species=dog&goodWithKids=true");
  assert.deepEqual(names(response.body), ["Bean", "Biscuit", "Maple"],
    "Only the dogs whose traits include \"good with kids\", in name order." + gave(response));
});

test("8) GET /pets?species=dog&page=2 answers 200 with an empty list: the 5 dogs fit on page 1", async () => {
  const response = await request(createApp(testDatabase())).get("/pets?species=dog&page=2");
  assertJson(response, 200, "GET /pets?species=dog&page=2");
  assert.deepEqual(names(response.body), [], "There are 5 dogs, so page 2 of the dogs is empty." + gave(response));
});

test("9) GET /pets/6740c0000000000000000002 answers 200 with Mochi, whole", async () => {
  const response = await request(createApp(testDatabase())).get("/pets/6740c0000000000000000002");
  assertJson(response, 200, "GET /pets/6740c0000000000000000002");
  assert.deepEqual(response.body, mochi,
    `getPet should give back Mochi made with toPet, with her id as text. It gave back ${JSON.stringify(response.body)}.`);
});

test("10) GET /pets/6740c0000000000000000099 answers 404 with \"There's no pet 6740c0000000000000000099.\"", async () => {
  const response = await request(createApp(testDatabase())).get(`/pets/${missingId}`);
  assertProblem(response, 404, "Not Found", `There's no pet ${missingId}.`, `GET /pets/${missingId}`);
});

test("11) GET /pets/2 answers 400 with \"2 isn't a pet id.\"", async () => {
  const response = await request(createApp(testDatabase())).get("/pets/2");
  assertProblem(response, 400, "Bad Request", "2 isn't a pet id.", "GET /pets/2");
});

test("12) POST /pets with Waffles answers 201 with Waffles, a new id and the status \"available\", and saves him", async () => {
  const waffles = { name: "Waffles", species: "dog", age: 4, traits: ["good with kids"] };
  const response = await request(createApp(testDatabase())).post("/pets").send(waffles);
  assertJson(response, 201, "POST /pets");
  const { id, ...fields } = response.body;
  assert.match(String(id), /^[0-9a-f]{24}$/,
    `Waffles's id should be his new _id as text, 24 characters long, but it was ${JSON.stringify(id)}.`);
  assert.deepEqual(fields, { ...waffles, status: "available" },
    "The answer should be Waffles as sent, with the status \"available\".");
  const saved = await storedPets().findOne({ _id: new ObjectId(id) });
  assert.ok(saved !== null, "MongoDB's pets collection should hold Waffles, under the id the answer gave.");
  assert.equal(saved.status, "available", "Waffles should be saved with the status \"available\".");
  assert.equal(await storedPets().countDocuments(), 13, "The collection should hold 13 pets now.");
});

test("13) PATCH /pets/6740c0000000000000000006 with { status: \"adopted\" } answers 200 with Rocket adopted, and saves it", async () => {
  const response = await request(createApp(testDatabase())).patch("/pets/6740c0000000000000000006")
    .send({ status: "adopted" });
  assertJson(response, 200, "PATCH /pets/6740c0000000000000000006");
  assert.deepEqual(response.body, {
    id: "6740c0000000000000000006", name: "Rocket", species: "dog", age: 1, traits: ["playful", "needs a yard"],
    status: "adopted",
  }, "The answer should be Rocket, whole, as he is after the change.");
  const saved = await storedPets().findOne({ _id: new ObjectId("6740c0000000000000000006") });
  assert.equal(saved.status, "adopted", "MongoDB should hold Rocket with the status \"adopted\".");
});

test("14) PATCH /pets/6740c0000000000000000099 answers 404 with \"There's no pet 6740c0000000000000000099.\"", async () => {
  const response = await request(createApp(testDatabase())).patch(`/pets/${missingId}`).send({ status: "adopted" });
  assertProblem(response, 404, "Not Found", `There's no pet ${missingId}.`, `PATCH /pets/${missingId}`);
});

test("15) PATCH /pets/not-a-pet answers 400 with \"not-a-pet isn't a pet id.\"", async () => {
  const response = await request(createApp(testDatabase())).patch("/pets/not-a-pet").send({ status: "adopted" });
  assertProblem(response, 400, "Bad Request", "not-a-pet isn't a pet id.", "PATCH /pets/not-a-pet");
});

test("16) createIndexes() adds the index { species: 1, name: 1 }, and the cats' list query uses it", async () => {
  createApp(testDatabase());
  await createIndexes();
  const keys = (await storedPets().indexes()).map((index) => JSON.stringify(index.key));
  assert.ok(keys.includes(JSON.stringify({ species: 1, name: 1 })),
    `The pets collection should have an index on species, then name: { species: 1, name: 1 }. It has ${keys.join(", ")}.`);
  const explained = await storedPets().find({ species: "cat" }).sort({ name: 1 }).explain();
  assert.equal(indexUsed(explained.queryPlanner.winningPlan), "species_1_name_1",
    "MongoDB should answer the cats' list query, find({ species: \"cat\" }).sort({ name: 1 }), with the index species_1_name_1.");
});

test("17) After createIndexes(), POST /pets with a second Biscuit answers 409 with \"Another pet already has that name.\"", async () => {
  const app = createApp(testDatabase());
  await createIndexes();
  const response = await request(app).post("/pets").send({ name: "Biscuit", species: "dog", age: 5, traits: ["calm"] });
  assertProblem(response, 409, "Conflict", "Another pet already has that name.", "POST /pets with the name Biscuit");
  assert.equal(await storedPets().countDocuments(), 12, "The collection should still hold the 12 pets, and no second Biscuit.");
});

// The routes for /pets. Ready to use: the exercise is in data/pets.js.
//
// app.js sends every address that starts with /pets here, so these paths leave /pets out: "/" is /pets, and "/:id"
// is /pets/6740c0000000000000000002 and so on. Each route reads the request, awaits a function from data/pets.js,
// and answers. The routes never touch MongoDB, ObjectId or a collection: that's the data layer's job.
import express from "express";
import { isPetId, listPets, getPet, addPet, updatePet } from "../data/pets.js";
import { sendProblem } from "../problems.js";

export const petsRouter = express.Router();

// GET /pets, GET /pets?species=cat, GET /pets?goodWithKids=true, GET /pets?page=2, or any mix of them.
// Everything in a query string is text, so "true" is compared as text and Number() turns "2" into 2.
// ?? is read "or else": with no page in the address, it's page 1.
petsRouter.get("/", async (req, res) => {
  const pets = await listPets({
    species: req.query.species,
    goodWithKids: req.query.goodWithKids === "true",
    page: Number(req.query.page ?? 1),
  });
  res.json(pets);
});

// GET /pets/6740c0000000000000000002
// Text that can't be an id, such as "2", is the caller's mistake: 400. An id with no pet: 404.
petsRouter.get("/:id", async (req, res) => {
  if (!isPetId(req.params.id)) {
    sendProblem(res, 400, `${req.params.id} isn't a pet id.`);
    return;
  }
  const pet = await getPet(req.params.id);
  if (pet === null) {
    sendProblem(res, 404, `There's no pet ${req.params.id}.`);
    return;
  }
  res.json(pet);
});

// POST /pets, with a JSON body such as
//   { "name": "Waffles", "species": "dog", "age": 4, "traits": ["good with kids"] }
// A new pet needs at least a name and a species, or the answer is 400.
petsRouter.post("/", async (req, res) => {
  const body = req.body;
  // ! is read "not": !body.name is true when the name is missing or empty.
  if (body === undefined || !body.name || !body.species) {
    sendProblem(res, 400, "A new pet needs a name and a species.");
    return;
  }
  const pet = await addPet({ name: body.name, species: body.species, age: body.age, traits: body.traits });
  res.status(201).json(pet);
});

// PATCH /pets/6740c0000000000000000006, with a JSON body of the fields to change, such as { "status": "adopted" }
petsRouter.patch("/:id", async (req, res) => {
  if (!isPetId(req.params.id)) {
    sendProblem(res, 400, `${req.params.id} isn't a pet id.`);
    return;
  }
  const pet = await updatePet(req.params.id, req.body);
  if (pet === null) {
    sendProblem(res, 404, `There's no pet ${req.params.id}.`);
    return;
  }
  res.json(pet);
});

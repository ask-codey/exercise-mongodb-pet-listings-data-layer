// The data layer: the one file that talks to MongoDB about the Maple Street Pet Adoption Center's pets. For you to
// finish: functions 1 to 6 below.
//
// The routes call these functions and never touch the driver. Every pet they give back is a plain object with its
// _id turned into text, named id, so no ObjectId ever reaches an answer.
import { ObjectId } from "mongodb";

// How many pets one page of the list shows.
const pageSize = 5;

// The pets collection, once useDatabase has run.
let pets;

// app.js calls this once, with the database the app uses: yours from server.js, or a throwaway one in the tests.
// Ready to use.
export function useDatabase(db) {
  pets = db.collection("pets");
}

// A whole pet, as GET /pets/:id, POST /pets and PATCH /pets/:id answer with it. Ready to use.
function toPet(document) {
  return {
    id: document._id.toString(),
    name: document.name,
    species: document.species,
    age: document.age,
    traits: document.traits,
    status: document.status,
  };
}

// A pet in a list: what a listing card shows, and its id. Ready to use.
function toListing(document) {
  return {
    id: document._id.toString(),
    name: document.name,
    species: document.species,
    age: document.age,
    status: document.status,
  };
}

/*
 * 1. Say whether text could be a pet's id: true or false. It doesn't ask the database.
 *
 *    isPetId("6740c0000000000000000002")  -> true
 *    isPetId("2")                         -> false (the warm-up's ids aren't ObjectIds)
 */
export function isPetId(id) {
  // For now it says yes to any text, so every /pets/:id goes on to the functions below.
  return true;
}

/*
 * 2. Give back one page of pets as listings, sorted by name, 5 to a page.
 *
 *    species       a species such as "cat", or undefined for every species
 *    goodWithKids  true for only the pets whose traits include "good with kids", false for every pet
 *    page          the page number: 1 for the first 5 pets, 2 for the next 5, and so on
 *
 *    listPets({ species: undefined, goodWithKids: false, page: 1 })  -> Bean, Biscuit, Clover, Hazel, Juniper
 *    listPets({ species: "cat", goodWithKids: true, page: 1 })       -> Juniper, Olive, Pickles
 *    listPets({ species: undefined, goodWithKids: false, page: 3 })  -> Rocket, Ziggy
 *
 *    Each one is a listing, made with toListing, such as
 *    { id: "6740c0000000000000000012", name: "Bean", species: "dog", age: 2, status: "available" }
 */
export async function listPets({ species, goodWithKids, page }) {
  // For now it stops with an error, so GET /pets answers 500.
  throw new Error("listPets isn't built yet.");
}

/*
 * 3. Give back the whole pet whose id is id, made with toPet, or null when no pet has it.
 *    id is text that isPetId says yes to, such as "6740c0000000000000000002": the routes check it first.
 *
 *    getPet("6740c0000000000000000002")  -> { id: "6740c0000000000000000002", name: "Mochi", species: "cat", age: 2,
 *                                            traits: ["calm", "indoor only"], status: "available" }
 *    getPet("6740c0000000000000000099")  -> null
 */
export async function getPet(id) {
  // For now it stops with an error, so GET /pets/:id answers 500.
  throw new Error("getPet isn't built yet.");
}

/*
 * 4. Save a new pet with the status "available", and give it back as a whole pet, with its new id.
 *
 *    pet is { name, species, age, traits }, from the request's body.
 *
 *    addPet({ name: "Waffles", species: "dog", age: 4, traits: ["good with kids"] })
 *      -> { id: "<its new id, 24 characters>", name: "Waffles", species: "dog", age: 4, traits: ["good with kids"],
 *           status: "available" }
 */
export async function addPet(pet) {
  // For now it stops with an error, so POST /pets answers 500.
  throw new Error("addPet isn't built yet.");
}

/*
 * 5. Change the fields in changes for the pet whose id is id, and give back the changed pet, made with toPet, or null
 *    when no pet has that id. id is text that isPetId says yes to: the routes check it first.
 *
 *    updatePet("6740c0000000000000000006", { status: "adopted" })  -> Rocket, whole, with the status "adopted"
 *    updatePet("6740c0000000000000000099", { status: "adopted" })  -> null
 */
export async function updatePet(id, changes) {
  // For now it stops with an error, so PATCH /pets/:id answers 500.
  throw new Error("updatePet isn't built yet.");
}

/*
 * 6. Create the two indexes the pets collection needs. server.js calls this when it starts.
 *
 *    - { species: 1, name: 1 }, for the list: it finds one species and sorts it by name.
 *    - { name: 1 } with unique: true, so no two pets share a name. A second "Biscuit" then answers 409.
 */
export async function createIndexes() {
  // For now it makes no index, so the list reads every pet and two pets can share a name.
}

// Puts the center's 12 pets into the database mongosh is using, so npm start has pets to show.
// Start mongosh in the exercise folder, type use maple_street, then run: load("test/seed/load-into-mongosh.js")
// It empties the pets collection first, so running it twice is safe.
db.pets.drop();
db.pets.insertMany(EJSON.parse(fs.readFileSync("test/seed/pets.json", "utf8")));
print(`pets: ${db.pets.countDocuments()} documents`);

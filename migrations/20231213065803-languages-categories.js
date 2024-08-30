const eventCategories = require("../migrations/dataDumps/metaEventCategories");
const languages = require("../migrations/dataDumps/metaLanguages");

module.exports = {
  async up(db, client) {
    try {
      console.log("MIGRATING COLLECTIONS LANGUAGES CATEGORIES EVENTCATEGORIES.");
      await db.collection("eventcategories").insertMany(eventCategories);
      await db.collection("languages").insertMany(languages);

      console.log("SUCCESSFULLY MIGRATED LANGUAGES CATEGORIES EVENTCATEGORIES.");
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    console.log("Deleteing categories.")
    await db.collection("categories").deleteMany({});
    console.log("Deleteing event categories.")
    await db.collection("eventcategories").deleteMany({});
    console.log("Deleteing languages.")
    await db.collection("languages").deleteMany({});
  }
};

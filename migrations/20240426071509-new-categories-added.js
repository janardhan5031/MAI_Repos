const eventCategories = require("./dataDumps/categoriesAdded");

module.exports = {
  async up(db, client) {
    try {
      console.log("MIGRATING COLLECTIONS ADDED EVENTCATEGORIES.");
      await db.collection("eventcategories").insertMany(eventCategories);
      console.log("SUCCESSFULLY MIGRATED EVENTCATEGORIES.");
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    console.log("Deleteing categories.");
    await Promise.all(
      eventCategories.map(async (category, index) => {
        await db
          .collection("eventcategories")
          .deleteMany({ eventCategory: category.eventCategory });
      })
    );
    console.log("Deleteing event categories.");
  },
};

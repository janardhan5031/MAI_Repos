const eventCategories = require("./dataDumps/categoriesAdded");

module.exports = {
  async up(db, client) {
    try {
      console.log("MIGRATING COLLECTIONS TO DELETING GALLERY AND FAVOURITE.");
      await db.collection("galleries").deleteMany({});
      await db.collection("favorites").deleteMany({});
      console.log("SUCCESSFULLY DELETED GALLERY AND FAVOURITES.");
    } catch (error) {
      console.error("Error during data deleting:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      console.log("MIGRATING COLLECTIONS TO DELETING GALLERY AND FAVOURITE.");
      await db.collection("galleries").deleteMany({});
      await db.collection("favorites").deleteMany({});
      console.log("SUCCESSFULLY DELETED GALLERY AND FAVOURITES.");
    } catch (error) {
      console.error("Error during data deleting:", error);
      throw error;
    }
  },

};

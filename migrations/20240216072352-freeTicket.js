const eventCategories = require("../migrations/dataDumps/metaEventCategories");

module.exports = {
  async up(db, client) {
    try {
      console.log("added is free tickets filed");
      await db.collection("events").updateMany(
        {},
        {
          $set: {
            isFreeEntry: false,
          },
        }
      );
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      console.log("removed is free tickets filed");
      await db.collection("events").updateMany(
        {},
        {
          $unset: {
            isFreeEntry: "",
          },
        }
      );
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },
};

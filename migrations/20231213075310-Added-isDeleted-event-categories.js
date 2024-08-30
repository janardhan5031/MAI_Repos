const eventCategories = require("../migrations/dataDumps/metaEventCategories");

module.exports = {
  async up(db, client) {
   try {
    console.log("MIGRATING COLLECTIONS EVENTCATEGORIES.");
    await db.collection("eventcategories").updateMany({},{$set: {
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }});
   } catch (error) {
    console.error("Error during data insert:", error);
    throw error;
   }
  },

  async down(db, client) {
    console.log("Deleteing event categories.")
    await db.collection("eventcategories").deleteMany({},{$unset: {
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    });
  }
};

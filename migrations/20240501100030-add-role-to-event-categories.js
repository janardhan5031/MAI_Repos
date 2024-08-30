const roleData = require("../migrations/dataDumps/addRoleToEventCategories");

module.exports = {
  async up(db, client) {
    try {
      console.log("MIGRATING COLLECTIONS ADDED ROLE IN EVENTCATEGORIES.");
      const bulkOps = roleData.map((event) => ({
        updateMany: {
          filter: { eventCategory: event.eventCategory },
          update: { $set: { role: event.role } },
        },
      }));

      await db.collection("eventcategories").bulkWrite(bulkOps);

      console.log("SUCCESSFULLY MIGRATED ADDED ROLE IN EVENTCATEGORIES.");
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      console.log("REVERTING MIGRATION ADDED ROLE IN EVENTCATEGORIES.");
      const bulkOps = roleData.map((event) => ({
        updateMany: {
          filter: { eventCategory: event.eventCategory },
          update: { $unset: { role: '' } }
        },
      }));

      await db.collection("eventcategories").bulkWrite(bulkOps);

      console.log("SUCCESSFULLY REVERTED THE MIGRATION ADDED ROLE IN EVENTCATEGORIES.");
    } catch (error) {
      console.error("Error during data revert:", error);
      throw error;
    }
  },
};

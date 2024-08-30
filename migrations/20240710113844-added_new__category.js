const roleData = require("../migrations/dataDumps/addRoleToEventCategories");
const { ObjectId } = require("mongodb");

module.exports = {
  async up(db, client) {
    try {
      console.log("Starting migration: Adding role and venues to event categories...");

      const bulkOps = roleData.map((event) => ({
        updateMany: {
          filter: { eventCategory: event.eventCategory },
          update: { $set: { venues: [new ObjectId("65a9f3891d2a72bcefb4c91f"), new ObjectId("65a9feed1d2a72bcefb4c921")] } },
        },
      }));

      await db.collection("eventcategories").bulkWrite(bulkOps);
      console.log("Successfully updated existing event categories with new venues.");

      await db.collection("eventcategories").insertMany(
        [{
          _id: new ObjectId("668f6f6d3afe92ef389925e3"),
          eventCategory: "Debate",
          isDeleted: false,
          role: "Speaker",
          isNpcEnabled: false,
          venues: [new ObjectId("668f6d5b2dbf71e073ae75c3")],
          updatedAt: new Date(),
          createdAt: new Date(),
        }]
      );
      console.log("Successfully inserted new event category 'Debate' with role 'Speaker'.");

      console.log("Migration completed: Added role and venues to event categories.");
    } catch (error) {
      console.error("Error during migration:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      console.log("Starting migration rollback: Removing role and venues from event categories...");

      const bulkOps = roleData.map((event) => ({
        updateMany: {
          filter: { eventCategory: event.eventCategory },
          update: { $unset: { venues: "" } }
        },
      }));

      await db.collection("eventcategories").bulkWrite(bulkOps);
      console.log("Successfully removed venues from existing event categories.");

      await db.collection("eventcategories").deleteMany({ _id: new ObjectId("668f6f6d3afe92ef389925e3")});
      console.log("Successfully deleted event category 'Debate'.");

      console.log("Migration rollback completed: Removed role and venues from event categories.");
    } catch (error) {
      console.error("Error during migration rollback:", error);
      throw error;
    }
  },
};

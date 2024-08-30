const venue = require("./dataDumps/newVenueSadan");
const { ObjectId } = require("mongodb");
module.exports = {
  async up(db, client) {
    try {
      console.log("Starting migration: Adding new venue 'Sadan Hall'...");

      await db.collection("venues").insertMany(venue);
      console.log("SUCCESSFULLY ADDED NEW VENUE 'SADAN HALL'.");

    } catch (error) {
      console.error("Error during venue insertion:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      console.log("Starting migration rollback: Deleting venue 'Sadan Hall'...");

      await db.collection("venues").deleteMany({  _id: new ObjectId("668f6d5b2dbf71e073ae75c3") });
      console.log("SUCCESSFULLY DELETED NEW VENUE 'SADAN HALL'.");

    } catch (error) {
      console.error("Error during venue deletion:", error);
      throw error;
    }
  },
};

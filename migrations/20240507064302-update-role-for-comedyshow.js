module.exports = {
  async up(db, client) {
    try {
      console.log("MIGRATING & UPDATED ROLE IN EVENTCATEGORIES.");

      await db.collection("eventcategories").updateOne(
        { eventCategory: "Comedy Show" },
        {
          $set: {
            role: "Performer"
          }
        }
      )

      console.log("SUCCESSFULLY MIGRATED UPDATED ROLE IN EVENTCATEGORIES.");
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      console.log("REVERTING MIGRATION ROLE IN EVENTCATEGORIES.");

      await db.collection("eventcategories").updateOne(
        { eventCategory: "Comedy Show" },
        {
          $set: {
            role: "Artist"
          }
        }
      )

      console.log("SUCCESSFULLY REVERTED THE MIGRATION ROLE IN EVENTCATEGORIES.");
    } catch (error) {
      console.error("Error during data revert:", error);
      throw error;
    }
  },
};

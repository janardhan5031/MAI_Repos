module.exports = {
  async up(db, client) {
    try {
      console.log("MIGRATING COLLECTIONS EVENTCATEGORIES.");
      await db.collection("eventcategories").bulkWrite([
        {
          updateMany: {
            filter: {},
            update: { $set: { isNpcEnabled: false } },
          },
        },
        {
          updateMany: {
            filter: {
              eventCategory: {
                $in: ["Exhibition", "Concert", "Music Festival"],
              },
            },
            update: { $set: { isNpcEnabled: true } },
          },
        },
      ]);
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    console.log("Deleteing event categories.");
    await db
      .collection("eventcategories")
      .updateMany({}, { $unset: { isNpcEnabled: true } });
  },
};

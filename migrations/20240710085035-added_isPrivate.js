
module.exports = {
  async up(db, client) {
    try {
      console.log("added is isPrivate field");
      await db.collection("events").updateMany(
        {},
        {
          $set: {
            isPrivate: false,
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
      console.log("removed is isPrivate field");
      await db.collection("events").updateMany(
        {},
        {
          $unset: {
            isPrivate: 1,
          },
        }
      );
    } catch (error) {
      console.error("Error during isPrivate unset:", error);
      throw error;
    }
  },
};

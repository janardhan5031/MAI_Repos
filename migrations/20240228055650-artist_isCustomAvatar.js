module.exports = {
  async up(db, client) {
    try {
      console.log("Adding isCustomAvatar to all artists");

      await db.collection("artists").updateMany(
        { isCustomAvatar: { $exists: false } },
        {
          $set: { isCustomAvatar: false },
        }
      );

      console.log("Successfully added isCustomAvatar to all artists.");
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      console.log("Removing isCustomAvatar to all artists");
      await db.collection("artists").updateMany(
        { isCustomAvatar: false },
        {
          $unset: { isCustomAvatar: false },
        }
      );

      console.log("Successfully Removing isCustomAvatar to all artists.");
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },
};

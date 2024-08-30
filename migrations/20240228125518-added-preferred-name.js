module.exports = {
  async up(db, client) {
    try {
      await db.collection("artists").updateMany({ preferredName: null }, [
        {
          $addFields: {
            preferredName: {
              $replaceAll: {
                input: "$name",
                find: " ",
                replacement: "_",
              },
            },
          },
        },
      ]);
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      await db.collection("artists").updateMany(
        {},
        {
          $set: {
            preferredName: null,
          },
        }
      );
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },
};

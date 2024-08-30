module.exports = {
  async up(db, client) {
    try {
      await db.collection("artists").updateMany({}, [
        {
          $addFields: {
            preferredName: {
              $replaceAll: {
                input: "$preferredName",
                find: "_",
                replacement: " ",
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
      await db.collection("artists").updateMany({}, [
        {
          $addFields: {
            preferredName: {
              $replaceAll: {
                input: "$preferredName",
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
};

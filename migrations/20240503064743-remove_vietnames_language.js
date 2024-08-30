const ObjectId = require("mongodb").ObjectId;

module.exports = {
  async up(db, client) {
    try {
      console.log("Deleting Vientnames languages");
      await db
        .collection("languages")
        .deleteOne({ _id: new ObjectId("65152b4c9687b28522a2ae14") });

      console.log("Deleted Vientnames languages");
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    console.log("Adding Vientnames languages");

    await db.collection("languages").insertOne({
      _id: new ObjectId("65152b4c9687b28522a2ae14"),
      language: "Vietnamese",
    });
    console.log("Added Vientnames languages");
  },
};

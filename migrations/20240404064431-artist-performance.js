const ObjectId = require("mongodb").ObjectId;

module.exports = {
  async up(db, client) {
    try {
      console.log("MIGRATING COLLECTIONS ARTIST PERFORMANCE.");
      let data = await db.collection("ownerships").updateMany(
        { type: "EVENT_ARTIST" },
        [{
          $addFields: {
            isMicEnabled: false,
            isMusicEnabled: { $gt: [{ $size: "$artistTrack" }, 0] },
          },
        }]
      );

      console.log("🚀 ~ up ~ data:", data);
    } catch (error) {
      console.error("Error while upadting artist performance:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      console.log("UNSET ARTIST PERFORMANCE.");
      await db.collection("ownerships").updateMany(
        { type: "EVENT_ARTIST"},
        {
          $unset: {
            isMicEnabled: 1,
            isMusicEnabled: 1,
          },
        }
      );
    } catch (error) {
      console.error("Error while upadting artist performance:", error);
      throw error;
    }
  },
};

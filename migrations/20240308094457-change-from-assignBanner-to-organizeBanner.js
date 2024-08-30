module.exports = {
  async up(db, client) {
    try {
      db.collection("ownerships").updateMany(
        {},
        { $set: { "progress.$[elem]": "ORGANIZEBANNER" } },
        { arrayFilters: [{ elem: "ASSIGNBANNER" }] }
      );
    } catch (error) {
      console.error("Error during updating progress:", error);
    }
  },

  async down(db, client) {
    try {
      db.collection("ownerships").updateMany(
        {},
        { $set: { "progress.$[elem]": "ASSIGNBANNER" } },
        { arrayFilters: [{ elem: "ORGANIZEBANNER" }] }
      );
    } catch (error) {
      console.error("Error during updating progress:", error);
    }
  },
};

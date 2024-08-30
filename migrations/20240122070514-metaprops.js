const venues = require("../migrations/dataDumps/venues");
const metaBanners = require("../migrations/dataDumps/metaBanners");
const metaKiosks = require("../migrations/dataDumps/metaKiosks");
const metaProps = require("./dataDumps/metaProps");

module.exports = {
  async up(db, client) {
    await db.collection('metaprops').deleteMany({});
    await db.collection("metaprops").insertMany(metaProps);
  },

  async down(db, client) {
       console.log("Deleteing Meta Props.")
       await db.collection('metaprops').deleteMany({});
  }
};

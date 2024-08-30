const venues = require("../migrations/dataDumps/venues");
const metaBanners = require("../migrations/dataDumps/metaBanners");
const metaKiosks = require("../migrations/dataDumps/metaKiosks");
const metaProps = require("./dataDumps/metaProps");

module.exports = {
  async up(db, client) {
    try {
      console.log("MIGRATING COLLECTIONS VENUES,METABANNERS,METAKIOSKS");

      await db.collection("venues").insertMany(venues);
      await db.collection("metabanners").insertMany(metaBanners);
      await db.collection("metakiosks").insertMany(metaKiosks);
      await db.collection("metaprops").insertMany(metaProps);

      console.log("SUCCESSFULLY MIGRATED.");
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
   console.log("Deleteing venues.")
   await db.collection('venues').deleteMany({});
   console.log("Deleteing Meta Banners.")
   await db.collection('metabanners').deleteMany({});
   console.log("Deleteing Meta Kiosks.")
   await db.collection('metakiosks').deleteMany({});
   console.log("Deleteing Meta Props.")
   await db.collection('metaprops').deleteMany({});
  }
};

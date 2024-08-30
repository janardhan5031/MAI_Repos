const { ObjectId } = require("mongodb");

module.exports = {
  async up(db, client) {
   try {
    await db.collection("venues").updateOne({_id: new ObjectId("668f6d5b2dbf71e073ae75c3") },{ $set: { venueImage: '/assets/Parliament_Seating_with%2Bnumbering.png'}})
   } catch (error) {
    console.log("🚀 ~ up ~ error:", error);
   }
  },

  async down(db, client) {
    try {
     await db.collection("venues").updateOne({_id: new ObjectId("668f6d5b2dbf71e073ae75c3") },{ $set: { venueImage: '/assets/Parliament_Seating_with+numbering.png'} })
    } catch (error) {
     console.log("🚀 ~ down ~ error:", error);
    }
  }
};

const ObjectId = require("mongodb").ObjectId;

module.exports = {
  async up(db, client) {
    const updateOperations = [
      {
        updateOne: {
          filter: { _id: ObjectId("65a9f3891d2a72bcefb4c91f") },
          update: { $set: { "userCount.max": 200, name: "House of People" } }
        }
      },
      {
        updateOne: {
          filter: { _id: ObjectId("65a9feed1d2a72bcefb4c921") },
          update: { $set: { "userCount.max": 200 } }
        }
      }
    ];
    await db.collection("venues").bulkWrite(updateOperations);
  },

  async down(db, client) {
    await db.collection("venues").updateMany({},{$set : {"userCount.max": 200}},{new : true});
  }
};

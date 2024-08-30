module.exports = {
  async up(db, client) {
    await db.collection("venues").updateMany({},{$set : {"userCount.max": 200}},{new : true});
  },

  async down(db, client) {
    await db.collection("venues").updateMany({},{$set : {"userCount.max": 250}},{new : true});
  }
};

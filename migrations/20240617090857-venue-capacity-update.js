module.exports = {
  async up(db, client) {

    console.log("Updating venue capacity count to 10,000: Started");

    let count = await db.collection('venues').updateMany(
      {},
      { $set: { 'userCount.max': 10000 } }
    );

    console.log(`Updating venue capacity count to 10,000 Completed : Matched ${count.matchedCount} documents, Modified ${count.modifiedCount} documents`);
  },

  async down(db, client) {

    console.log("Updating venue capacity count to 200: Started");

    let count = await db.collection('venues').updateMany(
      {},
      { $set: { 'userCount.max': 200 } }
    );

    console.log(`Updating venue capacity count to 200 Completed : Matched ${count.matchedCount} documents, Modified ${count.modifiedCount} documents`);
  }
};

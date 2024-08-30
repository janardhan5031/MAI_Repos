module.exports = {
  async up(db, client) {
    console.log("Deleting categories.");
    await db.collection("categories").deleteMany({});
    const collectionExists = await db
      .listCollections({ name: "categories" })
      .hasNext();
    if (collectionExists) {
      await db.collection("categories").drop();
    }
  },

  async down(db, client) {
    console.log("Deleting categories.");
    await db.collection("categories").deleteMany({});
    const collectionExists = await db
      .listCollections({ name: "categories" })
      .hasNext();
    if (collectionExists) {
      await db.collection("categories").drop();
    }
  },
};

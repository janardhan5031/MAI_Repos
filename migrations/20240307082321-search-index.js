module.exports = {
  async up(db, client) {
    await db.collection("artists").updateSearchIndex("searchByArtistName", {
      mappings: {
        dynamic: false,
        fields: {
          preferredName: {
            maxGrams: 32,
            minGrams: 1,
            type: "autocomplete",
          },
        },
      },
    });
    console.log("Index updated to preferredName");
  },

  async down(db, client) {
    await db.collection("artists").updateSearchIndex("searchByArtistName", {
      mappings: {
        dynamic: false,
        fields: {
          name: {
            maxGrams: 32,
            minGrams: 1,
            type: "autocomplete",
          },
        },
      },
    });
    console.log("Index updated to name");
  },
};

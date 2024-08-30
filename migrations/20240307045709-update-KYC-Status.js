module.exports = {
  async up(db, client) {
    try {
      await db.collection("artists").updateMany({}, [
        {
          $addFields: {
            kycStatus: {
              $cond: {
                if: { $eq: ["$isKYCVerified", true] },
                then: "VERIFIED",
                else: "PENDING",
              },
            },
          },
        },
      ]);
      await db.collection("advertisers").updateMany({}, [
        {
          $addFields: {
            kycStatus: {
              $cond: {
                if: { $eq: ["$isKYCVerified", true] },
                then: "VERIFIED",
                else: "PENDING",
              },
            },
          },
        },
      ]);

      await db.collection("organizers").updateMany({}, [
        {
          $addFields: {
            kycStatus: {
              $cond: {
                if: { $eq: ["$isKYCVerified", true] },
                then: "VERIFIED",
                else: "PENDING",
              },
            },
          },
        },
      ]);

      await db.collection("vendors").updateMany({}, [
        {
          $addFields: {
            kycStatus: {
              $cond: {
                if: { $eq: ["$isKYCVerified", true] },
                then: "VERIFIED",
                else: "PENDING",
              },
            },
          },
        },
      ]);
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },

  async down(db, client) {
    try {
      await db
        .collection("artists")
        .updateMany({}, { $unset: { kycStatus: "" } });
      await db
        .collection("advertisers")
        .updateMany({}, { $unset: { kycStatus: "" } });
      await db
        .collection("organizers")
        .updateMany({}, { $unset: { kycStatus: "" } });
      await db
        .collection("vendors")
        .updateMany({}, { $unset: { kycStatus: "" } });
    } catch (error) {
      console.error("Error during data insert:", error);
      throw error;
    }
  },
};

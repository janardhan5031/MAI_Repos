module.exports = {
  async up(db, client) {
    try {
      console.log(
        "Creating mongo indexes for events and ownerships for faster query response."
      );
      db.collection("events").createIndex({
        organizer: 1,
        isDeleted: 1,
        status: 1,
        eventStatus: 1,
      });
      db.collection("ownerships").createIndex({ event: 1, type: 1, isDeleted: 1 });
      console.log(
        "Indexes created successfully for ownerships and events collections."
      );
    } catch (error) {
      console.log(
        "Failed creating indexes for ownerships and events collections.",error
      );
    }
  },

  async down(db, client) {
    try {
      console.log("Droping Indexes for ownerships and events collections.");
      // Drop the specific index from the `ownerships` collection
      db.collection("ownerships").dropIndex("event_1_type_1_isDeleted_1");
      
      // Drop the specific index from the `events` collection
      db.collection("events").dropIndex("organizer_1_isDeleted_1_status_1_eventStatus_1");
      console.log("Successfully droped indexes for ownerships and events collections.");
    } catch (error) {
      console.log(
        "Failed creating indexes for ownerships and events collections."
      );
    }
  },
};

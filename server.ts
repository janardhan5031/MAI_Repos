import "dotenv/config";
import express from "express";
import app from "./config/app";

const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
// Add your routes and middleware here

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

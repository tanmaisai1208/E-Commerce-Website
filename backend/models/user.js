const mongoose = require("mongoose");

// Define the User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures no duplicate emails
  },
  password: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
});

// Create the User model
const User = mongoose.model("User", userSchema);
module.exports = User;

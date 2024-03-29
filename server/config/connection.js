// Connection.js
// Connect to the MongoDB database

const path = require("path");
const dotenv = require("dotenv").config({
    path: path.resolve(__dirname, "../../.env"),
  });

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/juggler-db');

module.exports = mongoose.connection;

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const config = require("../config/config");
const apiRoutes = require("./routes/api");
const rateLimiter = require("./middlewares/rateLimiter");
const { checkCache } = require("./middlewares/cacheMiddleware");
const path = require("path");

// Create Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies (from forms)
app.use(express.urlencoded({ extended: true }));

// Rate limiter middleware
app.use(rateLimiter);

// MongoDB connection
mongoose.connect(config.dbConnectionString);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// API routes
app.use("/", apiRoutes);

// Start the server
const port = config.port;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const express = require("express");
const mongoose = require("mongoose");
const NodeCache = require("node-cache");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies (from forms)
app.use(express.urlencoded({ extended: true }));

// Apply security headers using Helmet
app.use(helmet());

app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64"); // Generate nonce
  res.locals.nonce = nonce; // Make it available in the response
  res.setHeader(
    "Content-Security-Policy",
    `script-src 'self' https://www.google.com 'nonce-${nonce}'`
  );
  next();
});

// Initialize node-cache with 24-hour TTL (86400 seconds)
const cache = new NodeCache({ stdTTL: 86400 });

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Specify the views directory

// Rate limiter middleware (limits requests to avoid DoS attacks)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 20 requests per windowMs
  keyGenerator: (req) => {
    // Use both IP address and user-agent to make the key harder to bypass
    return `${req.ip}-${req.get("User-Agent")}`;
  },
  message: "Too many requests, please try again later.",
});

app.use(limiter);
// MongoDB connection
mongoose.connect(process.env.DB_CONNECTION_STRING);

// URL Schema Definition
const UrlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  redirectURL: { type: String, required: true },
  offerId: { type: String, required: true },
  domain: { type: String, required: true },
  linkType: { type: String, required: true },
  campaignId: { type: String, required: true },
  visitHistory: [
    {
      timestamp: { type: Number },
      ipAddress: { type: String },
      userAgent: { type: String },
    },
  ],
  clickCount: { type: Number, default: 0 },
});

// Create Mongoose models
const Url = mongoose.model("Url", UrlSchema);

// Middleware to check cache for the URL pattern
const checkCache = (req, res, next) => {
  const shortId = req.params.shortId;

  const cachedUrl = cache.get(shortId);
  //   console.log("🚀 ~ checkCache ~ cachedUrl:", cachedUrl);
  if (cachedUrl) {
    console.log("Cache hit for shortId:", shortId);

    // Store click asynchronously even if cache is hit
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");

    Url.findOneAndUpdate(
      { shortId },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
            ipAddress,
            userAgent,
          },
        },
        $inc: { clickCount: 1 },
      },
      { new: true } // Ensure the document is updated
    ).catch((err) => {
      console.error("Error storing click data on cache hit:", err);
    });

    // Redirect immediately
    return res.redirect(cachedUrl);
  } else {
    console.log("Cache miss for shortId:", shortId);
    next();
  }
};

// Helper function to serve the index.html file
const serveIndexHtml = (res) => {
  const htmlFilePath = path.join(__dirname, "public", "index.html");
  fs.readFile(htmlFilePath, "utf8", (err, htmlContent) => {
    if (err) {
      return res.status(500).send("Error loading homepage");
    }
    res.send(htmlContent);
  });
};

// Route to handle redirection and click tracking
app.get("/:shortId/*/*", checkCache, async (req, res) => {
  const shortId = req.params.shortId;
  const ipAddress = req.ip;
  const userAgent = req.get("User-Agent");

  try {
    // Fetch only the redirectURL field from MongoDB and update the visit history and click count
    const urlEntry = await Url.findOneAndUpdate(
      { shortId },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
            ipAddress,
            userAgent,
          },
        },
        $inc: { clickCount: 1 },
      },
      {
        new: true, // Return the updated document
        fields: { redirectURL: 1 }, // Fetch only the redirectURL field
      }
    );
    console.log("🚀 ~ app.get ~ urlEntry:", urlEntry);

    if (urlEntry?.redirectURL) {
      // Cache the redirect URL for 24 hours
      cache.set(shortId, urlEntry.redirectURL);

      // Redirect the user to the target URL
      return res.redirect(urlEntry.redirectURL);
    } else {
      // If the short URL is not found, serve index.html
      console.log("Short ID not found, serving index.html");
      serveIndexHtml(res);
    }
  } catch (err) {
    console.error("Error fetching URL:", err);
    return res.status(500).send("Server error");
  }
});

// Serve the home page
app.get("/", (req, res) => {
  console.log("Serving home page");
  // serveIndexHtml(res);
  res.render("index");
});

const serveHtmlFile = (filePath, res) => {
  fs.readFile(filePath, "utf8", (err, htmlContent) => {
    if (err) {
      return res.status(500).send("Error loading page");
    }
    res.send(htmlContent);
  });
};

// Serve unsubscribe page (unsubscribe.ejs)
app.get("/unsubscribe", (req, res) => {
  res.render("unsubscribe"); // Render the EJS template
});

// Rate limiter middleware for unsubscribe API route
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many unsubscribe requests, please try again later.",
});

// Helper function to verify Google reCAPTCHA
const verifyRecaptcha = async (recaptchaToken) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Set this in your .env file
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify`,
    null,
    {
      params: {
        secret: secretKey,
        response: recaptchaToken,
      },
    }
  );
  return response.data.success;
};

// Route to handle API calls for unsubscribe
app.post("/api/unsubscribe", apiLimiter, async (req, res) => {
  const { email, honeypot, "g-recaptcha-response": recaptchaToken } = req.body;
  console.log("🚀 ~ app.post ~ email:", email);

  // Check honeypot field (should be empty)
  if (honeypot) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // Verify Google reCAPTCHA token
  try {
    // const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    const isRecaptchaValid = true;
    if (!isRecaptchaValid) {
      return res.status(400).json({ message: "reCAPTCHA verification failed" });
    }
  } catch (err) {
    console.error("Error verifying reCAPTCHA:", err);
    return res.status(500).json({ message: "Server error" });
  }

  // Remove the email from the database
  try {
    // const result = await Url.findOneAndDelete({ email: email });

    if (true) {
      return res.json({ message: "You have been unsubscribed successfully." });
    } else {
      return res.status(404).json({ message: "Email not found." });
    }
  } catch (err) {
    console.error("Error removing email:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Catch-all route to serve index.html for any undefined routes
app.get("*", (req, res) => {
  console.log("Serving index.html for undefined route");
  // serveIndexHtml(res);
  res.render("index");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

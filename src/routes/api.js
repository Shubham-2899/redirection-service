const express = require("express");
const urlController = require("../controllers/urlController");
const { checkCache } = require("../middlewares/cacheMiddleware");
const apiLimiter = require("../middlewares/rateLimiter");
const {
  securityMiddleware,
  helmetMiddleware,
} = require("../middlewares/security");
const { verifyRecaptcha } = require("../services/recaptchaService");
const Email_list = require("../models/Email_list");
const contentRoute = require("./contentRoute");

const router = express.Router();

// Security middleware
router.use(helmetMiddleware); // Apply security middleware
router.use(securityMiddleware); // Apply CSP security middleware

// Route for redirecting short URLs
router.get("/:shortId/*/*", checkCache, urlController.redirectUrl); // Use cache middleware

// Route for displaying unsubscribe page
router.get("/unsubscribe", (req, res) => {
  console.log("inside unsubscribe route");
  res.render("unsubscribe"); // Render unsubscribe page
});

// Route for displaying tracking pixel page
router.use("/content", contentRoute);

// Route for displaying main page
router.get("/", (req, res) => {
  res.render("index"); // Render the main page
});

// Route for displaying main page for any undefined routes
router.get("*", (req, res) => {
  res.render("index"); // Render the main page
});

const emailRegex =
  /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)?(yahoo\.com|gmail\.com|comcast\.com|aol\.com)$/;

// API route for unsubscribe
router.post("/api/unsubscribe", apiLimiter, async (req, res) => {
  const { email, honeypot, "g-recaptcha-response": recaptchaToken } = req.body;
  console.log("🚀 ~ app.post ~ email:", email);

  // Validate email format before making any database calls
  if (!email || !emailRegex.test(email)) {
    return res
      .status(400)
      .json({ message: "Bad Request! Please check your input" });
  }

  // Check honeypot field (should be empty)
  if (honeypot) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // Verify Google reCAPTCHA token
  try {
    // const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    const isRecaptchaValid = true;
    console.log("🚀 ~ router.post ~ isRecaptchaValid:", isRecaptchaValid);
    if (!isRecaptchaValid) {
      return res.status(400).json({ message: "reCAPTCHA verification failed" });
    }
  } catch (err) {
    console.error("Error verifying reCAPTCHA:", err);
    return res
      .status(500)
      .json({ message: "Server error. Please try again after sometime!" });
  }

  // Remove the email from the database
  try {
    await Email_list.findOneAndUpdate(
      { email },
      { $setOnInsert: { email } }, // Only insert if email is not found
      { upsert: true, new: true }
    );
    return res.json({ message: "You have been unsubscribed successfully." });
  } catch (err) {
    console.error("Error removing email:", err);
    return res
      .status(500)
      .json({ message: "Server error. Please try again after sometime!" });
  }
});

module.exports = router;

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.RATE_LIMIT || 15,
  keyGenerator: (req) => `${req.ip}-${req.get("User-Agent")}`,
  message: "Too many requests, please try again later.",
});

module.exports = limiter;

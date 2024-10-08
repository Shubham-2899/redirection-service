const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.ip}-${req.get("User-Agent")}`,
  message: "Too many requests, please try again later.",
});

module.exports = limiter;

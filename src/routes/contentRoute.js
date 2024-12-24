const express = require("express");
const { serveTrackingPixel } = require("../services/contentService");
const apiLimiter = require("../middlewares/rateLimiter");

const router = express.Router();

/**
 * Email tracking route
 * Handles campaign tracking and serves a transparent pixel
 */
router.get("/content", apiLimiter, async (req, res) => {
  console.log("Inside content route");
  const { encryptedId } = req.query;

  try {
    // Call service to get the tracking pixel
    const pixelBuffer = await serveTrackingPixel(encryptedId);

    // Respond with the transparent pixel
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": pixelBuffer.length,
    });
    console.log("here");
    res.end(pixelBuffer);
  } catch (err) {
    console.error("Error serving tracking pixel:", err.message);

    // Always return the transparent pixel (even for errors)
    const fallbackPixel = Buffer.from(
      "R0lGODlhAQABAAAAACwAAAAAAQABAAA=",
      "base64"
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": fallbackPixel.length,
    });
    res.end(fallbackPixel);
  }
});

module.exports = router;

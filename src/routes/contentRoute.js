const express = require("express");
const {
  servePixel,
  updateTrackingData,
} = require("../services/contentService");
const apiLimiter = require("../middlewares/rateLimiter");
const querystring = require("querystring");
const { decryptQueryParameter } = require("../utils/crypto");

const router = express.Router();

/**
 * Email tracking route
 * Handles campaign tracking and serves a transparent pixel
 */
router.get("/:data", apiLimiter, async (req, res) => {
  console.log("Inside content route");
  const { data } = req.params;

  try {
    const decryptedData = decryptQueryParameter(data);
    console.log("🚀 ~ router.get ~ decryptedData:", decryptedData);
    // Parse the decrypted data into an object
    const { campaignId, offerId } = querystring.parse(decryptedData);
    console.log(`🚀 ~ { campaignId, offerId }:`, { campaignId, offerId })

    // Log and send response
    console.log("Campaign ID:", campaignId);
    console.log("Offer ID:", offerId);

    // Serve the transparent pixel
    servePixel(res);

    // Get the IP address of the request
    const ip = req.ip;
    const ips = req.ips;
    console.log("🚀 ~ router.get ~ ips:", ips);

    // If valid data is found, update the database asynchronously
    if (campaignId && offerId) {
      updateTrackingData(campaignId, offerId, ip);
    } else {
      console.warn("Invalid Request: Missing campaignId or offerId", {
        campaignId,
        offerId,
      });
    }
  } catch (err) {
    console.error("Error serving tracking pixel:", err.message);
    servePixel(res);
  }
});

module.exports = router;

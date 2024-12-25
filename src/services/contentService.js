const { cache } = require("../middlewares/cacheMiddleware");
const Url = require("../models/Url");

/**
 * Serves the transparent pixel to the client.
 * @param {Object} res - Express response object
 */
function servePixel(res) {
  const pixelBuffer = Buffer.from("R0lGODlhAQABAAAAACwAAAAAAQABAAA=", "base64");

  res.writeHead(200, {
    "Content-Type": "image/gif",
    "Content-Length": pixelBuffer.length,
  });
  res.end(pixelBuffer);
}

/**
 * Validates and updates the open rate in the database asynchronously.
 * @param {string} campaignId - Campaign ID from the request
 * @param {string} offerId - Offer ID from the request
 * @param {string} ipAddress - IP address of the request
 */
async function updateTrackingData(campaignId, offerId, ipAddress) {
  try {
    const key = `${campaignId}:${offerId}:${ipAddress}`;

    console.log("🚀 ~ updateTrackingData ~ key:", key);
    // Check if this IP has already opened the email (using a unique key for campaignId, offerId, and IP)
    const hasOpened = cache.get(key);
    console.log("🚀 ~ updateTrackingData ~ hasOpened:", hasOpened);

    if (!hasOpened) {
      const urlRecord = await Url.findOne({ campaignId, offerId });

      if (urlRecord) {
        console.log("Valid campaign and offer found. Updating DB...");

        // Increment the open rate
        await Url.updateOne({ _id: urlRecord._id }, { $inc: { openRate: 1 } });

        console.log("Open rate updated.");
        cache.set(key, "opened");
      } else {
        console.warn("Invalid campaignId or offerId. No update performed.");
      }
    } else {
      console.log("This IP has already opened the email. No update performed.");
    }
  } catch (error) {
    console.error("Error updating DB:", error.message);
  }
}

module.exports = {
  servePixel,
  updateTrackingData,
};

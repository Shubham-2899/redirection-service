const crypto = require("crypto");
// const redisClient = require("../config/redisClient");

// Encryption/Decryption Configuration
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key_32_chars";
const IV_LENGTH = 16;

/**
 * Encrypt the campaign ID
 * @param {string} campaignId - Campaign ID to encrypt
 * @returns {string} - Encrypted campaign ID
 */
const encryptCampaignId = (campaignId) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(campaignId);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

/**
 * Decrypt the campaign ID
 * @param {string} encryptedId - Encrypted campaign ID
 * @returns {string} - Decrypted campaign ID
 */
const decryptCampaignId = (encryptedId) => {
  try {
    const [iv, encrypted] = encryptedId.split(":");
    if (!iv || !encrypted) {
      throw new Error("Invalid format");
    }
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(SECRET_KEY),
      Buffer.from(iv, "hex")
    );
    let decrypted = decipher.update(Buffer.from(encrypted, "hex"));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption failed:", err.message);
    throw new Error("Invalid encrypted ID");
  }
};

/**
 * Serve a transparent pixel for email tracking
 * @param {string} encryptedId - Encrypted campaign ID from the query
 * @returns {Promise<Buffer>} - Returns the pixel buffer
 */
const serveTrackingPixel = async (encryptedId) => {
  // Default transparent pixel
  const pixelBuffer = Buffer.from("R0lGODlhAQABAAAAACwAAAAAAQABAAA=", "base64");

  try {
    // if (!encryptedId) {
    //   throw new Error("Missing encrypted ID");
    // }

    // Decrypt the campaign ID
    // const campaignId = decryptCampaignId(encryptedId);

    // const cacheKey = `campaign:${campaignId}:open-rate`;

    // Increment open rate using Redis
    // const openRate = await redisClient.incr(cacheKey);
    // console.log(`Campaign ${campaignId} open rate incremented to: ${openRate}`);

    // Set a cache expiration (optional, to prevent stale data)
    // await redisClient.expire(cacheKey, 30 * 24 * 60 * 60); // 30 days

    return pixelBuffer;
  } catch (err) {
    console.error("Error processing tracking pixel request:", err.message);
    // Return the transparent pixel buffer even if there's an error
    return pixelBuffer;
  }
};

module.exports = {
  serveTrackingPixel,
  encryptCampaignId,
  decryptCampaignId,
};

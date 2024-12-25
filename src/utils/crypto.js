const crypto = require("crypto");

// Encryption/Decryption Configuration
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = process.env.SECRET_KEY || "Qyr60bQTzEUaLnpGtGDdVwgJp9VkWAYc";
const FIXED_IV = Buffer.from("00000000000000000000000000000000", "hex");

/**
 * Decrypts data passed as a query parameter using AES-256-CBC and a fixed IV.
 * @param {string} encryptedData - The encrypted data from the query parameter (URL-decoded).
 * @returns {string} - The decrypted plaintext data.
 */
function decryptQueryParameter(encryptedData) {
  try {
    // URL decode the encrypted data
    const decodedData = decodeURIComponent(encryptedData);

    if (!decodedData) {
      throw new Error("Invalid encrypted data format.");
    }

    // Create decipher with fixed IV
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(SECRET_KEY),
      FIXED_IV
    );

    // Decrypt data
    let decrypted = decipher.update(decodedData, "base64", "utf-8");
    decrypted += decipher.final("utf-8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error.message);
    throw new Error("Failed to decrypt query parameter.");
  }
}

module.exports = {
  decryptQueryParameter,
};

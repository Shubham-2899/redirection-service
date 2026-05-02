const crypto = require("crypto");

// Encryption/Decryption Configuration
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = process.env.SECRET_KEY || "Qyr60bQTzEUaLnpGtGDdVwgJp9VkWAYc";
const FIXED_IV = Buffer.from("00000000000000000000000000000000", "hex");

/**
 * Decrypts data passed as a URL path parameter using AES-256-CBC and a fixed IV.
 * Supports both standard base64 and base64url encoding (base64url uses - and _ instead of + and /).
 * base64url is preferred for URLs as it avoids %2F slash encoding issues with nginx proxies.
 * @param {string} encryptedData - The encrypted data from the URL path (already URL-decoded by Express).
 * @returns {string} - The decrypted plaintext data.
 */
function decryptQueryParameter(encryptedData) {
  try {
    if (!encryptedData) {
      throw new Error("Invalid encrypted data format.");
    }

    // Normalize base64url → standard base64 (handles both formats)
    // base64url uses - and _ instead of + and /, and omits padding =
    let normalizedBase64 = encryptedData
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Restore base64 padding if missing (base64url omits it)
    const paddingNeeded = (4 - (normalizedBase64.length % 4)) % 4;
    normalizedBase64 += '='.repeat(paddingNeeded);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(SECRET_KEY),
      FIXED_IV
    );

    let decrypted = decipher.update(normalizedBase64, "base64", "utf-8");
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

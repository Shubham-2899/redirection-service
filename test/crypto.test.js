const { test, describe } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");

// Set SECRET_KEY for testing environment
process.env.SECRET_KEY = process.env.SECRET_KEY || "Qyr60bQTzEUaLnpGtGDdVwgJp9VkWAYc";

const { decryptQueryParameter } = require("../src/utils/crypto");

// Helper function to encrypt query parameter (round-trip verification)
function encryptQueryParameter(text, secretKey = process.env.SECRET_KEY) {
  const algorithm = "aes-256-cbc";
  const fixedIv = Buffer.from("00000000000000000000000000000000", "hex");
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), fixedIv);
  let encrypted = cipher.update(text, "utf-8", "base64");
  encrypted += cipher.final("base64");
  
  // Convert standard base64 to base64url (replacing + with - and / with _)
  return encrypted
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // remove trailing padding if any
}

describe("Crypto Utility - AES-256-CBC Decryption Tests", () => {
  test("should successfully decrypt base64url-encoded AES-256-CBC encrypted strings", () => {
    const testCases = [
      "user@example.com",
      "some-long-uuid-1234-5678-90ab",
      "https://example.com/unsubscribe?id=123",
      "simpletext"
    ];

    for (const originalText of testCases) {
      const encrypted = encryptQueryParameter(originalText);
      const decrypted = decryptQueryParameter(encrypted);
      assert.strictEqual(decrypted, originalText, `Failed decryption for: ${originalText}`);
    }
  });

  test("should successfully decrypt standard base64-encoded strings with padding", () => {
    const originalText = "standard-base64-test-string-with-padding-==";
    
    // Encrypt using standard base64
    const algorithm = "aes-256-cbc";
    const fixedIv = Buffer.from("00000000000000000000000000000000", "hex");
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(process.env.SECRET_KEY), fixedIv);
    let encrypted = cipher.update(originalText, "utf-8", "base64");
    encrypted += cipher.final("base64");

    const decrypted = decryptQueryParameter(encrypted);
    assert.strictEqual(decrypted, originalText);
  });

  test("should throw an error for empty or invalid parameter", () => {
    assert.throws(() => {
      decryptQueryParameter("");
    }, /Failed to decrypt query parameter/);

    assert.throws(() => {
      decryptQueryParameter(null);
    }, /Failed to decrypt query parameter/);
  });

  test("should throw an error for corrupted base64 strings", () => {
    assert.throws(() => {
      // String that is not valid base64 data
      decryptQueryParameter("not-a-valid-encrypted-string-with-invalid-chars-!!!");
    }, /Failed to decrypt query parameter/);
  });
});

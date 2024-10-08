const axios = require("axios");
const config = require("../../config/config");

const verifyRecaptcha = async (recaptchaToken) => {
  const secretKey = config.recaptchaSecretKey;

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: secretKey,
          response: recaptchaToken,
        },
      }
    );

    // For reCAPTCHA v3, you can check both success and score
    const { success, score } = response.data;
    console.log("🚀 ~ verifyRecaptcha ~ response.data:", response.data);

    if (success && score > 0.5) {
      return true; // ReCAPTCHA validation successful
    }

    console.error(`reCAPTCHA failed: ${response.data["error-codes"]}`);
    return false; // Failed validation or low score
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error.message);
    return false; // Return false in case of any error
  }
};

module.exports = { verifyRecaptcha };

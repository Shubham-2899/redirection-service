const axios = require("axios");
const config = require("../../config/config");

const verifyRecaptcha = async (recaptchaToken) => {
  const secretKey = config.recaptchaSecretKey;
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
  return response.data.success;
};

module.exports = { verifyRecaptcha };

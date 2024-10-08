const dotenv = require("dotenv");

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  dbConnectionString: process.env.DB_CONNECTION_STRING,
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
};

module.exports = config;

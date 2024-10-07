const dotenv = require("dotenv");

dotenv.config();

console.log("🚀 ~ config.process.env:", process.env);
const config = {
  port: process.env.PORT || 3000,
  dbConnectionString: process.env.DB_CONNECTION_STRING,
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
};
console.log(
  "🚀 ~ config.process.env.DB_CONNECTION_STRING:",
  process.env.DB_CONNECTION_STRING
);

module.exports = config;

const dotenv = require("dotenv");

dotenv.config();

console.log("🚀 ~ config.process.env:", process.env);
const config = {
  port: process.env.PORT || 3000,
  dbConnectionString:
    process.env.DB_CONNECTION_STRING ||
    "mongodb+srv://monkeymedia:eWxzOvyzBenSAiAn@cluster0.ukwe06a.mongodb.net/mms-dev?retryWrites=true&w=majority&appName=Cluster0",
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
};
console.log(
  "🚀 ~ config.process.env.DB_CONNECTION_STRING:",
  process.env.DB_CONNECTION_STRING
);

module.exports = config;

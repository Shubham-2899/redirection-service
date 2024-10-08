const helmet = require("helmet");
const crypto = require("crypto");

const securityMiddleware = (req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  res.setHeader(
    "Content-Security-Policy",
    `script-src 'self' https://www.google.com 'nonce-${nonce}'`
  );
  next();
};

module.exports = {
  helmetMiddleware: helmet(),
  securityMiddleware,
};

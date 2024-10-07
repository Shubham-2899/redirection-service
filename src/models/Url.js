const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  redirectURL: { type: String, required: true },
  offerId: { type: String, required: true },
  domain: { type: String, required: true },
  linkType: { type: String, required: true },
  campaignId: { type: String, required: true },
  visitHistory: [
    {
      timestamp: { type: Number },
      ipAddress: { type: String },
      userAgent: { type: String },
    },
  ],
  clickCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Url", UrlSchema);

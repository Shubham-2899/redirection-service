const mongoose = require("mongoose");

const EmailListSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    unsubscribed_domains: {
      type: [String],
      default: [],
    },
  },
  {
    collection: "email_list",
    timestamps: true,
  }
);

module.exports = mongoose.model("EmailList", EmailListSchema);

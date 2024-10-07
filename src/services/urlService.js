const Url = require("../models/Url");

const findAndUpdateUrl = async (shortId, visitHistory) => {
  return await Url.findOneAndUpdate(
    { shortId },
    {
      $push: { visitHistory },
      $inc: { clickCount: 1 },
    },
    { new: true }
  );
};

module.exports = { findAndUpdateUrl };

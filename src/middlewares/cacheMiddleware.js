const NodeCache = require("node-cache");
const Url = require("../models/Url");
const cache = new NodeCache({ stdTTL: 86400 });

const checkCache = (req, res, next) => {
  const shortId = req.params.shortId;
  const cachedUrl = cache.get(shortId);

  if (cachedUrl) {
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");
    console.log("cache hit for shortId:", shortId);

    // Store click asynchronously even if cache is hit
    Url.findOneAndUpdate(
      { shortId },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
            ipAddress,
            userAgent,
          },
        },
        $inc: { clickCount: 1 },
      },
      { new: true }
    ).catch((err) => {
      console.error("Error storing click data on cache hit:", err);
    });

    return res.redirect(cachedUrl);
  } else {
    next();
  }
};

module.exports = { cache, checkCache };

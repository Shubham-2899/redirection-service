const Url = require("../models/Url");
const { cache } = require("../middlewares/cacheMiddleware");

exports.redirectUrl = async (req, res) => {
  console.log("inside redirectUrl");
  const shortId = req.params.shortId;
  const ipAddress = req.ip;
  const userAgent = req.get("User-Agent");

  try {
    const urlEntry = await Url.findOneAndUpdate(
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
      {
        new: true,
        fields: { redirectURL: 1 },
      }
    );

    console.log("🚀 ~ exports.redirectUrl= ~ urlEntry:", urlEntry);

    if (urlEntry?.redirectURL) {
      cache.set(shortId, urlEntry.redirectURL);
      return res.redirect(urlEntry.redirectURL);
    } else {
      return serveIndexEJS(res);
    }
  } catch (err) {
    console.error("Error fetching URL:", err);
    return res.status(500).send("Server error");
  }
};

const serveIndexEJS = (res) => {
  res.render("index"); // Render the index.ejs template
};

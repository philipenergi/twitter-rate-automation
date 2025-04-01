require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

// Add middleware to parse JSON and set content type
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

const BEARER_TOKEN = process.env.BEARER_TOKEN;
const CEO_USERNAME = process.env.CEO_USERNAME;

app.get("/", async (req, res) => {
  try {
    const userRes = await axios.get(
      `https://api.twitter.com/2/users/by/username/${CEO_USERNAME}`,
      {
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      }
    );

    const userId = userRes.data.data.id;

    const tweetsRes = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
        params: {
          max_results: 5,
          "tweet.fields": "referenced_tweets",
        },
      }
    );

    const tweets = tweetsRes.data.data || [];

    const output = tweets.map((tweet) => {
      const isReply =
        tweet.referenced_tweets &&
        tweet.referenced_tweets[0].type === "replied_to";
      return {
        link: `https://x.com/${CEO_USERNAME}/status/${tweet.id}`,
        message: tweet.text,
        date: new Date().toISOString(),
        type: isReply ? "Reply" : "Tweet",
      };
    });

    res.json(output);
  } catch (error) {
    console.error(
      "❌ Error fetching tweets:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

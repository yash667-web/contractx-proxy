const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "sk-ant-api03-XXXXXXXX"; // apni key yahan

app.post("/ai", async (req, res) => {
  const payload = JSON.stringify({
    model:      "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system:     req.body.system,
    messages:   req.body.messages,
  });

  const options = {
    hostname: "api.anthropic.com",
    path:     "/v1/messages",
    method:   "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Length":    Buffer.byteLength(payload),
    },
  };

  try {
    const result = await new Promise((resolve, reject) => {
      const proxyReq = https.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => (data += chunk));
        proxyRes.on("end", () => resolve({
          status: proxyRes.statusCode,
          body:   JSON.parse(data)
        }));
      });
      proxyReq.on("error", reject);
      proxyReq.write(payload);
      proxyReq.end();
    });
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

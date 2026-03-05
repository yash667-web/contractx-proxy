const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.get("/", (req, res) => {
  res.json({ status: "ContractX Proxy OK" });
});

app.post("/ai", async (req, res) => {
  if (!req.body || !req.body.messages) {
    return res.status(400).json({ error: "Missing messages" });
  }
  if (!API_KEY) {
    return res.status(500).json({ error: "API key not set" });
  }

  const bodyObj = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: req.body.messages,
  };
  if (req.body.system) bodyObj.system = req.body.system;

  const payload = JSON.stringify(bodyObj);

  const options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  try {
    const result = await new Promise((resolve, reject) => {
      const proxyReq = https.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => (data += chunk));
        proxyRes.on("end", () => {
          try { resolve({ status: proxyRes.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: proxyRes.statusCode, body: { raw: data } }); }
        });
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
app.listen(PORT, () => console.log("Proxy running on port " + PORT));

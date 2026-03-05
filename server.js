const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.ANTHROPIC_API_KEY;

// Test route
app.get("/", (req, res) => {
  res.json({ status: "ContractX Proxy Running OK" });
});

app.post("/ai", async (req, res) => {
  console.log("Body received:", JSON.stringify(req.body).slice(0, 300));

  if (!req.body || !req.body.messages || !Array.isArray(req.body.messages)) {
    return res.status(400).json({
      error: "Missing messages array",
      received: req.body
    });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set on server" });
  }

  const bodyObj = {
    model:      req.body.model      || "claude-sonnet-4-20250514",
    max_tokens: req.body.max_tokens || 1000,
    messages:   req.body.messages,
  };
  if (req.body.system) bodyObj.system = req.body.system;

  const payload = JSON.stringify(bodyObj);

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

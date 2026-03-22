const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/ai', async (req, res) => {
  try {
    console.log('Request received:', JSON.stringify(req.body).slice(0, 200));

    const { model, max_tokens, system, messages } = req.body;

    // Validate messages
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is empty' });
    }

    // Ensure first message is user
    const filteredMessages = messages.filter(m => m.content && m.content.trim() !== '');
    const firstUserIdx = filteredMessages.findIndex(m => m.role === 'user');
    if (firstUserIdx === -1) {
      return res.status(400).json({ error: 'No user message found' });
    }
    const validMessages = filteredMessages.slice(firstUserIdx);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5-20251001',
        max_tokens: max_tokens || 1000,
        system: system || '',
        messages: validMessages
      })
    });

    const data = await response.json();
    console.log('Anthropic response status:', response.status);

    if (!response.ok) {
      console.error('Anthropic error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('ContractX Proxy is running!');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

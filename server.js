const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/ai', async (req, res) => {
  try {
    console.log('Request received:', JSON.stringify(req.body).slice(0, 200));

    const { model, max_tokens, system, messages } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages empty' });
    }

    const filteredMessages = messages.filter(m => m.content && m.content.trim() !== '');
    const firstUserIdx = filteredMessages.findIndex(m => m.role === 'user');
    if (firstUserIdx === -1) {
      return res.status(400).json({ error: 'No user message found' });
    }
    const validMessages = filteredMessages.slice(firstUserIdx);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: max_tokens || 1000,
        messages: [
          { role: 'system', content: system || '' },
          ...validMessages
        ]
      })
    });

    const data = await response.json();
    console.log('Groq response status:', response.status);

    if (!response.ok) {
      console.error('Groq error:', data);
      return res.status(response.status).json(data);
    }

    // Anthropic format mein convert karo (app ka code same rahega)
    const result = {
      content: [{
        text: data.choices?.[0]?.message?.content || 'Sorry, kuch problem aayi.'
      }]
    };

    res.json(result);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('ContractX Proxy running with Groq!');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

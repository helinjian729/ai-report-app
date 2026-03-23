require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {
    const { topic } = req.body;

    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: "glm-4",
        messages: [
          { role: "user", content: topic }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      result: response.data.choices[0].message.content
    });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: "AI生成失败",
      detail: error.response?.data || error.message
    });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
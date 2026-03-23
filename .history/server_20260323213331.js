require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// 🔥 核心：生成日报接口
app.post('/api/generate', async (req, res) => {
  const { topic } = req.body;

  if (!topic || topic.length < 2) {
    return res.status(400).json({ error: '请输入有效主题' });
  }

  const prompt = `
你是一个专业行业分析师，请生成一份AI日报：

主题：${topic}

要求：
1. 输出JSON格式
2. 包含：
- title
- summary（3条）
- points（3条）
- trend
- conclusion
`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content;

    res.json({ result });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'AI生成失败' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
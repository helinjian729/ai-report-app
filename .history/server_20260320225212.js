const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMsg = req.body.message;

  try {
    const response = await axios.post(
      "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      {
        model: "glm-4",
        messages: [
          { role: "user", content: userMsg }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply =
      response.data.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.json({
      reply: "AI 出错了，请检查 API Key 或网络"
    });
  }
});

app.listen(3000, () => {
  console.log("服务器已启动：http://localhost:3000");
});
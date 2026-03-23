require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 1. 静态资源 ==========
app.use(express.static(path.join(__dirname, 'public')));

// ========== 2. 中间件 ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== 3. 内存数据库（V1版本） ==========
const reports = []; // 存历史记录
let requestCount = 0; // 简单限流

// ========== 4. Prompt模板 ==========
const templates = {
  pro: (topic) => `
你是一个专业行业分析师，请生成一份结构化日报：

主题：${topic}

要求：
1. 输出JSON格式
2. 包含字段：
{
  "title": "",
  "summary": ["", "", ""],
  "points": ["", "", ""],
  "trend": "",
  "conclusion": ""
}
`,
  simple: (topic) => `
请用小白能听懂的方式解释以下主题，并输出JSON：

主题：${topic}

结构同上
`,
  invest: (topic) => `
你是投资人，请从投资角度分析：

主题：${topic}

结构同上
`
};

// ========== 5. AI生成接口 ==========
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, style = 'pro' } = req.body;

    console.log("📥 请求：", req.body);

    // 参数校验
    if (!topic || topic.trim() === '') {
      return res.status(400).json({
        error: "主题不能为空"
      });
    }

    // 简单限流（每天3次）
    requestCount++;
    if (requestCount > 10) {
      return res.json({
        error: "今日调用次数已用完（测试限制）"
      });
    }

    const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
    if (!ZHIPU_API_KEY) {
      return res.status(500).json({
        error: "未配置API Key"
      });
    }

    // 选择模板
    const prompt = templates[style](topic);

    const response = await axios({
      method: 'post',
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      data: {
        model: "glm-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      },
      timeout: 30000
    });

    let aiContent = response.data.choices[0]?.message?.content;

    // 尝试解析JSON（关键升级）
    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch {
      parsed = { raw: aiContent }; // fallback
    }

    // 保存历史
    const record = {
      id: Date.now(),
      topic,
      style,
      content: parsed,
      time: new Date()
    };

    reports.unshift(record); // 最新在前

    console.log("✅ 生成成功");

    res.json({
      code: 200,
      data: record
    });

  } catch (error) {
    console.error("❌ 错误：", error.message);

    res.status(500).json({
      error: "生成失败",
      message: error.message
    });
  }
});

// ========== 6. 获取历史 ==========
app.get('/api/history', (req, res) => {
  res.json({
    code: 200,
    data: reports
  });
});

// ========== 7. 健康检查 ==========
app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    count: requestCount,
    totalReports: reports.length
  });
});

// ========== 8. 首页 ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== 9. 启动 ==========
app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
});
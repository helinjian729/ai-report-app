require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // 处理文件路径

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 1. 静态资源托管（核心） ==========
// 托管public文件夹下的所有前端文件
app.use(express.static(path.join(__dirname, 'public')));

// ========== 2. 基础中间件 ==========
app.use(cors()); // 解决跨域问题
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析表单数据

// ========== 3. 智普AI生成接口 ==========
app.post('/api/generate', async (req, res) => {
  try {
    // 打印请求参数
    console.log("📥 收到前端请求：", req.body);
    
    // 校验主题参数
    const { topic } = req.body;
    if (!topic || topic.trim() === '') {
      return res.status(400).json({ 
        error: "参数错误", 
        message: "生成主题不能为空，请输入日报主题" 
      });
    }

    // 校验智普API Key
    const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
    if (!ZHIPU_API_KEY) {
      return res.status(500).json({ 
        error: "配置错误", 
        message: "未配置智普AI API Key，请检查.env文件" 
      });
    }

    // 调用智普AI API
    const glmResponse = await axios({
      method: 'post',
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      data: {
        model: "glm-4", // 可选glm-4/glm-3-turbo
        messages: [
          {
            role: "user",
            content: `请根据以下主题生成一篇专业的日报：${topic}\n要求：结构清晰，内容详实，语言正式，字数300-500字`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      timeout: 30000
    });

    // 解析返回结果
    const aiContent = glmResponse.data.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error("智普AI返回内容为空");
    }

    // 返回成功结果
    console.log("✅ AI生成成功");
    res.json({
      code: 200,
      content: aiContent,
      message: "生成成功"
    });

  } catch (error) {
    // 错误日志
    console.error("\n❌ AI生成失败详情：");
    console.error("错误类型：", error.name);
    console.error("错误信息：", error.message);
    
    if (error.response) {
      console.error("响应状态码：", error.response.status);
      console.error("响应数据：", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("请求发送失败（无响应）：可能是网络/代理问题");
    }

    // 返回错误信息
    res.status(500).json({
      error: "AI生成失败",
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : "服务器内部错误，请稍后重试"
    });
  }
});

// ========== 4. 健康检查接口 ==========
app.get('/health', (req, res) => {
  res.json({ status: "ok", port: PORT, message: "服务运行正常" });
});

// ========== 5. 根路径路由（返回前端首页） ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== 6. 启动服务 ==========
app.listen(PORT, () => {
  console.log(`🚀 服务已启动：http://localhost:${PORT}`);
  console.log(`🔍 健康检查：http://localhost:${PORT}/health`);
  console.log(`🌐 前端页面：http://localhost:${PORT}`);
});
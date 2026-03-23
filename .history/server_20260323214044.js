require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors()); // 解决跨域问题
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析表单数据

// 智普AI生成接口（核心）
app.post('/api/generate', async (req, res) => {
  try {
    // 1. 打印请求参数，方便排查前端传参问题
    console.log("📥 收到前端请求：", req.body);
    
    // 2. 校验必要参数
    const { topic } = req.body;
    if (!topic || topic.trim() === '') {
      return res.status(400).json({ 
        error: "参数错误", 
        message: "生成主题不能为空，请输入日报主题" 
      });
    }

    // 3. 校验智普API Key是否配置
    const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
    if (!ZHIPU_API_KEY) {
      return res.status(500).json({ 
        error: "配置错误", 
        message: "未配置智普AI API Key，请检查.env文件" 
      });
    }

    // 4. 调用智普AI API（GLM-4/GLM-3均可）
    const glmResponse = await axios({
      method: 'post',
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', // 智普官方接口
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}` // 智普API Key格式：Bearer + 空格 + Key
      },
      data: {
        model: "glm-4", // 模型版本，可选glm-4/glm-3-turbo
        messages: [
          {
            role: "user",
            content: `请根据以下主题生成一篇专业的日报：${topic}\n要求：结构清晰，内容详实，语言正式，字数300-500字`
          }
        ],
        temperature: 0.7, // 生成随机性
        max_tokens: 1000 // 最大生成字数
      },
      timeout: 30000 // 超时时间30秒
    });

    // 5. 解析智普返回结果
    const aiContent = glmResponse.data.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error("智普AI返回内容为空");
    }

    // 6. 返回成功结果给前端
    console.log("✅ AI生成成功，返回前端");
    res.json({
      code: 200,
      content: aiContent,
      message: "生成成功"
    });

  } catch (error) {
    // 7. 详细错误日志（关键：帮你定位问题）
    console.error("\n❌ AI生成失败详情：");
    console.error("错误类型：", error.name);
    console.error("错误信息：", error.message);
    
    // 智普API返回的具体错误
    if (error.response) {
      console.error("响应状态码：", error.response.status);
      console.error("响应数据：", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("请求发送失败（无响应）：可能是网络/代理问题");
    }

    // 8. 给前端返回友好的错误信息
    res.status(500).json({
      error: "AI生成失败",
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : "服务器内部错误，请稍后重试"
    });
  }
});

// 健康检查接口（可选，用于测试服务是否正常）
app.get('/health', (req, res) => {
  res.json({ status: "ok", port: PORT });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 服务已启动：http://localhost:${PORT}`);
  console.log(`🔍 健康检查：http://localhost:${PORT}/health`);
});
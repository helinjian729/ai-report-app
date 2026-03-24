# 使用官方 Node 20 轻量镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm install --production

# 复制项目代码
COPY . .

# 暴露端口（Railway 会自动映射）
EXPOSE 3000

# 启动命令（和 package.json 里的 start 脚本一致）
CMD ["npm", "start"]
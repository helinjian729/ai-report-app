FROM node:20-alpine

# 安装 sqlite3 编译依赖（Linux 环境需要）
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./

# 重新安装，自动编译 Linux 版本 sqlite3
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm","start"]
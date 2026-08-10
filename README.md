# 足球预测平台 (Football Prediction Platform)

一个全栈足球比赛预测平台，支持用户注册登录、比赛浏览、比分预测、积分排行榜和评论讨论。

## GitHub 仓库

https://github.com/skull5551/football-prediction-platform

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Express 5、Prisma 7、SQLite (libsql driver adapter)、JWT、bcryptjs |
| 前端 | React 19、Vite 8、Tailwind CSS 4、react-router-dom 7、axios |
| 测试 | Jest 30 + supertest (后端)、Vitest 4 + @testing-library/react (前端) |
| 部署 | Docker (多阶段构建)、nginx、docker-compose |

## 功能列表

- **用户认证**：注册、登录、JWT token 鉴权、获取当前用户信息
- **比赛管理**：比赛列表 (按状态/赛事筛选)、比赛详情、创建比赛、结算比分
- **预测系统**：提交/更新预测 (upsert)、查看我的预测、查看比赛所有预测
- **积分排行榜**：按总积分降序排列的用户排行
- **评论讨论**：树形结构评论、回复评论、删除评论 (仅作者)
- **自动算分**：比赛结算时自动计算预测积分 (精确比分 3 分、正确趋势+一比分 2 分、仅正确趋势 1 分)

## 本地开发指南

### 前置条件

- Node.js >= 18
- npm

### 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 初始化数据库

```bash
cd server
npx prisma migrate dev    # 创建表结构
npx prisma db seed         # 填充种子数据
```

### 启动开发服务器

```bash
# 在根目录执行
npm run dev:server    # 启动后端 (http://localhost:3000)
npm run dev:client    # 启动前端 (http://localhost:5173)
```

## Docker 启动

```bash
# 在根目录执行，构建并后台启动所有服务
docker compose up -d --build
```

启动后：
- 前端：http://localhost (nginx 端口 80)
- 后端 API：http://localhost:3000/api

## 数据库挂载说明

`docker-compose.yml` 中通过 volume 挂载持久化数据：

| 挂载路径 | 用途 |
|----------|------|
| `./server/prisma/data:/app/prisma/data` | SQLite 数据库文件 (`dev.db`) 持久化 |
| `./server/uploads:/app/uploads` | 用户上传文件持久化 (预留) |

容器删除重建后，数据库数据不会丢失。

## 测试运行

```bash
# 在根目录执行，依次运行后端和前端全部测试
npm run check
```

测试覆盖：
- **后端 24 个测试**：算分逻辑 (12)、认证集成 (6)、预测接口 (5)、并发结算 (1)
- **前端 2 个测试**：HomePage 组件渲染 (2)

## 课程印象最深的内容

在实现比赛结算功能时，深刻体会到了数据库事务和并发控制的重要性。当多个用户同时对同一场比赛提交预测，或管理员结算比分时遇到并发请求，如果没有事务保护和幂等设计，很容易出现积分重复累加或遗漏的问题。通过 `prisma.$transaction` 保证原子性、`@@unique([userId, matchId])` 防止重复预测、以及幂等公式 `oldPoints - pred.points + newPoints` 的设计，让我真正理解了后端开发中数据一致性的核心挑战。此外，Prisma 7 的 driver adapter 机制和 TypeScript 严格模式下的类型安全也让我受益匪浅。

## 课程改进建议

（留空）

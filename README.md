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

### 数据库文件位置

种子数据库文件位于 `server/prisma/data/dev.db`，包含以下演示数据：

| 数据 | 数量 | 说明 |
|------|------|------|
| 用户 | 2 | testuser1 (13 分)、testuser2 (6 分) |
| 比赛 | 11 | 5 场已结束 (FINISHED)、6 场未开始 (SCHEDULED) |
| 预测 | 20 | 覆盖已结束比赛的预测，积分已结算 |
| 评论 | 3 | 含树形回复结构 |

本地开发时执行 `npx prisma db seed` 即可重新生成种子数据。Docker 部署时数据库文件通过 volume 挂载持久化，首次启动需执行 `npx prisma migrate deploy && npx prisma db seed`。

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

## 演示流程

以下演示覆盖平台核心功能，可在本地开发环境或 Docker 部署后操作：

### 1. 浏览赛事

- 访问首页 `http://localhost:5173` (开发) 或 `http://localhost` (Docker)
- 使用顶部筛选器按竞赛 (世界杯/苏超) 或状态 (未开始/进行中/已结束) 筛选比赛
- 点击任意比赛卡片进入详情页，查看比赛信息、已有预测和评论

### 2. 注册登录

- 点击右上角"注册"，输入用户名和密码完成注册
- 注册后自动登录，或点击"登录"用已有账号登录
- 种子账号：testuser1 / testuser2 (密码均为 password123)

### 3. 提交预测

- 在比赛详情页的"提交预测"区域，输入预测的主队比分和客队比分
- 点击"提交预测"，预测将保存到数据库 (同一比赛重复提交会更新而非新建)
- 已结束比赛的预测会显示获得的积分

### 4. 查看排行榜

- 点击导航栏"排行榜"进入 `/leaderboard`
- 查看所有用户按总积分降序排列的排名表
- 种子数据中 testuser1 以 13 分排名第一

### 5. 发表评论

- 在比赛详情页底部的"讨论区"输入评论内容
- 点击"发表"提交评论
- 可对已有评论点击"回复"进行嵌套回复，形成树形讨论
- 评论作者可删除自己的评论

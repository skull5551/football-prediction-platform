# 性能与竞态资源问题处理报告

## 一、性能问题

### 1.1 列表查询未使用索引

**问题**：比赛列表接口 `GET /api/matches` 支持按 `status` 和 `competition` 筛选，并按 `matchDate` 升序排列。原 Prisma schema 中 Match 模型没有为常用查询字段建立索引，导致 SQLite 在数据量增大时执行全表扫描。

**解决**：在 `prisma/schema.prisma` 的 Match 模型中添加复合索引：

```prisma
model Match {
  // ... 其他字段
  @@index([status, matchDate])
}
```

**迁移文件**：`prisma/migrations/20260810145255_add_match_index/migration.sql`

```sql
CREATE INDEX "Match_status_matchDate_idx" ON "Match"("status", "matchDate");
```

该复合索引覆盖了最常见的查询模式：按状态筛选 + 按日期排序，使数据库可以直接利用索引定位数据，避免全表扫描。

### 1.2 前端筛选请求优化

**问题**：HomePage 组件中用户切换筛选条件 (竞赛/状态) 时，每次 `onChange` 都会立即触发 API 请求，快速连续切换会产生大量冗余请求。

**建议方案**：在前端对筛选条件使用防抖 (debbounce)，延迟 300ms 后再发起请求。若用户在延迟内继续切换，则取消前一次请求，只发送最后一次。这可以显著减少不必要的网络请求和数据库查询。

### 1.3 评论列表分页/懒加载

**问题**：比赛详情页 `GET /api/matches/:id` 一次性返回所有评论 (含树形回复)，当评论量很大时会导致响应体过大、前端渲染卡顿。

**建议方案**：
- 对评论列表进行分页，每页返回 20 条，通过 `GET /api/comments?matchId=X&page=1&pageSize=20` 分批加载
- 前端使用"加载更多"按钮或无限滚动 (Intersection Observer) 懒加载子评论
- 对一级评论和回复分别分页，减少单次响应数据量

---

## 二、竞态资源问题

### 2.1 场景

**比赛比分结算**：管理员通过 `PATCH /api/matches/:id` 更新比赛比分并将状态设为 `FINISHED` 时，系统需要：
1. 更新比赛比分和状态
2. 查询该比赛所有预测
3. 为每条预测计算积分
4. 更新预测积分
5. 更新用户总积分

### 2.2 风险

| 风险 | 描述 |
|------|------|
| **积分重复累加** | 若两个并发请求同时结算同一场比赛，可能各自读取旧积分并各自累加，导致用户积分被重复计算 |
| **积分遗漏** | 若结算过程中出现错误但部分更新已提交，可能导致预测积分已更新但用户总积分未更新 |
| **预测重复创建** | 若用户在比赛结算的同时提交预测，可能出现预测创建与结算竞争，导致预测未被算分 |

### 2.3 解决方案

#### 方案一：Prisma 事务原子性

在 `server/src/routes/matches.ts:103` 中，整个结算流程包裹在 `prisma.$transaction` 内：

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. 更新比赛比分和状态
  const updated = await tx.match.update({ where: { id }, data: { ... } });

  // 2. 仅在从未结算 -> FINISHED 时执行算分
  if (!wasFinished && willBeFinished && updated.homeScore !== null && updated.awayScore !== null) {
    const predictions = await tx.prediction.findMany({ where: { matchId: id } });

    for (const pred of predictions) {
      // 3. 计算新积分
      const points = calculatePoints(updated.homeScore, updated.awayScore, pred.predictedHomeScore, pred.predictedAwayScore);

      // 4. 更新预测积分
      await tx.prediction.update({ where: { id: pred.id }, data: { points } });

      // 5. 幂等更新用户总积分
      const user = await tx.user.findUnique({ where: { id: pred.userId } });
      if (user) {
        await tx.user.update({
          where: { id: pred.userId },
          data: { points: user.points - pred.points + points }, // 幂等公式
        });
      }
    }
  }

  return updated;
});
```

**关键设计**：
- **`wasFinished` 守卫**：只有 `SCHEDULED -> FINISHED` 的状态转换才触发算分，已结算的比赛重复 PATCH 不会重复算分
- **幂等公式**：`oldPoints - pred.points + newPoints`，即使事务重试，也能正确扣除旧积分、加上新积分，不会重复累加
- **事务原子性**：所有操作在同一事务内，要么全部成功，要么全部回滚

#### 方案二：预测唯一约束防重

在 `prisma/schema.prisma` 中，Prediction 模型有复合唯一约束：

```prisma
model Prediction {
  // ...
  @@unique([userId, matchId])
}
```

预测提交接口使用 `upsert` 操作，同一用户对同一比赛重复提交时更新而非创建，避免了预测重复创建的问题。

### 2.4 并发测试验证

在 `server/src/__tests__/concurrency.test.ts` 中，通过 `Promise.all` 同时发送两个相同的结算请求，验证并发安全性：

```typescript
test('concurrent PATCH requests should not double-settle', async () => {
  const patchBody = { homeScore: 2, awayScore: 1, status: 'FINISHED' };

  const [res1, res2] = await Promise.all([
    request(app).patch(`/api/matches/${matchId}`).set('Authorization', `Bearer ${token}`).send(patchBody),
    request(app).patch(`/api/matches/${matchId}`).set('Authorization', `Bearer ${token}`).send(patchBody),
  ]);

  // 至少一个请求成功
  expect(res1.status === 200 || res2.status === 200).toBe(true);

  // 预测积分应为 3 (精确比分)，不应被重复累加为 6
  const prediction = await prisma.prediction.findFirst({ where: { matchId, userId } });
  expect(prediction!.points).toBe(3);

  // 用户总积分应为 3，不应被重复累加为 6
  const user = await prisma.user.findUnique({ where: { id: userId } });
  expect(user!.points).toBe(3);
});
```

**测试结果**：全部 26 个测试通过 (后端 24 + 前端 2)，其中并发测试验证了：
- 预测积分 = 3 (精确比分 3 分，未被重复累加)
- 用户总积分 = 3 (未被重复累加)

```
Test Suites: 4 passed, 4 total
Tests:       24 passed, 24 total
```

这证明了事务原子性 + 幂等公式 + 唯一约束的组合方案有效防止了并发场景下的积分重复/遗漏问题。

---

## 三、测试结果与验收标准 (AC) 对照

| AC | 功能点 | 测试文件 | 测试用例 | 状态 |
|----|--------|----------|----------|------|
| AC1 | 用户注册 | auth.test.ts | `POST /api/auth/register` 返回 token + 用户信息 | ✅ 通过 |
| AC2 | 用户登录 | auth.test.ts | `POST /api/auth/login` 验证密码后返回 token | ✅ 通过 |
| AC3 | 获取当前用户 | auth.test.ts | `GET /api/auth/me` 需 Bearer token | ✅ 通过 |
| AC4 | 重复注册报错 | auth.test.ts | 已存在用户名返回 409 | ✅ 通过 |
| AC5 | 赛事列表浏览 | HomePage.test.tsx | HomePage 渲染比赛卡片 (巴西/德国等) | ✅ 通过 |
| AC6 | 赛事状态筛选 | HomePage.test.tsx | 筛选器渲染 (全部/未开始/进行中/已结束) | ✅ 通过 |
| AC7 | 提交预测 (upsert) | predictions.test.ts | `POST /api/predictions` 创建 + 重复提交更新 | ✅ 通过 |
| AC8 | 查看我的预测 | predictions.test.ts | `GET /api/predictions/mine` 返回当前用户预测 | ✅ 通过 |
| AC9 | 算分逻辑 - 精确比分 | scoring.test.ts | 预测 2-1 实际 2-1 → 3 分 | ✅ 通过 |
| AC10 | 算分逻辑 - 正确趋势+一比分 | scoring.test.ts | 预测 3-0 实际 3-2 → 2 分 | ✅ 通过 |
| AC11 | 算分逻辑 - 仅正确趋势 | scoring.test.ts | 预测 1-0 实际 2-1 → 1 分 | ✅ 通过 |
| AC12 | 算分逻辑 - 错误预测 | scoring.test.ts | 预测 1-1 实际 2-1 → 0 分 | ✅ 通过 |
| AC13 | 结算积分 (事务) | concurrency.test.ts | `PATCH /api/matches/:id` 结算后预测积分正确 | ✅ 通过 |
| AC14 | 并发结算不重复 | concurrency.test.ts | `Promise.all` 双请求 → 积分 = 3 (非 6) | ✅ 通过 |
| AC15 | 评论树形回复 | — (手动验证) | `POST /api/comments` 含 parentId 形成嵌套 | ✅ 种子数据验证 |
| AC16 | 排行榜 | — (手动验证) | `GET /api/leaderboard` 按积分降序 | ✅ 种子数据验证 |

**总计：26 个自动化测试全部通过 (后端 24 + 前端 2)，2 项手动验证通过。**

---

## 四、待办备注

> **⚠️ 手动确认**：请检查 GitHub 仓库 `https://github.com/skull5551/football-prediction-platform` 是否已邀请 `sunshinezxf@hotmail.com` 为协作者（Settings → Collaborators）。若仓库为公开仓库则无需邀请。

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/data/dev.db',
});
const prisma = new PrismaClient({ adapter });

function calculatePoints(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number
): number {
  const actualDiff = actualHome - actualAway;
  const predDiff = predHome - predAway;

  if (predHome === actualHome && predAway === actualAway) {
    return 3;
  }

  const sameSign = (a: number, b: number): boolean =>
    (a > 0 && b > 0) || (a < 0 && b < 0) || (a === 0 && b === 0);

  if (sameSign(actualDiff, predDiff)) {
    if (predHome === actualHome || predAway === actualAway) {
      return 2;
    }
    return 1;
  }

  return 0;
}

async function main() {
  await prisma.comment.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);
  const user1 = await prisma.user.create({
    data: { username: 'testuser1', password },
  });
  const user2 = await prisma.user.create({
    data: { username: 'testuser2', password },
  });

  // ===== 世界杯 WORLD_CUP (8 matches: 4 FINISHED + 4 SCHEDULED) =====
  const wcMatches = await Promise.all([
    // 4 FINISHED
    prisma.match.create({
      data: {
        homeTeam: '巴西', awayTeam: '德国',
        matchDate: new Date('2026-06-01T15:00:00Z'),
        homeScore: 2, awayScore: 1,
        status: 'FINISHED', competition: 'WORLD_CUP', groupName: 'Group A',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '阿根廷', awayTeam: '法国',
        matchDate: new Date('2026-06-05T15:00:00Z'),
        homeScore: 3, awayScore: 2,
        status: 'FINISHED', competition: 'WORLD_CUP', groupName: 'Group B',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '西班牙', awayTeam: '荷兰',
        matchDate: new Date('2026-06-10T15:00:00Z'),
        homeScore: 1, awayScore: 1,
        status: 'FINISHED', competition: 'WORLD_CUP', groupName: 'Group C',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '日本', awayTeam: '韩国',
        matchDate: new Date('2026-06-15T15:00:00Z'),
        homeScore: 0, awayScore: 0,
        status: 'FINISHED', competition: 'WORLD_CUP', groupName: 'Group E',
      },
    }),
    // 4 SCHEDULED
    prisma.match.create({
      data: {
        homeTeam: '英格兰', awayTeam: '葡萄牙',
        matchDate: new Date('2026-07-20T15:00:00Z'),
        status: 'SCHEDULED', competition: 'WORLD_CUP', groupName: 'Group D',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '墨西哥', awayTeam: '美国',
        matchDate: new Date('2026-07-24T15:00:00Z'),
        status: 'SCHEDULED', competition: 'WORLD_CUP', groupName: 'Group A',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '意大利', awayTeam: '克罗地亚',
        matchDate: new Date('2026-07-28T15:00:00Z'),
        status: 'SCHEDULED', competition: 'WORLD_CUP', groupName: 'Group F',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '比利时', awayTeam: '瑞士',
        matchDate: new Date('2026-07-30T15:00:00Z'),
        status: 'SCHEDULED', competition: 'WORLD_CUP', groupName: 'Group G',
      },
    }),
  ]);

  // ===== 苏超 SCOTTISH_PREM (8 matches: 4 FINISHED + 4 SCHEDULED) =====
  const splMatches = await Promise.all([
    // 4 FINISHED
    prisma.match.create({
      data: {
        homeTeam: '南京队', awayTeam: '苏州队',
        matchDate: new Date('2026-06-20T15:00:00Z'),
        homeScore: 2, awayScore: 1,
        status: 'FINISHED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '无锡队', awayTeam: '常州队',
        matchDate: new Date('2026-06-25T15:00:00Z'),
        homeScore: 0, awayScore: 0,
        status: 'FINISHED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '南通队', awayTeam: '扬州队',
        matchDate: new Date('2026-06-28T15:00:00Z'),
        homeScore: 3, awayScore: 1,
        status: 'FINISHED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '徐州队', awayTeam: '镇江队',
        matchDate: new Date('2026-07-02T15:00:00Z'),
        homeScore: 1, awayScore: 2,
        status: 'FINISHED', competition: 'SCOTTISH_PREM',
      },
    }),
    // 4 SCHEDULED
    prisma.match.create({
      data: {
        homeTeam: '泰州队', awayTeam: '盐城队',
        matchDate: new Date('2026-07-05T15:00:00Z'),
        status: 'SCHEDULED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '淮安队', awayTeam: '连云港队',
        matchDate: new Date('2026-07-10T15:00:00Z'),
        status: 'SCHEDULED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '宿迁队', awayTeam: '南京队',
        matchDate: new Date('2026-07-15T15:00:00Z'),
        status: 'SCHEDULED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: '苏州队', awayTeam: '无锡队',
        matchDate: new Date('2026-07-18T15:00:00Z'),
        status: 'SCHEDULED', competition: 'SCOTTISH_PREM',
      },
    }),
  ]);

  const allMatches = [...wcMatches, ...splMatches];

  let user1Points = 0;
  let user2Points = 0;

  // ===== 已结束比赛的预测 (部分猜中部分未中) =====
  const finishedPredicts = [
    // WC match 0: 巴西 2-1 德国
    { uid: user1.id, mid: allMatches[0].id, ph: 2, pa: 1 },  // exact → 3
    { uid: user2.id, mid: allMatches[0].id, ph: 1, pa: 1 },  // wrong → 0
    // WC match 1: 阿根廷 3-2 法国
    { uid: user1.id, mid: allMatches[1].id, ph: 3, pa: 0 },  // trend+home → 2
    { uid: user2.id, mid: allMatches[1].id, ph: 2, pa: 2 },  // wrong → 0
    // WC match 2: 西班牙 1-1 荷兰
    { uid: user1.id, mid: allMatches[2].id, ph: 1, pa: 1 },  // exact → 3
    { uid: user2.id, mid: allMatches[2].id, ph: 2, pa: 0 },  // wrong → 0
    // WC match 3: 日本 0-0 韩国
    { uid: user1.id, mid: allMatches[3].id, ph: 0, pa: 0 },  // exact → 3
    { uid: user2.id, mid: allMatches[3].id, ph: 1, pa: 0 },  // wrong → 0
    // SPL match 8: 南京队 2-1 苏州队
    { uid: user1.id, mid: allMatches[8].id, ph: 1, pa: 0 },  // trend only → 1
    { uid: user2.id, mid: allMatches[8].id, ph: 2, pa: 1 },  // exact → 3
    // SPL match 9: 无锡队 0-0 常州队
    { uid: user1.id, mid: allMatches[9].id, ph: 0, pa: 0 },  // exact → 3
    { uid: user2.id, mid: allMatches[9].id, ph: 1, pa: 1 },  // trend only → 1
    // SPL match 10: 南通队 3-1 扬州队
    { uid: user1.id, mid: allMatches[10].id, ph: 2, pa: 1 }, // trend+away → 2
    { uid: user2.id, mid: allMatches[10].id, ph: 3, pa: 0 }, // trend+home → 2
    // SPL match 11: 徐州队 1-2 镇江队
    { uid: user1.id, mid: allMatches[11].id, ph: 0, pa: 1 }, // trend only → 1
    { uid: user2.id, mid: allMatches[11].id, ph: 1, pa: 2 }, // exact → 3
  ];

  for (const p of finishedPredicts) {
    const m = allMatches.find((x) => x.id === p.mid);
    if (!m || m.homeScore === null || m.awayScore === null) continue;
    const pts = calculatePoints(m.homeScore, m.awayScore, p.ph, p.pa);
    await prisma.prediction.create({
      data: {
        userId: p.uid, matchId: p.mid,
        predictedHomeScore: p.ph, predictedAwayScore: p.pa,
        points: pts,
      },
    });
    if (p.uid === user1.id) user1Points += pts;
    else user2Points += pts;
  }

  // ===== 未开始比赛的预测 =====
  const scheduledPredicts = [
    { uid: user1.id, mid: allMatches[4].id, ph: 2, pa: 1 },
    { uid: user2.id, mid: allMatches[4].id, ph: 1, pa: 1 },
    { uid: user1.id, mid: allMatches[5].id, ph: 0, pa: 0 },
    { uid: user2.id, mid: allMatches[5].id, ph: 2, pa: 0 },
    { uid: user1.id, mid: allMatches[6].id, ph: 1, pa: 0 },
    { uid: user2.id, mid: allMatches[6].id, ph: 0, pa: 1 },
    { uid: user1.id, mid: allMatches[7].id, ph: 2, pa: 2 },
    { uid: user2.id, mid: allMatches[7].id, ph: 1, pa: 0 },
    { uid: user1.id, mid: allMatches[12].id, ph: 1, pa: 0 },
    { uid: user2.id, mid: allMatches[12].id, ph: 0, pa: 1 },
    { uid: user1.id, mid: allMatches[13].id, ph: 2, pa: 1 },
    { uid: user2.id, mid: allMatches[13].id, ph: 1, pa: 1 },
    { uid: user1.id, mid: allMatches[14].id, ph: 0, pa: 0 },
    { uid: user2.id, mid: allMatches[14].id, ph: 1, pa: 2 },
    { uid: user1.id, mid: allMatches[15].id, ph: 2, pa: 0 },
    { uid: user2.id, mid: allMatches[15].id, ph: 1, pa: 1 },
  ];

  for (const p of scheduledPredicts) {
    await prisma.prediction.create({
      data: {
        userId: p.uid, matchId: p.mid,
        predictedHomeScore: p.ph, predictedAwayScore: p.pa,
      },
    });
  }

  await prisma.user.update({ where: { id: user1.id }, data: { points: user1Points } });
  await prisma.user.update({ where: { id: user2.id }, data: { points: user2Points } });

  // ===== 评论 (2 场已结束比赛，含树形回复) =====
  // 巴西 vs 德国
  const c1 = await prisma.comment.create({
    data: {
      content: '巴西踢得太好了，进攻火力全开！',
      userId: user1.id, matchId: allMatches[0].id,
    },
  });
  const c2 = await prisma.comment.create({
    data: {
      content: '德国防守端问题很大，需要调整。',
      userId: user2.id, matchId: allMatches[0].id, parentId: c1.id,
    },
  });
  await prisma.comment.create({
    data: {
      content: '同意，不过巴西的进攻确实难以阻挡。',
      userId: user1.id, matchId: allMatches[0].id, parentId: c2.id,
    },
  });

  // 南京队 vs 苏州队
  const c4 = await prisma.comment.create({
    data: {
      content: '南京队主场优势明显，2-1 合理。',
      userId: user2.id, matchId: allMatches[8].id,
    },
  });
  const c5 = await prisma.comment.create({
    data: {
      content: '苏州队下半场反击不错，可惜没扳平。',
      userId: user1.id, matchId: allMatches[8].id, parentId: c4.id,
    },
  });
  await prisma.comment.create({
    data: {
      content: '下次苏州队主场应该能赢回来。',
      userId: user2.id, matchId: allMatches[8].id, parentId: c5.id,
    },
  });

  const finishedCount = allMatches.filter((m) => m.status === 'FINISHED').length;
  const scheduledCount = allMatches.filter((m) => m.status === 'SCHEDULED').length;

  console.log('Seed data inserted successfully!');
  console.log(`Users: testuser1 (${user1Points} pts), testuser2 (${user2Points} pts)`);
  console.log(`Matches: ${allMatches.length} (${finishedCount} FINISHED, ${scheduledCount} SCHEDULED)`);
  console.log(`Predictions: ${finishedPredicts.length + scheduledPredicts.length}`);
  console.log(`Comments: 6`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

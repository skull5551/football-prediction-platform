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

  const matches = await Promise.all([
    prisma.match.create({
      data: {
        homeTeam: 'Brazil', awayTeam: 'Germany',
        matchDate: new Date('2026-06-01T15:00:00Z'),
        homeScore: 2, awayScore: 1,
        status: 'FINISHED', competition: 'WORLD_CUP', groupName: 'Group A',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Argentina', awayTeam: 'France',
        matchDate: new Date('2026-06-05T15:00:00Z'),
        homeScore: 3, awayScore: 2,
        status: 'FINISHED', competition: 'WORLD_CUP', groupName: 'Group B',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Spain', awayTeam: 'Netherlands',
        matchDate: new Date('2026-06-10T15:00:00Z'),
        homeScore: 1, awayScore: 1,
        status: 'FINISHED', competition: 'WORLD_CUP', groupName: 'Group C',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Japan', awayTeam: 'South Korea',
        matchDate: new Date('2026-06-15T15:00:00Z'),
        homeScore: 0, awayScore: 0,
        status: 'FINISHED', competition: 'WORLD_CUP', groupName: 'Group E',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'England', awayTeam: 'Portugal',
        matchDate: new Date('2026-09-01T15:00:00Z'),
        status: 'SCHEDULED', competition: 'WORLD_CUP', groupName: 'Group D',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Mexico', awayTeam: 'USA',
        matchDate: new Date('2026-09-05T15:00:00Z'),
        status: 'SCHEDULED', competition: 'WORLD_CUP', groupName: 'Group A',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Celtic', awayTeam: 'Rangers',
        matchDate: new Date('2026-07-01T15:00:00Z'),
        homeScore: 2, awayScore: 0,
        status: 'FINISHED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Hibernian', awayTeam: 'Dundee United',
        matchDate: new Date('2026-07-10T15:00:00Z'),
        homeScore: 1, awayScore: 1,
        status: 'FINISHED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Aberdeen', awayTeam: 'Hearts',
        matchDate: new Date('2026-09-10T15:00:00Z'),
        status: 'SCHEDULED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Kilmarnock', awayTeam: 'St Mirren',
        matchDate: new Date('2026-09-15T15:00:00Z'),
        status: 'SCHEDULED', competition: 'SCOTTISH_PREM',
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Motherwell', awayTeam: 'Ross County',
        matchDate: new Date('2026-10-01T15:00:00Z'),
        status: 'SCHEDULED', competition: 'SCOTTISH_PREM',
      },
    }),
  ]);

  let user1Points = 0;
  let user2Points = 0;

  const finishedPredicts = [
    { uid: user1.id, mid: matches[0].id, ph: 2, pa: 1 },
    { uid: user2.id, mid: matches[0].id, ph: 1, pa: 1 },
    { uid: user1.id, mid: matches[1].id, ph: 3, pa: 0 },
    { uid: user2.id, mid: matches[1].id, ph: 2, pa: 2 },
    { uid: user1.id, mid: matches[2].id, ph: 1, pa: 1 },
    { uid: user2.id, mid: matches[2].id, ph: 2, pa: 0 },
    { uid: user1.id, mid: matches[3].id, ph: 0, pa: 0 },
    { uid: user2.id, mid: matches[3].id, ph: 1, pa: 0 },
    { uid: user1.id, mid: matches[6].id, ph: 1, pa: 0 },
    { uid: user2.id, mid: matches[6].id, ph: 2, pa: 0 },
    { uid: user1.id, mid: matches[7].id, ph: 1, pa: 0 },
    { uid: user2.id, mid: matches[7].id, ph: 1, pa: 1 },
  ];

  for (const p of finishedPredicts) {
    const m = matches.find((x) => x.id === p.mid);
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

  const scheduledPredicts = [
    { uid: user1.id, mid: matches[4].id, ph: 2, pa: 1 },
    { uid: user2.id, mid: matches[4].id, ph: 1, pa: 1 },
    { uid: user1.id, mid: matches[5].id, ph: 0, pa: 0 },
    { uid: user2.id, mid: matches[5].id, ph: 2, pa: 0 },
    { uid: user1.id, mid: matches[8].id, ph: 1, pa: 0 },
    { uid: user2.id, mid: matches[8].id, ph: 0, pa: 1 },
    { uid: user2.id, mid: matches[9].id, ph: 2, pa: 1 },
    { uid: user1.id, mid: matches[10].id, ph: 1, pa: 1 },
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

  const comment1 = await prisma.comment.create({
    data: {
      content: 'Great match! Brazil played really well.',
      userId: user1.id, matchId: matches[0].id,
    },
  });
  const comment2 = await prisma.comment.create({
    data: {
      content: 'Germany could have done better in defense.',
      userId: user2.id, matchId: matches[0].id, parentId: comment1.id,
    },
  });
  await prisma.comment.create({
    data: {
      content: "Agreed, but Brazil's attack was unstoppable today.",
      userId: user1.id, matchId: matches[0].id, parentId: comment2.id,
    },
  });

  console.log('Seed data inserted successfully!');
  console.log(`Users: testuser1 (${user1Points} pts), testuser2 (${user2Points} pts)`);
  console.log(`Matches: ${matches.length} (5 FINISHED, 6 SCHEDULED)`);
  console.log(`Predictions: ${finishedPredicts.length + scheduledPredicts.length}`);
  console.log('Comments: 3');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

const TEST_USER = 'concurrencytest1';
const TEST_PASSWORD = 'password123';

describe('Concurrency: match settlement', () => {
  let token: string;
  let matchId: number;
  let userId: number;

  beforeAll(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ username: TEST_USER, password: TEST_PASSWORD });
    token = regRes.body.token;
    userId = regRes.body.user.id;

    const match = await prisma.match.create({
      data: {
        homeTeam: 'TeamX', awayTeam: 'TeamY',
        matchDate: new Date('2026-12-01T15:00:00Z'),
        status: 'SCHEDULED', competition: 'WORLD_CUP',
      },
    });
    matchId = match.id;

    await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ matchId, predictedHomeScore: 2, predictedAwayScore: 1 });
  });

  afterAll(async () => {
    await prisma.prediction.deleteMany({ where: { matchId } });
    await prisma.match.deleteMany({ where: { id: matchId } });
    await prisma.user.deleteMany({ where: { username: TEST_USER } });
    await prisma.$disconnect();
  });

  test('concurrent PATCH requests should not double-settle', async () => {
    const patchBody = { homeScore: 2, awayScore: 1, status: 'FINISHED' };

    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/matches/${matchId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(patchBody),
      request(app)
        .patch(`/api/matches/${matchId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(patchBody),
    ]);

    expect(res1.status === 200 || res2.status === 200).toBe(true);

    const prediction = await prisma.prediction.findFirst({
      where: { matchId, userId },
    });

    expect(prediction).not.toBeNull();
    expect(prediction!.points).toBe(3);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user).not.toBeNull();
    expect(user!.points).toBe(3);
  });
});

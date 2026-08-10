import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

const TEST_USER = 'predtest1';
const TEST_PASSWORD = 'password123';

describe('Predictions API', () => {
  let token: string;
  let scheduledMatchId: number;
  let finishedMatchId: number;

  beforeAll(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ username: TEST_USER, password: TEST_PASSWORD });
    token = regRes.body.token;

    const scheduledMatch = await prisma.match.create({
      data: {
        homeTeam: 'TeamA', awayTeam: 'TeamB',
        matchDate: new Date('2026-12-01T15:00:00Z'),
        status: 'SCHEDULED', competition: 'WORLD_CUP',
      },
    });
    scheduledMatchId = scheduledMatch.id;

    const finishedMatch = await prisma.match.create({
      data: {
        homeTeam: 'TeamC', awayTeam: 'TeamD',
        matchDate: new Date('2026-06-01T15:00:00Z'),
        homeScore: 2, awayScore: 1,
        status: 'FINISHED', competition: 'WORLD_CUP',
      },
    });
    finishedMatchId = finishedMatch.id;
  });

  afterAll(async () => {
    await prisma.prediction.deleteMany({
      where: { matchId: { in: [scheduledMatchId, finishedMatchId] } },
    });
    await prisma.match.deleteMany({
      where: { id: { in: [scheduledMatchId, finishedMatchId] } },
    });
    await prisma.user.deleteMany({ where: { username: TEST_USER } });
    await prisma.$disconnect();
  });

  test('submit prediction on scheduled match', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ matchId: scheduledMatchId, predictedHomeScore: 1, predictedAwayScore: 0 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('prediction');
    expect(res.body.prediction.predictedHomeScore).toBe(1);
    expect(res.body.prediction.predictedAwayScore).toBe(0);
  });

  test('duplicate submission should update, not create new', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ matchId: scheduledMatchId, predictedHomeScore: 3, predictedAwayScore: 2 });

    expect(res.status).toBe(201);
    expect(res.body.prediction.predictedHomeScore).toBe(3);
    expect(res.body.prediction.predictedAwayScore).toBe(2);

    const mineRes = await request(app)
      .get('/api/predictions/mine')
      .set('Authorization', `Bearer ${token}`);

    const predsForMatch = mineRes.body.predictions.filter(
      (p: { matchId: number }) => p.matchId === scheduledMatchId
    );
    expect(predsForMatch.length).toBe(1);
  });

  test('submit prediction on finished match should fail', async () => {
    const res = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({ matchId: finishedMatchId, predictedHomeScore: 1, predictedAwayScore: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('get /mine returns user predictions', async () => {
    const res = await request(app)
      .get('/api/predictions/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('predictions');
    expect(res.body.predictions.length).toBeGreaterThan(0);
  });

  test('get /match/:id returns match predictions', async () => {
    const res = await request(app)
      .get(`/api/predictions/match/${scheduledMatchId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('predictions');
    expect(res.body.predictions.length).toBe(1);
  });
});

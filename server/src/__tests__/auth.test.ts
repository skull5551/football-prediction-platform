import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

const TEST_USER = 'authtest1';
const TEST_PASSWORD = 'password123';

describe('Auth API', () => {
  let token: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: TEST_USER } });
    await prisma.$disconnect();
  });

  test('register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: TEST_USER, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe(TEST_USER);
    token = res.body.token;
  });

  test('duplicate registration should fail', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: TEST_USER, password: TEST_PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('login with correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_USER, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe(TEST_USER);
    token = res.body.token;
  });

  test('login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_USER, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('get /me with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe(TEST_USER);
  });

  test('get /me without token should fail', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});

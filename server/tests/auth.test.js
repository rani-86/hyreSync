jest.mock('../src/config/email');

const request = require('supertest');
const app = require('../src/app');
const db = require('./dbHandler');
const { createUser } = require('./helpers');

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe('auth', () => {
  test('signup creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password1!',
      role: 'candidate',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane@example.com');
  });

  test('signup rejects a weak password', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Jane Doe',
      email: 'jane2@example.com',
      password: 'weak',
      role: 'candidate',
    });

    expect(res.status).toBe(400);
  });

  test('signup rejects a duplicate email', async () => {
    await createUser({ email: 'dup@example.com' });

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Dup',
      email: 'dup@example.com',
      password: 'Password1!',
      role: 'candidate',
    });

    expect(res.status).toBe(409);
  });

  test('login succeeds with correct credentials', async () => {
    await createUser({ email: 'login@example.com' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'Password1!',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('login rejects wrong password', async () => {
    await createUser({ email: 'wrongpass@example.com' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpass@example.com',
      password: 'NotTheRightOne1!',
    });

    expect(res.status).toBe(401);
  });

  test('login rejects an unknown email without revealing which part was wrong', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'Password1!',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});

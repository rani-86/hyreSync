jest.mock('../src/services/mlService');

const request = require('supertest');
const app = require('../src/app');
const db = require('./dbHandler');
const Job = require('../src/models/Jobs');
const { createUser, tokenFor } = require('./helpers');

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

const createJobDirect = async (postedBy) =>
  Job.create({
    title: 'Backend Engineer',
    description: 'Build APIs',
    skillsRequired: ['Node.js'],
    postedBy,
  });

describe('job ownership', () => {
  test('a verified recruiter can create a job', async () => {
    const recruiter = await createUser({ role: 'recruiter' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenFor(recruiter)}`)
      .send({ title: 'Backend Engineer', description: 'Build APIs', skillsRequired: ['Node.js'] });

    expect(res.status).toBe(201);
    expect(res.body.postedBy).toBe(String(recruiter._id));
  });

  test('a candidate cannot create a job', async () => {
    const candidate = await createUser({ role: 'candidate' });
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${tokenFor(candidate)}`)
      .send({ title: 'Backend Engineer', description: 'Build APIs' });

    expect(res.status).toBe(403);
  });

  test('only the posting recruiter can update their job', async () => {
    const owner = await createUser({ role: 'recruiter' });
    const otherRecruiter = await createUser({ role: 'recruiter' });
    const job = await createJobDirect(owner._id);

    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${tokenFor(otherRecruiter)}`)
      .send({ title: 'Changed title' });

    expect(res.status).toBe(403);
  });

  test('only the posting recruiter can delete their job', async () => {
    const owner = await createUser({ role: 'recruiter' });
    const otherRecruiter = await createUser({ role: 'recruiter' });
    const job = await createJobDirect(owner._id);

    const res = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${tokenFor(otherRecruiter)}`);

    expect(res.status).toBe(403);
  });

  test('the owning recruiter can delete their job', async () => {
    const owner = await createUser({ role: 'recruiter' });
    const job = await createJobDirect(owner._id);

    const res = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(res.status).toBe(200);
    expect(await Job.findById(job._id)).toBeNull();
  });
});

jest.mock('../src/services/mlService');
jest.mock('../src/config/email');

const request = require('supertest');
const app = require('../src/app');
const db = require('./dbHandler');
const Job = require('../src/models/Jobs');
const Application = require('../src/models/Application');
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

describe('applying to a job', () => {
  test('a verified candidate can apply, and gets a 201 immediately', async () => {
    const recruiter = await createUser({ role: 'recruiter' });
    const candidate = await createUser({ role: 'candidate' });
    const job = await createJobDirect(recruiter._id);

    const res = await request(app)
      .post(`/api/applications/${job._id}`)
      .set('Authorization', `Bearer ${tokenFor(candidate)}`);

    expect(res.status).toBe(201);
    expect(res.body.job).toBe(String(job._id));
    expect(res.body.scoringStatus).toBe('pending');
  });

  test('applying twice to the same job returns 409', async () => {
    const recruiter = await createUser({ role: 'recruiter' });
    const candidate = await createUser({ role: 'candidate' });
    const job = await createJobDirect(recruiter._id);

    await request(app).post(`/api/applications/${job._id}`).set('Authorization', `Bearer ${tokenFor(candidate)}`);
    const res = await request(app)
      .post(`/api/applications/${job._id}`)
      .set('Authorization', `Bearer ${tokenFor(candidate)}`);

    expect(res.status).toBe(409);
  });

  test('an unverified candidate cannot apply', async () => {
    const recruiter = await createUser({ role: 'recruiter' });
    const candidate = await createUser({ role: 'candidate', isVerified: false });
    const job = await createJobDirect(recruiter._id);

    const res = await request(app)
      .post(`/api/applications/${job._id}`)
      .set('Authorization', `Bearer ${tokenFor(candidate)}`);

    expect(res.status).toBe(403);
  });
});

describe('updating application status', () => {
  const setup = async () => {
    const recruiter = await createUser({ role: 'recruiter' });
    const otherRecruiter = await createUser({ role: 'recruiter' });
    const candidate = await createUser({ role: 'candidate' });
    const job = await createJobDirect(recruiter._id);
    const application = await Application.create({ job: job._id, candidate: candidate._id });
    return { recruiter, otherRecruiter, candidate, job, application };
  };

  test('the posting recruiter can update application status', async () => {
    const { recruiter, application } = await setup();

    const res = await request(app)
      .patch(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(recruiter)}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
  });

  test('a recruiter who does not own the job cannot update application status', async () => {
    const { otherRecruiter, application } = await setup();

    const res = await request(app)
      .patch(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(otherRecruiter)}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(403);
  });

  test('rejects an invalid status value', async () => {
    const { recruiter, application } = await setup();

    const res = await request(app)
      .patch(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${tokenFor(recruiter)}`)
      .send({ status: 'not-a-real-status' });

    expect(res.status).toBe(400);
  });
});

describe('fit-score read path', () => {
  test('the applicants-with-fit-scores endpoint is a plain DB read, sorted by fitScore', async () => {
    const recruiter = await createUser({ role: 'recruiter' });
    const candidateA = await createUser({ role: 'candidate' });
    const candidateB = await createUser({ role: 'candidate' });
    const job = await createJobDirect(recruiter._id);

    await Application.create({ job: job._id, candidate: candidateA._id, fitScore: 20, scoringStatus: 'done' });
    await Application.create({ job: job._id, candidate: candidateB._id, fitScore: 80, scoringStatus: 'done' });

    const res = await request(app)
      .get(`/api/applications/job/${job._id}/fit-scores`)
      .set('Authorization', `Bearer ${tokenFor(recruiter)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].fitScore).toBe(80);
    expect(res.body[1].fitScore).toBe(20);
  });

  test('a recruiter who does not own the job cannot view its applicants', async () => {
    const recruiter = await createUser({ role: 'recruiter' });
    const otherRecruiter = await createUser({ role: 'recruiter' });
    const job = await createJobDirect(recruiter._id);

    const res = await request(app)
      .get(`/api/applications/job/${job._id}/fit-scores`)
      .set('Authorization', `Bearer ${tokenFor(otherRecruiter)}`);

    expect(res.status).toBe(403);
  });
});

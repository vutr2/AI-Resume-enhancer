/**
 * Security: Data Ownership / Isolation
 *
 * Users must only be able to read, update, or delete their own resumes.
 * All queries include `user: decoded.descopeId` — these tests verify that
 * attempting to access another user's resource returns 404 (not the data,
 * and not a 403 that would reveal the resource exists).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Resume', () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

import { getCurrentUser } from '@/lib/auth';
import Resume from '@/models/Resume';
import { GET, PUT, DELETE } from '@/app/api/resumes/[id]/route';
import { GET as fileGet } from '@/app/api/resumes/[id]/file/route';

const USER_A = { descopeId: 'user_a', email: 'a@test.com', name: 'User A' };
const USER_B = { descopeId: 'user_b', email: 'b@test.com', name: 'User B' };

// Simulate: resume belongs to user_b, user_a is making the request
function paramsFor(id) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(USER_A);
  // findOne/findOneAndUpdate/findOneAndDelete return null → resource not found for this user
  Resume.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
  Resume.findOneAndUpdate.mockResolvedValue(null);
  Resume.findOneAndDelete.mockResolvedValue(null);
});

describe('Resume ownership enforcement', () => {
  it('GET another user\'s resume returns 404, not the data', async () => {
    const res = await GET({}, paramsFor('other_resume_id'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('PUT (update) another user\'s resume returns 404', async () => {
    const req = { json: async () => ({ title: 'Hacked title' }) };
    const res = await PUT(req, paramsFor('other_resume_id'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('DELETE another user\'s resume returns 404', async () => {
    const res = await DELETE({}, paramsFor('other_resume_id'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('GET file of another user\'s resume returns 404', async () => {
    Resume.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });
    const res = await fileGet({}, paramsFor('other_file_id'));
    expect(res.status).toBe(404);
  });

  it('ownership query always includes the authenticated user\'s descopeId', async () => {
    await GET({}, paramsFor('resume_xyz'));
    // The query passed to findOne must include user: USER_A.descopeId
    const callArg = Resume.findOne.mock.calls[0][0];
    expect(callArg).toMatchObject({ user: USER_A.descopeId });
    // Must NOT query without a user constraint (would expose all resumes)
    expect(callArg.user).not.toBeUndefined();
  });

  it('update query always scopes to authenticated user', async () => {
    const req = { json: async () => ({ title: 'New title' }) };
    await PUT(req, paramsFor('resume_abc'));
    const callArg = Resume.findOneAndUpdate.mock.calls[0][0];
    expect(callArg).toMatchObject({ user: USER_A.descopeId });
  });

  it('delete query always scopes to authenticated user', async () => {
    await DELETE({}, paramsFor('resume_abc'));
    const callArg = Resume.findOneAndDelete.mock.calls[0][0];
    expect(callArg).toMatchObject({ user: USER_A.descopeId });
  });
});

describe('Authenticated user accesses their own resume', () => {
  it('returns the resume when user matches', async () => {
    const ownResume = { _id: 'my_resume', user: USER_A.descopeId, title: 'My CV' };
    Resume.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(ownResume),
    });
    const res = await GET({}, paramsFor('my_resume'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

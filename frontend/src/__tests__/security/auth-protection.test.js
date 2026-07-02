/**
 * Security: Authentication Protection
 *
 * Every protected API route must return 401 when called without a valid
 * Descope session. These tests verify that no route accidentally skips
 * the auth check.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// All routes share the same auth helper — mock it once
vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/lib/affiliate', () => ({ isAdmin: vi.fn(), generateRefCode: vi.fn() }));
vi.mock('@/models/Resume', () => ({ default: { findOne: vi.fn(), find: vi.fn(), findOneAndUpdate: vi.fn(), findOneAndDelete: vi.fn() } }));
vi.mock('@/models/Affiliate', () => ({ default: { findOne: vi.fn() } }));
vi.mock('@/models/Referral', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Commission', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Payout', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/User', () => ({ default: { findOne: vi.fn(), findById: vi.fn() } }));
vi.mock('@/models/Payment', () => ({ default: { find: vi.fn(), countDocuments: vi.fn() } }));
vi.mock('@/models/CoverLetter', () => ({ default: { deleteMany: vi.fn() } }));
vi.mock('@/lib/credits', () => ({
  checkCredits:        vi.fn().mockResolvedValue({ success: false, error: 'Vui lòng đăng nhập', status: 401 }),
  atomicConsumeCredit: vi.fn().mockResolvedValue({ success: false, error: 'Vui lòng đăng nhập', status: 401 }),
}));

import { getCurrentUser } from '@/lib/auth';

// Route handlers under test
import { GET as resumeListGet, POST as resumeListPost } from '@/app/api/resumes/route';
import { GET as resumeGetById, PUT as resumePut, DELETE as resumeDelete } from '@/app/api/resumes/[id]/route';
import { GET as resumeFileGet } from '@/app/api/resumes/[id]/file/route';
import { GET as affiliateStatsGet } from '@/app/api/affiliate/stats/route';
import { POST as affiliateRegisterPost } from '@/app/api/affiliate/register/route';
import { GET as adminAffiliatesGet } from '@/app/api/admin/affiliates/route';
import { POST as adminApprovePost } from '@/app/api/admin/commissions/approve/route';
import { POST as adminPayoutPost } from '@/app/api/admin/payout/route';
import { GET as paymentHistoryGet } from '@/app/api/payments/history/route';
import { DELETE as deleteAccountDelete } from '@/app/api/auth/delete-account/route';
import { GET as creditsCheckGet } from '@/app/api/credits/check/route';
import { POST as creditsUsePost } from '@/app/api/credits/use/route';

const FAKE_PARAMS = { params: Promise.resolve({ id: 'some_id' }) };
const FAKE_REQ = { json: async () => ({}) };
const FAKE_REQ_URL = { url: 'http://localhost:3000/api/payments/history' };

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(null); // not authenticated
});

describe('Unauthenticated requests must return 401', () => {
  it('GET /api/resumes', async () => {
    const res = await resumeListGet({});
    expect(res.status).toBe(401);
  });

  it('POST /api/resumes', async () => {
    const res = await resumeListPost(FAKE_REQ);
    expect(res.status).toBe(401);
  });

  it('GET /api/resumes/[id]', async () => {
    const res = await resumeGetById({}, FAKE_PARAMS);
    expect(res.status).toBe(401);
  });

  it('PUT /api/resumes/[id]', async () => {
    const res = await resumePut(FAKE_REQ, FAKE_PARAMS);
    expect(res.status).toBe(401);
  });

  it('DELETE /api/resumes/[id]', async () => {
    const res = await resumeDelete({}, FAKE_PARAMS);
    expect(res.status).toBe(401);
  });

  it('GET /api/resumes/[id]/file', async () => {
    const res = await resumeFileGet({}, FAKE_PARAMS);
    expect(res.status).toBe(401);
  });

  it('GET /api/affiliate/stats', async () => {
    const res = await affiliateStatsGet();
    expect(res.status).toBe(401);
  });

  it('POST /api/affiliate/register', async () => {
    const res = await affiliateRegisterPost(FAKE_REQ);
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/affiliates', async () => {
    const res = await adminAffiliatesGet();
    expect(res.status).toBe(401);
  });

  it('POST /api/admin/commissions/approve', async () => {
    const res = await adminApprovePost(FAKE_REQ);
    expect(res.status).toBe(401);
  });

  it('POST /api/admin/payout', async () => {
    const res = await adminPayoutPost(FAKE_REQ);
    expect(res.status).toBe(401);
  });

  it('GET /api/payments/history', async () => {
    const res = await paymentHistoryGet(FAKE_REQ_URL);
    expect(res.status).toBe(401);
  });

  it('DELETE /api/auth/delete-account', async () => {
    const res = await deleteAccountDelete();
    expect(res.status).toBe(401);
  });

  it('GET /api/credits/check', async () => {
    const res = await creditsCheckGet();
    expect(res.status).toBe(401);
  });

  it('POST /api/credits/use', async () => {
    const res = await creditsUsePost();
    expect(res.status).toBe(401);
  });
});

/**
 * Security: Admin Privilege Escalation Prevention
 *
 * Admin routes must reject authenticated but non-admin users with 403.
 * A regular user must never be able to view affiliate data, approve
 * commissions, or trigger payouts just by being logged in.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/affiliate', () => ({ isAdmin: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Affiliate', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Referral', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Commission', () => ({ default: { find: vi.fn(), updateMany: vi.fn() } }));
vi.mock('@/models/Payout', () => ({ default: { create: vi.fn(), findByIdAndUpdate: vi.fn() } }));
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, connection: { db: null } };
});

import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/affiliate';
import { GET as adminAffiliatesGet } from '@/app/api/admin/affiliates/route';
import { POST as adminApprovePost } from '@/app/api/admin/commissions/approve/route';
import { POST as adminPayoutPost } from '@/app/api/admin/payout/route';

const REGULAR_USER = { descopeId: 'user_1', email: 'user@example.com', name: 'Regular User' };
const ADMIN_USER = { descopeId: 'admin_1', email: 'admin@example.com', name: 'Admin' };
const FAKE_REQ = { json: async () => ({ commissionIds: ['id1'], action: 'create', affiliateId: 'aff1', periodStart: '2026-01-01', periodEnd: '2026-01-31' }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Non-admin authenticated user is blocked with 403', () => {
  beforeEach(() => {
    getCurrentUser.mockResolvedValue(REGULAR_USER);
    isAdmin.mockReturnValue(false);
  });

  it('GET /api/admin/affiliates → 403', async () => {
    const res = await adminAffiliatesGet();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('POST /api/admin/commissions/approve → 403', async () => {
    const res = await adminApprovePost(FAKE_REQ);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('POST /api/admin/payout → 403', async () => {
    const res = await adminPayoutPost(FAKE_REQ);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});

describe('isAdmin check is called with the authenticated user email', () => {
  it('passes the correct email to isAdmin', async () => {
    getCurrentUser.mockResolvedValue(REGULAR_USER);
    isAdmin.mockReturnValue(false);
    await adminAffiliatesGet();
    expect(isAdmin).toHaveBeenCalledWith(REGULAR_USER.email);
  });
});

describe('Admin user reaches the route handler', () => {
  it('GET /api/admin/affiliates → 200 for admin', async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    isAdmin.mockReturnValue(true);

    const Affiliate = (await import('@/models/Affiliate')).default;
    Affiliate.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
    });
    const Referral = (await import('@/models/Referral')).default;
    Referral.find.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
    const Commission = (await import('@/models/Commission')).default;
    Commission.find.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

    const res = await adminAffiliatesGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

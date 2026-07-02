import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/affiliate', () => ({ isAdmin: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Commission', () => ({ default: { find: vi.fn(), updateMany: vi.fn() } }));
vi.mock('@/models/Payout', () => ({ default: { create: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn() } }));
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    connection: { db: null },
  };
});

import { POST } from '@/app/api/admin/payout/route';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/affiliate';
import Commission from '@/models/Commission';
import Payout from '@/models/Payout';

const ADMIN_USER = { descopeId: 'admin_1', email: 'admin@example.com', name: 'Admin' };

function makeReq(body) {
  return { json: async () => body };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/admin/payout', () => {
  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ action: 'create' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when not admin', async () => {
    getCurrentUser.mockResolvedValue({ ...ADMIN_USER, email: 'user@test.com' });
    isAdmin.mockReturnValue(false);
    const res = await POST(makeReq({ action: 'create' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when affiliateId is missing for create action', async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    isAdmin.mockReturnValue(true);
    const res = await POST(makeReq({ action: 'create', periodStart: '2026-01-01', periodEnd: '2026-01-31' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when no approved commissions found', async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    isAdmin.mockReturnValue(true);
    Commission.find.mockReturnValue({ lean: () => Promise.resolve([]) });

    const res = await POST(makeReq({
      action: 'create',
      affiliateId: 'aff1',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/không có commission/i);
  });

  it('returns 400 when payoutId missing for mark_paid action', async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    isAdmin.mockReturnValue(true);
    const res = await POST(makeReq({ action: 'mark_paid' }));
    expect(res.status).toBe(400);
  });
});

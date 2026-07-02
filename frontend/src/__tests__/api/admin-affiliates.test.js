import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/affiliate', () => ({ isAdmin: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Affiliate', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Referral', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Commission', () => ({ default: { find: vi.fn() } }));

import { GET } from '@/app/api/admin/affiliates/route';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/affiliate';
import Affiliate from '@/models/Affiliate';
import Referral from '@/models/Referral';
import Commission from '@/models/Commission';

const ADMIN_USER = { descopeId: 'admin_1', email: 'admin@example.com', name: 'Admin' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/affiliates', () => {
  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    getCurrentUser.mockResolvedValue({ ...ADMIN_USER, email: 'user@example.com' });
    isAdmin.mockReturnValue(false);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns affiliate list with stats for admin', async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    isAdmin.mockReturnValue(true);

    const mockAffId = { toString: () => 'aff1' };
    Affiliate.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: () => Promise.resolve([
          { _id: mockAffId, name: 'Alice', email: 'alice@test.com', refCode: 'alice1', status: 'active' },
        ]),
      }),
    });
    Referral.find.mockReturnValue({
      lean: () => Promise.resolve([
        { affiliateId: { toString: () => 'aff1' }, status: 'signed_up' },
        { affiliateId: { toString: () => 'aff1' }, status: 'converted' },
      ]),
    });
    Commission.find.mockReturnValue({
      lean: () => Promise.resolve([
        {
          _id: { toString: () => 'comm1' },
          affiliateId: { toString: () => 'aff1' },
          status: 'pending',
          commissionAmount: 50000,
          grossAmount: 100000,
        },
      ]),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.affiliates).toHaveLength(1);
    expect(body.data.affiliates[0].stats.signedUp).toBe(1);
    expect(body.data.affiliates[0].stats.converted).toBe(1);
    expect(body.data.affiliates[0].stats.pendingAmount).toBe(50000);
    expect(body.data.pendingCommissions).toHaveLength(1);
  });
});

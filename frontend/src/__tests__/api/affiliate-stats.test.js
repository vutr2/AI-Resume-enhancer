import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Affiliate', () => ({ default: { findOne: vi.fn() } }));
vi.mock('@/models/Referral', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Commission', () => ({ default: { find: vi.fn() } }));
vi.mock('@/models/Payout', () => ({ default: { find: vi.fn().mockReturnValue({ sort: vi.fn() }) } }));

import { GET } from '@/app/api/affiliate/stats/route';
import { getCurrentUser } from '@/lib/auth';
import Affiliate from '@/models/Affiliate';
import Referral from '@/models/Referral';
import Commission from '@/models/Commission';
import Payout from '@/models/Payout';

const MOCK_USER = { descopeId: 'desc_123', email: 'alice@example.com', name: 'Alice' };
const MOCK_AFFILIATE = {
  _id: 'aff_id_123',
  refCode: 'alice1234',
  name: 'Alice',
  email: 'alice@example.com',
  status: 'active',
  payoutInfo: { bankName: 'VCB', accountNumber: '123', accountHolder: 'ALICE' },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
});

describe('GET /api/affiliate/stats', () => {
  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 404 when user is not an affiliate', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns stats with zeroed amounts when no referrals or commissions', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockReturnValue({ lean: () => Promise.resolve(MOCK_AFFILIATE) });
    Referral.find.mockReturnValue({ lean: () => Promise.resolve([]) });
    Commission.find.mockReturnValue({ lean: () => Promise.resolve([]) });
    Payout.find.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.stats.signedUp).toBe(0);
    expect(body.data.stats.converted).toBe(0);
    expect(body.data.stats.pendingAmount).toBe(0);
    expect(body.data.stats.paidAmount).toBe(0);
    expect(body.data.stats.totalEarned).toBe(0);
  });

  it('correctly sums commission amounts by status', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockReturnValue({ lean: () => Promise.resolve(MOCK_AFFILIATE) });
    Referral.find.mockReturnValue({
      lean: () => Promise.resolve([
        { status: 'signed_up' },
        { status: 'converted' },
        { status: 'converted' },
      ]),
    });
    Commission.find.mockReturnValue({
      lean: () => Promise.resolve([
        { status: 'pending', commissionAmount: 50000 },
        { status: 'pending', commissionAmount: 25000 },
        { status: 'approved', commissionAmount: 100000 },
        { status: 'paid', commissionAmount: 200000 },
      ]),
    });
    Payout.find.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });

    const res = await GET();
    const body = await res.json();
    expect(body.data.stats.signedUp).toBe(1);
    expect(body.data.stats.converted).toBe(2);
    expect(body.data.stats.pendingAmount).toBe(75000);
    expect(body.data.stats.approvedAmount).toBe(100000);
    expect(body.data.stats.paidAmount).toBe(200000);
    expect(body.data.stats.totalEarned).toBe(375000);
  });

  it('includes the correct affiliateLink in the response', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockReturnValue({ lean: () => Promise.resolve(MOCK_AFFILIATE) });
    Referral.find.mockReturnValue({ lean: () => Promise.resolve([]) });
    Commission.find.mockReturnValue({ lean: () => Promise.resolve([]) });
    Payout.find.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });

    const res = await GET();
    const body = await res.json();
    expect(body.data.affiliate.affiliateLink).toBe('http://localhost:3000?ref=alice1234');
  });

  it('returns 500 on unexpected error', async () => {
    getCurrentUser.mockResolvedValue(MOCK_USER);
    Affiliate.findOne.mockReturnValue({ lean: () => Promise.reject(new Error('DB error')) });

    const res = await GET();
    expect(res.status).toBe(500);
  });
});

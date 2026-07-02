import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/affiliate', () => ({ isAdmin: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Commission', () => ({
  default: { updateMany: vi.fn() },
}));

import { POST } from '@/app/api/admin/commissions/approve/route';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/affiliate';
import Commission from '@/models/Commission';

function makeReq(body) {
  return { json: async () => body };
}

const ADMIN_USER = { descopeId: 'admin_1', email: 'admin@example.com', name: 'Admin' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/admin/commissions/approve', () => {
  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ commissionIds: ['id1'] }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when not admin', async () => {
    getCurrentUser.mockResolvedValue({ email: 'user@test.com' });
    isAdmin.mockReturnValue(false);
    const res = await POST(makeReq({ commissionIds: ['id1'] }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when commissionIds is empty', async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    isAdmin.mockReturnValue(true);
    const res = await POST(makeReq({ commissionIds: [] }));
    expect(res.status).toBe(400);
  });

  it('calls updateMany and returns success with modifiedCount', async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    isAdmin.mockReturnValue(true);
    Commission.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const res = await POST(makeReq({ commissionIds: ['id1', 'id2', 'id3'] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.modifiedCount).toBe(3);
    expect(Commission.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' }),
      { $set: { status: 'approved' } }
    );
  });
});

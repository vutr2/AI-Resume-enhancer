/**
 * SePay IPN — payment grant logic + affiliate commission
 *
 * Covers:
 *   - New credit model: grant paidCredits or passExpiresAt per package
 *   - Legacy subscription model: set plan + planExpiresAt
 *   - Affiliate 90-day rule: commission on ALL purchases within 90 days of signup
 *   - Per-order idempotency: same orderId never gets two commissions
 *   - Secret key auth, event filtering, input validation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/lib/affiliate', () => ({ COMMISSION_RATE: 0.5 }));
vi.mock('@/lib/packages', () => ({
  PACKAGES: {
    credit_1:   { id: 'credit_1',  credits: 1, passDays: 0, price: 10000 },
    credit_3:   { id: 'credit_3',  credits: 3, passDays: 0, price: 25000 },
    week_pass:  { id: 'week_pass', credits: 0, passDays: 7, price: 99000 },
  },
}));

const mockPaymentFindOne    = vi.fn();
const mockUserFindByIdAndUpdate = vi.fn();
const mockReferralFindOne   = vi.fn();
const mockReferralUpdateOne = vi.fn();
const mockCommissionFindOne = vi.fn();
const mockCommissionCreate  = vi.fn();

vi.mock('@/models/Payment', () => ({
  default: { findOne: (...a) => mockPaymentFindOne(...a) },
}));
vi.mock('@/models/User', () => ({
  default: { findByIdAndUpdate: (...a) => mockUserFindByIdAndUpdate(...a) },
}));
vi.mock('@/models/Referral', () => ({
  default: {
    findOne:   (...a) => mockReferralFindOne(...a),
    updateOne: (...a) => mockReferralUpdateOne(...a),
  },
}));
vi.mock('@/models/Commission', () => ({
  default: {
    findOne: (...a) => mockCommissionFindOne(...a),
    create:  (...a) => mockCommissionCreate(...a),
  },
}));

import { POST } from '@/app/api/payments/sepay/ipn/route';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(body, headers = {}) {
  return {
    headers: { get: (h) => headers[h.toLowerCase()] ?? null },
    json: async () => body,
  };
}

function paidOrder(invoiceNumber = 'RMX123') {
  return {
    notification_type: 'ORDER_PAID',
    order: { order_invoice_number: invoiceNumber, order_status: 'CAPTURED' },
  };
}

function within90Days() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
}

function over90Days() {
  return new Date(Date.now() - 91 * 24 * 60 * 60 * 1000); // 91 days ago
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/payments/sepay/ipn', () => {
  let mockPayment;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SEPAY_IPN_SECRET;

    mockPayment = {
      status: 'pending',
      billingPeriod: 'monthly',
      amount: 10000,
      orderId: 'RMX123',
      user: 'user-db-id',
      package: 'credit_1',
      plan: null,
      save: vi.fn(),
    };
  });

  // ── Auth ───────────────────────────────────────────────────────────────

  it('returns 401 when configured secret key does not match', async () => {
    process.env.SEPAY_IPN_SECRET = 'correct-secret';
    const res = await POST(makeRequest(paidOrder(), { 'x-secret-key': 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('passes auth when secret key matches', async () => {
    process.env.SEPAY_IPN_SECRET = 'my-secret';
    mockPaymentFindOne.mockResolvedValue(null);
    const res = await POST(makeRequest(paidOrder(), { 'x-secret-key': 'my-secret' }));
    expect(res.status).toBe(404);
  });

  it('allows request when no SEPAY_IPN_SECRET is configured', async () => {
    mockPaymentFindOne.mockResolvedValue(null);
    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(404);
  });

  // ── Event filtering ────────────────────────────────────────────────────

  it('returns 200 and ignores non-ORDER_PAID events', async () => {
    const res = await POST(makeRequest({ notification_type: 'ORDER_CREATED' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPaymentFindOne).not.toHaveBeenCalled();
  });

  // ── Input validation ───────────────────────────────────────────────────

  it('returns 400 when invoice_number is missing', async () => {
    const res = await POST(makeRequest({ notification_type: 'ORDER_PAID', order: {} }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when payment record does not exist', async () => {
    mockPaymentFindOne.mockResolvedValue(null);
    const res = await POST(makeRequest(paidOrder('NOT-EXIST')));
    expect(res.status).toBe(404);
  });

  // ── Idempotency ────────────────────────────────────────────────────────

  it('returns 200 immediately when payment is already completed', async () => {
    mockPaymentFindOne.mockResolvedValue({ ...mockPayment, status: 'completed', save: vi.fn() });
    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(200);
    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('marks payment failed when order_status is not CAPTURED', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    const body = { notification_type: 'ORDER_PAID', order: { order_invoice_number: 'RMX123', order_status: 'FAILED' } };
    await POST(makeRequest(body));
    expect(mockPayment.status).toBe('failed');
    expect(mockPayment.save).toHaveBeenCalled();
    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  // ── New credit model: package grants ──────────────────────────────────

  it('grants paidCredits for credit_1 package', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user-ds' });
    mockReferralFindOne.mockResolvedValue(null);

    await POST(makeRequest(paidOrder()));

    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      'user-db-id',
      expect.objectContaining({ $inc: { paidCredits: 1 } }),
      expect.anything()
    );
  });

  it('grants paidCredits: 3 for credit_3 package', async () => {
    mockPayment.package = 'credit_3';
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user-ds' });
    mockReferralFindOne.mockResolvedValue(null);

    await POST(makeRequest(paidOrder()));

    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      'user-db-id',
      expect.objectContaining({ $inc: { paidCredits: 3 } }),
      expect.anything()
    );
  });

  it('sets passExpiresAt for week_pass (no $inc)', async () => {
    mockPayment.package = 'week_pass';
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user-ds' });
    mockReferralFindOne.mockResolvedValue(null);

    await POST(makeRequest(paidOrder()));

    const [, updateOp] = mockUserFindByIdAndUpdate.mock.calls[0];
    expect(updateOp.$set.passExpiresAt).toBeDefined();
    expect(updateOp.$inc).toBeUndefined();
  });

  it('uses legacy plan+expiry logic when payment.plan is set (no package)', async () => {
    mockPayment.package = null;
    mockPayment.plan = 'pro';
    mockPayment.billingPeriod = 'monthly';
    mockPayment.amount = 99000;
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user-ds' });
    mockReferralFindOne.mockResolvedValue(null);

    await POST(makeRequest(paidOrder()));

    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      'user-db-id',
      expect.objectContaining({ plan: 'pro', planExpiresAt: expect.any(Date) }),
      expect.anything()
    );
  });

  // ── Affiliate: 90-day rule ─────────────────────────────────────────────

  it('creates commission for first purchase within 90 days of signup', async () => {
    mockPayment.amount = 10000;
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'referred-user' });
    mockReferralFindOne.mockResolvedValue({
      _id: 'ref-id',
      affiliateId: 'aff-id',
      status: 'signed_up',
      signedUpAt: within90Days(),
    });
    mockCommissionFindOne.mockResolvedValue(null);
    mockCommissionCreate.mockResolvedValue({});
    mockReferralUpdateOne.mockResolvedValue({});

    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(200);
    expect(mockCommissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        affiliateId: 'aff-id',
        referralId: 'ref-id',
        grossAmount: 10000,
        commissionAmount: 5000,
        isFirstPayment: true,
      })
    );
  });

  it('creates commission for a SECOND purchase within 90 days (already converted referral)', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockResolvedValue({
      _id: 'ref-id',
      affiliateId: 'aff-id',
      status: 'converted', // already converted from first purchase
      signedUpAt: within90Days(),
    });
    mockCommissionFindOne.mockResolvedValue(null); // this specific orderId not yet commissioned
    mockCommissionCreate.mockResolvedValue({});
    mockReferralUpdateOne.mockResolvedValue({});

    await POST(makeRequest(paidOrder()));

    // Commission created even though referral is 'converted'
    expect(mockCommissionCreate).toHaveBeenCalledOnce();
    // isFirstPayment: false for subsequent purchases
    expect(mockCommissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ isFirstPayment: false })
    );
    // Referral status NOT updated again (already 'converted')
    expect(mockReferralUpdateOne).not.toHaveBeenCalled();
  });

  it('does NOT create commission when referral is older than 90 days', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    // Referral.findOne with the 90-day date filter returns null
    mockReferralFindOne.mockResolvedValue(null);

    await POST(makeRequest(paidOrder()));
    expect(mockCommissionCreate).not.toHaveBeenCalled();
  });

  it('uses per-order idempotency: same orderId never gets two commissions', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockResolvedValue({
      _id: 'ref',
      affiliateId: 'aff',
      status: 'converted',
      signedUpAt: within90Days(),
    });
    // A commission for this orderId already exists
    mockCommissionFindOne.mockResolvedValue({ _id: 'existing-commission' });

    await POST(makeRequest(paidOrder()));
    expect(mockCommissionCreate).not.toHaveBeenCalled();
  });

  it('commission amount is exactly 50% of gross', async () => {
    mockPayment.amount = 25000;
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockResolvedValue({
      _id: 'ref',
      affiliateId: 'aff',
      status: 'signed_up',
      signedUpAt: within90Days(),
    });
    mockCommissionFindOne.mockResolvedValue(null);
    mockCommissionCreate.mockResolvedValue({});
    mockReferralUpdateOne.mockResolvedValue({});

    await POST(makeRequest(paidOrder()));
    expect(mockCommissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ commissionAmount: 12500 })
    );
  });

  it('marks referral converted on first purchase only', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockResolvedValue({
      _id: 'ref-id',
      affiliateId: 'aff',
      status: 'signed_up',
      signedUpAt: within90Days(),
    });
    mockCommissionFindOne.mockResolvedValue(null);
    mockCommissionCreate.mockResolvedValue({});
    mockReferralUpdateOne.mockResolvedValue({});

    await POST(makeRequest(paidOrder()));
    expect(mockReferralUpdateOne).toHaveBeenCalledWith(
      { _id: 'ref-id' },
      expect.objectContaining({ status: 'converted' })
    );
  });

  it('skips commission when no referral exists', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'organic-user' });
    mockReferralFindOne.mockResolvedValue(null);

    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(200);
    expect(mockCommissionCreate).not.toHaveBeenCalled();
  });

  it('still returns 200 even when affiliate commission logic errors (best-effort)', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockRejectedValue(new Error('DB down'));

    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(200);
  });
});

/**
 * SePay IPN — commission creation
 *
 * This is the most critical money flow: SePay calls our IPN endpoint when a
 * payment completes, and we must create an affiliate commission for the
 * referring affiliate (if one exists). Tests cover the full happy path plus
 * idempotency and edge cases.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/lib/affiliate', () => ({ COMMISSION_RATE: 0.5 }));

const mockPaymentFindOne   = vi.fn();
const mockUserFindByIdAndUpdate = vi.fn();
const mockReferralFindOne  = vi.fn();
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
    findOne:  (...a) => mockReferralFindOne(...a),
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

// ── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/payments/sepay/ipn', () => {
  let mockPayment;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SEPAY_IPN_SECRET;

    mockPayment = {
      status: 'pending',
      billingPeriod: 'monthly',
      amount: 99000,
      orderId: 'RMX123',
      user: 'user-db-id',
      save: vi.fn(),
    };
  });

  // ── Secret key ──────────────────────────────────────────────────────────

  it('returns 401 when configured secret key does not match', async () => {
    process.env.SEPAY_IPN_SECRET = 'correct-secret';
    const res = await POST(makeRequest(paidOrder(), { 'x-secret-key': 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('passes auth when secret key matches', async () => {
    process.env.SEPAY_IPN_SECRET = 'my-secret';
    mockPaymentFindOne.mockResolvedValue(null);
    const res = await POST(makeRequest(paidOrder(), { 'x-secret-key': 'my-secret' }));
    // Payment not found, but auth passed — gets 404 not 401
    expect(res.status).toBe(404);
  });

  it('allows request when no SEPAY_IPN_SECRET is configured', async () => {
    mockPaymentFindOne.mockResolvedValue(null);
    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(404);
  });

  // ── Event filtering ─────────────────────────────────────────────────────

  it('returns 200 and ignores non-ORDER_PAID events', async () => {
    const res = await POST(makeRequest({ notification_type: 'ORDER_CREATED' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPaymentFindOne).not.toHaveBeenCalled();
  });

  // ── Input validation ────────────────────────────────────────────────────

  it('returns 400 when invoice_number is missing from order', async () => {
    const res = await POST(makeRequest({ notification_type: 'ORDER_PAID', order: {} }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when payment record does not exist', async () => {
    mockPaymentFindOne.mockResolvedValue(null);
    const res = await POST(makeRequest(paidOrder('NOT-EXIST')));
    expect(res.status).toBe(404);
  });

  // ── Idempotency ─────────────────────────────────────────────────────────

  it('returns 200 immediately when payment is already completed', async () => {
    mockPaymentFindOne.mockResolvedValue({ ...mockPayment, status: 'completed', save: vi.fn() });
    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(200);
    expect(mockCommissionCreate).not.toHaveBeenCalled();
  });

  // ── Failed payment ──────────────────────────────────────────────────────

  it('marks payment as failed when order_status is not CAPTURED', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    const body = { notification_type: 'ORDER_PAID', order: { order_invoice_number: 'RMX123', order_status: 'FAILED' } };
    await POST(makeRequest(body));
    expect(mockPayment.status).toBe('failed');
    expect(mockPayment.save).toHaveBeenCalled();
    expect(mockCommissionCreate).not.toHaveBeenCalled();
  });

  // ── Happy path: commission creation ─────────────────────────────────────

  it('creates a commission when a referred user makes their first payment', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'referred-user' });
    mockReferralFindOne.mockResolvedValue({ _id: 'ref-id', affiliateId: 'aff-id' });
    mockCommissionFindOne.mockResolvedValue(null);
    mockCommissionCreate.mockResolvedValue({});
    mockReferralUpdateOne.mockResolvedValue({});

    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(200);
    expect(mockCommissionCreate).toHaveBeenCalledWith(expect.objectContaining({
      affiliateId: 'aff-id',
      referralId: 'ref-id',
      grossAmount: 99000,
      commissionAmount: 49500,
      isFirstPayment: true,
    }));
  });

  it('commission is exactly 50% of the gross payment amount', async () => {
    mockPayment.amount = 990000; // yearly plan
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockResolvedValue({ _id: 'ref', affiliateId: 'aff' });
    mockCommissionFindOne.mockResolvedValue(null);
    mockCommissionCreate.mockResolvedValue({});
    mockReferralUpdateOne.mockResolvedValue({});

    await POST(makeRequest(paidOrder()));
    expect(mockCommissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ commissionAmount: 495000 })
    );
  });

  it('updates referral status to converted after creating commission', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockResolvedValue({ _id: 'ref-id', affiliateId: 'aff-id' });
    mockCommissionFindOne.mockResolvedValue(null);
    mockCommissionCreate.mockResolvedValue({});
    mockReferralUpdateOne.mockResolvedValue({});

    await POST(makeRequest(paidOrder()));
    expect(mockReferralUpdateOne).toHaveBeenCalledWith(
      { _id: 'ref-id' },
      expect.objectContaining({ status: 'converted' })
    );
  });

  // ── No referral / already commissioned ──────────────────────────────────

  it('skips commission when no referral exists for the user', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'organic-user' });
    mockReferralFindOne.mockResolvedValue(null);

    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(200);
    expect(mockCommissionCreate).not.toHaveBeenCalled();
  });

  it('skips commission when one already exists for the referral (idempotency)', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockResolvedValue({ _id: 'ref', affiliateId: 'aff' });
    mockCommissionFindOne.mockResolvedValue({ _id: 'existing-commission' });

    const res = await POST(makeRequest(paidOrder()));
    expect(res.status).toBe(200);
    expect(mockCommissionCreate).not.toHaveBeenCalled();
    expect(mockReferralUpdateOne).not.toHaveBeenCalled();
  });

  it('still returns 200 even when affiliate commission logic errors (best-effort)', async () => {
    mockPaymentFindOne.mockResolvedValue(mockPayment);
    mockUserFindByIdAndUpdate.mockResolvedValue({ descopeId: 'user' });
    mockReferralFindOne.mockRejectedValue(new Error('DB error')); // simulates failure

    const res = await POST(makeRequest(paidOrder()));
    // IPN must always return 200 so SePay doesn't retry — commission is best-effort
    expect(res.status).toBe(200);
  });
});

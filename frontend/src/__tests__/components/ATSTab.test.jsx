/**
 * ATSTab — redesigned ATS results panel
 *
 * Tests:
 * - No resume → prompt to upload
 * - No scores → empty state with CTA to analyze
 * - Has scores → score circle + 6 category bars
 * - First fix always visible; remaining fixes show locked overlay when access is limited
 * - Full access → remaining fixes visible, no overlay, unlocked CTA panel
 * - onTabChange called when "Viết lại CV ngay" clicked
 * - Working section shown when working[] non-empty
 * - Reanalyze button calls analyzeATS with force=true
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── mock lucide-react ─────────────────────────────────────────────────────────
vi.mock('lucide-react', () => ({
  Shield: (p) => <svg data-testid="icon-shield" {...p} />,
  RotateCcw: (p) => <svg data-testid="icon-rotate" {...p} />,
  ChevronRight: (p) => <svg data-testid="icon-chevron" {...p} />,
  CheckCircle: (p) => <svg data-testid="icon-check" {...p} />,
  Lock: (p) => <svg data-testid="icon-lock" {...p} />,
}));

// ── mock ui components ────────────────────────────────────────────────────────
vi.mock('@/components/ui/Button', () => ({
  default: ({ children, onClick, loading, disabled, 'data-testid': tid, ...rest }) => (
    <button onClick={onClick} disabled={loading || disabled} data-testid={tid} {...rest}>
      {children}
    </button>
  ),
}));
vi.mock('@/components/ui/Card', () => ({
  default: ({ children, 'data-testid': tid, className }) => (
    <div data-testid={tid} className={className}>{children}</div>
  ),
}));

// ── mock react-hot-toast ─────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: { loading: vi.fn(), dismiss: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// ── store mocks ───────────────────────────────────────────────────────────────
const mockAnalyzeATS = vi.fn();
const mockResumeStore = {
  analyzeATS: mockAnalyzeATS,
  scores: null,
  analysis: null,
  isAnalyzing: false,
};
vi.mock('@/store/useResumeStore', () => ({
  useResumeStore: (selector) => selector ? selector(mockResumeStore) : mockResumeStore,
}));

const mockAuthStore = {
  hasFullAccess:  vi.fn().mockReturnValue(false),
  isCvUnlocked:  vi.fn().mockReturnValue(false),
  getPaidCredits: vi.fn().mockReturnValue(0),
  hasActivePass:  vi.fn().mockReturnValue(false),
  unlockCv:       vi.fn().mockResolvedValue({ success: true }),
};
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector) => selector ? selector(mockAuthStore) : mockAuthStore,
}));

// ── fixtures ──────────────────────────────────────────────────────────────────
const RESUME = { _id: 'cv123', originalName: 'my-cv.pdf' };

const SCORES = {
  overall: 72,
  atsScore: 68,
  contentScore: 75,
  formatScore: 80,
  keywordScore: 65,
  readabilityScore: 70,
  fdiScore: 60,
};

const TOP_FIXES = [
  { title: 'Chỉ 1/26 bullet có số liệu', detail: 'Thêm %, VND, số lượng vào achievements' },
  { title: 'Thiếu từ khóa FDI', detail: 'Bổ sung: "SAP", "ISO 9001", "ERP"' },
  { title: 'Định dạng không chuẩn ATS', detail: 'Tránh bảng biểu và cột đôi' },
];

const WORKING = ['Format PDF chuẩn', 'Có thông tin liên hệ đầy đủ'];

const ATS_ISSUES = [
  { severity: 'high',   description: 'Thiếu số liệu định lượng', suggestion: 'Thêm % và số người' },
  { severity: 'medium', description: 'Dùng bảng trong CV',       suggestion: 'Chuyển sang bullet' },
  { severity: 'low',    description: 'Thiếu từ khóa Docker',     suggestion: 'Thêm vào skills' },
];

const CATEGORIES = [
  'contentScore', 'atsScore', 'keywordScore', 'formatScore', 'readabilityScore', 'fdiScore',
];

// ── helpers ───────────────────────────────────────────────────────────────────
import ATSTab from '@/app/dashboard/tabs/ATSTab';

function renderATSTab(props = {}) {
  return render(<ATSTab resume={RESUME} onTabChange={vi.fn()} {...props} />);
}

function setStoreState(overrides) {
  Object.assign(mockResumeStore, {
    analyzeATS: mockAnalyzeATS,
    scores: null,
    analysis: null,
    isAnalyzing: false,
    ...overrides,
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  setStoreState({});
  mockAnalyzeATS.mockResolvedValue({ success: true });
  mockAuthStore.hasFullAccess.mockReturnValue(false);
});

describe('ATSTab — no resume', () => {
  it('shows prompt to upload CV when resume is null', () => {
    renderATSTab({ resume: null });
    expect(screen.getByText(/Vui lòng tải lên CV/i)).toBeInTheDocument();
  });
});

describe('ATSTab — empty state (no scores)', () => {
  it('shows empty state card with "Bắt đầu kiểm tra" button', () => {
    renderATSTab();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Bắt đầu kiểm tra/i)).toBeInTheDocument();
  });

  it('calls analyzeATS when "Bắt đầu kiểm tra" clicked', async () => {
    renderATSTab();
    fireEvent.click(screen.getByText(/Bắt đầu kiểm tra/i));
    await waitFor(() => {
      expect(mockAnalyzeATS).toHaveBeenCalledWith('cv123', null, false);
    });
  });
});

describe('ATSTab — results state (locked)', () => {
  beforeEach(() => {
    setStoreState({
      scores: SCORES,
      analysis: { topFixes: TOP_FIXES, working: WORKING },
    });
    mockAuthStore.hasFullAccess.mockReturnValue(false);
  });

  it('renders ats-results container', () => {
    renderATSTab();
    expect(screen.getByTestId('ats-results')).toBeInTheDocument();
  });

  it('shows overall score prominently', () => {
    renderATSTab();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('renders 6 category rows', () => {
    renderATSTab();
    const bars = screen.getAllByTestId('category-bar');
    expect(bars).toHaveLength(6);
  });

  it('shows all category labels (updated names)', () => {
    renderATSTab();
    expect(screen.getByText('Chất lượng nội dung')).toBeInTheDocument();
    expect(screen.getByText('Từ khóa')).toBeInTheDocument();
    expect(screen.getByText('Định dạng')).toBeInTheDocument();
    expect(screen.getByText('Dễ đọc')).toBeInTheDocument();
    expect(screen.getByText('FDI Ready')).toBeInTheDocument();
    expect(screen.getByText('ATS & cấu trúc')).toBeInTheDocument();
  });

  it('renders reanalyze button', () => {
    renderATSTab();
    expect(screen.getByTestId('reanalyze-btn')).toBeInTheDocument();
  });

  it('calls analyzeATS with force=true on reanalyze click', async () => {
    renderATSTab();
    fireEvent.click(screen.getByTestId('reanalyze-btn'));
    await waitFor(() => {
      expect(mockAnalyzeATS).toHaveBeenCalledWith('cv123', null, true);
    });
  });
});

describe('ATSTab — results state (unlocked)', () => {
  beforeEach(() => {
    setStoreState({
      scores: SCORES,
      analysis: { topFixes: TOP_FIXES, working: WORKING },
    });
    mockAuthStore.hasFullAccess.mockReturnValue(true);
  });

  it('shows score circle', () => {
    renderATSTab();
    expect(screen.getByTestId('score-circle')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('renders 6 category bars with progress', () => {
    renderATSTab();
    const bars = screen.getAllByTestId('category-bar');
    expect(bars).toHaveLength(6);
  });
});

describe('ATSTab — top fixes (locked user)', () => {
  beforeEach(() => {
    setStoreState({
      scores: SCORES,
      analysis: { topFixes: TOP_FIXES, working: [] },
    });
    mockAuthStore.hasFullAccess.mockReturnValue(false);
  });

  it('shows top-fixes section', () => {
    renderATSTab();
    expect(screen.getByTestId('top-fixes')).toBeInTheDocument();
  });

  it('ALL fixes appear as locked — none are visible', () => {
    renderATSTab();
    const locked = screen.getAllByTestId('fix-locked');
    expect(locked.length).toBe(TOP_FIXES.length);
    expect(screen.queryByTestId('fix-visible')).not.toBeInTheDocument();
  });

  it('blur overlay visible when locked', () => {
    renderATSTab();
    expect(screen.getByTestId('fixes-blur-overlay')).toBeInTheDocument();
  });

  it('shows lock icons', () => {
    renderATSTab();
    expect(screen.getAllByTestId('icon-lock').length).toBeGreaterThan(0);
  });

  it('shows fix count in overlay text', () => {
    renderATSTab();
    // count appears in both hero and overlay — just verify at least one renders
    expect(screen.getAllByText(/3 lỗi/i).length).toBeGreaterThan(0);
  });

  it('locked view shows category score rows', () => {
    renderATSTab();
    const bars = screen.getAllByTestId('category-bar');
    expect(bars).toHaveLength(CATEGORIES.length);
  });

  it('locked view shows overall score prominently', () => {
    renderATSTab();
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('"Mở khóa" button links to /payment (not onTabChange)', () => {
    renderATSTab();
    const cta = screen.getByTestId('cta-rewrite');
    expect(cta.closest('a')).toHaveAttribute('href', '/payment');
  });
});

describe('ATSTab — top fixes (unlocked user)', () => {
  beforeEach(() => {
    setStoreState({
      scores: SCORES,
      analysis: { topFixes: TOP_FIXES, working: [], atsIssues: ATS_ISSUES },
    });
    mockAuthStore.hasFullAccess.mockReturnValue(true);
  });

  it('all fixes are visible (no locked testid)', () => {
    renderATSTab();
    const locked = screen.queryAllByTestId('fix-locked');
    expect(locked).toHaveLength(0);
    const visible = screen.getAllByTestId('fix-visible');
    expect(visible.length).toBe(ATS_ISSUES.length);
  });

  it('no blur overlay when unlocked', () => {
    renderATSTab();
    expect(screen.queryByTestId('fixes-blur-overlay')).not.toBeInTheDocument();
  });

  it('shows unlocked CTA panel', () => {
    renderATSTab();
    expect(screen.getByTestId('cta-unlocked')).toBeInTheDocument();
  });

  it('"Viết lại CV ngay" in unlocked CTA calls onTabChange("rewrite")', () => {
    const onTabChange = vi.fn();
    render(<ATSTab resume={RESUME} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByTestId('cta-rewrite-unlocked'));
    expect(onTabChange).toHaveBeenCalledWith('rewrite');
  });
});

describe('ATSTab — working section (unlocked only)', () => {
  beforeEach(() => {
    mockAuthStore.hasFullAccess.mockReturnValue(true);
  });

  it('shows working section when working[] is non-empty', () => {
    setStoreState({
      scores: SCORES,
      analysis: { topFixes: TOP_FIXES, working: WORKING },
    });
    renderATSTab();
    expect(screen.getByTestId('working-section')).toBeInTheDocument();
    expect(screen.getByText('Format PDF chuẩn')).toBeInTheDocument();
    expect(screen.getByText('Có thông tin liên hệ đầy đủ')).toBeInTheDocument();
  });

  it('hides working section when working[] is empty', () => {
    setStoreState({
      scores: SCORES,
      analysis: { topFixes: TOP_FIXES, working: [] },
    });
    renderATSTab();
    expect(screen.queryByTestId('working-section')).not.toBeInTheDocument();
  });
});

describe('ATSTab — score thresholds (unlocked — ScoreCircle label)', () => {
  beforeEach(() => {
    mockAuthStore.hasFullAccess.mockReturnValue(true);
  });

  it('shows "Tốt" label for score >= 80', () => {
    setStoreState({ scores: { ...SCORES, overall: 85 }, analysis: null });
    renderATSTab();
    expect(screen.getAllByText('Tốt').length).toBeGreaterThan(0);
  });

  it('shows "Cần cải thiện" for score 60–79', () => {
    setStoreState({ scores: { ...SCORES, overall: 65 }, analysis: null });
    renderATSTab();
    expect(screen.getAllByText('Cần cải thiện').length).toBeGreaterThan(0);
  });

  it('shows "Yếu" for score < 60', () => {
    setStoreState({ scores: { ...SCORES, overall: 40 }, analysis: null });
    renderATSTab();
    expect(screen.getAllByText('Yếu').length).toBeGreaterThan(0);
  });
});

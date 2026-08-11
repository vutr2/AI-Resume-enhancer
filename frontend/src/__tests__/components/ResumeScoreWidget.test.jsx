/**
 * ResumeScoreWidget — landing page public score widget
 *
 * Tests:
 * - Renders upload dropzone in idle state
 * - Shows loading state while analyzing
 * - Shows score circle and category bars on success
 * - Shows error message on API failure
 * - Saves result to sessionStorage
 * - Restores from sessionStorage on mount
 * - CTA links to /register
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ResumeScoreWidget from '@/components/landing/ResumeScoreWidget';

// ── mock next/link ────────────────────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

// ── mock fetch ────────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

const MOCK_RESULT = {
  success: true,
  data: {
    scores: {
      overall: 72, atsScore: 68, contentScore: 75,
      formatScore: 80, keywordScore: 65, fdiScore: 60,
    },
    topFixes: [
      { title: 'Chỉ 1/26 bullet có số liệu', detail: 'Thêm %, VND vào achievements' },
      { title: 'Thiếu từ khóa FDI', detail: 'Bổ sung: SAP, ERP, ISO 9001' },
    ],
    working: ['Format PDF chuẩn', 'Thông tin liên hệ đầy đủ'],
  },
};

function okResponse(body = MOCK_RESULT) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function errResponse(body, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

function makeFile(name = 'cv.pdf', type = 'application/pdf') {
  return new File(['dummy content'], name, { type });
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  mockFetch.mockReset();
});

afterEach(() => {
  sessionStorage.clear();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ResumeScoreWidget — idle state', () => {
  it('renders upload dropzone', () => {
    render(<ResumeScoreWidget />);
    expect(screen.getByText(/Thả CV vào đây/i)).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('accepts only pdf/doc/docx file types', () => {
    render(<ResumeScoreWidget />);
    const input = screen.getByTestId('file-input');
    expect(input.accept).toBe('.pdf,.doc,.docx');
  });
});

describe('ResumeScoreWidget — loading state', () => {
  it('shows spinner while fetching', async () => {
    // Never resolve so we stay in loading state
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    expect(screen.getByText(/Đang phân tích CV/i)).toBeInTheDocument();
  });
});

describe('ResumeScoreWidget — result state', () => {
  it('shows overall score after successful analysis', async () => {
    mockFetch.mockReturnValue(okResponse());
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByText('72')).toBeInTheDocument();
    });
  });

  it('shows all category labels', async () => {
    mockFetch.mockReturnValue(okResponse());
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByText('ATS Score')).toBeInTheDocument();
      expect(screen.getByText('Nội dung')).toBeInTheDocument();
      expect(screen.getByText('Định dạng')).toBeInTheDocument();
      expect(screen.getByText('Từ khóa')).toBeInTheDocument();
      expect(screen.getByText('FDI Ready')).toBeInTheDocument();
    });
  });

  it('shows fix-01 title and detail', async () => {
    mockFetch.mockReturnValue(okResponse());
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('fix-01')).toBeInTheDocument();
      expect(screen.getByText('Chỉ 1/26 bullet có số liệu')).toBeInTheDocument();
    });
  });

  it('renders CTA link to /register', async () => {
    mockFetch.mockReturnValue(okResponse());
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    await waitFor(() => {
      const cta = screen.getByTestId('cta-register');
      expect(cta).toHaveAttribute('href', '/register');
    });
  });

  it('saves result to sessionStorage', async () => {
    mockFetch.mockReturnValue(okResponse());
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile('my-cv.pdf')] } });
    });

    await waitFor(() => {
      const saved = JSON.parse(sessionStorage.getItem('dauviec_public_score'));
      expect(saved).not.toBeNull();
      expect(saved.scores.overall).toBe(72);
      expect(saved.fileName).toBe('my-cv.pdf');
    });
  });

  it('shows file name in header', async () => {
    mockFetch.mockReturnValue(okResponse());
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile('my-resume.pdf')] } });
    });

    await waitFor(() => {
      expect(screen.getByText('my-resume.pdf')).toBeInTheDocument();
    });
  });
});

describe('ResumeScoreWidget — sessionStorage restore', () => {
  it('restores previous result from sessionStorage on mount', async () => {
    const saved = {
      scores: { overall: 85, atsScore: 80, contentScore: 90, formatScore: 88, keywordScore: 75, fdiScore: 70 },
      topFixes: [
        { title: 'Fix 1 title', detail: 'Fix 1 detail' },
        { title: 'Fix 2 title', detail: 'Fix 2 detail' },
      ],
      working: [],
      fileName: 'cached-cv.pdf',
    };
    sessionStorage.setItem('dauviec_public_score', JSON.stringify(saved));

    render(<ResumeScoreWidget />);

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('cached-cv.pdf')).toBeInTheDocument();
    });
    // fetch should NOT be called
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('ResumeScoreWidget — error state', () => {
  it('shows error message when API returns error', async () => {
    mockFetch.mockReturnValue(
      errResponse({ success: false, message: 'Chỉ hỗ trợ file PDF, DOC, DOCX' })
    );
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-msg')).toHaveTextContent(/PDF|DOC/i);
    });
  });

  it('shows generic error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-msg')).toHaveTextContent(/kết nối/i);
    });
  });
});

describe('ResumeScoreWidget — reset', () => {
  it('"Kiểm tra lại" resets to idle and clears sessionStorage', async () => {
    mockFetch.mockReturnValue(okResponse());
    render(<ResumeScoreWidget />);

    const input = screen.getByTestId('file-input');
    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    await waitFor(() => screen.getByText('Kiểm tra lại'));

    await act(async () => {
      fireEvent.click(screen.getByText('Kiểm tra lại'));
    });

    expect(screen.getByText(/Thả CV vào đây/i)).toBeInTheDocument();
    expect(sessionStorage.getItem('dauviec_public_score')).toBeNull();
  });
});

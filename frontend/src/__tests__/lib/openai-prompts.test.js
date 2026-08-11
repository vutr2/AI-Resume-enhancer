/**
 * openai.js — system prompt content tests
 *
 * Verifies that the new FDI-related prompts contain the required instructions.
 * These are smoke tests — if a prompt is accidentally wiped or truncated,
 * tests catch it before deploy.
 */
import { describe, it, expect, vi } from 'vitest';

// Anthropic SDK instantiates at module level — mock it so jsdom doesn't throw
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { constructor() {} messages = { create: vi.fn() } },
}));

import { SYSTEM_PROMPTS } from '@/lib/openai';

describe('SYSTEM_PROMPTS.rewriteFDIEnglish', () => {
  it('exists', () => {
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toBeTruthy();
  });

  it('instructs to write in business English, not translate', () => {
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/business English/i);
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/NEVER translate word-by-word/i);
  });

  it('requires action verbs on bullet points', () => {
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/action verb/i);
  });

  it('requires ATS-safe single-column format', () => {
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/single column/i);
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/ATS/i);
  });

  it('specifies correct section order', () => {
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/PERSONAL INFORMATION/);
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/WORK EXPERIENCE/);
  });

  it('returns JSON with rewrittenContent and fdiTips fields', () => {
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/rewrittenContent/);
    expect(SYSTEM_PROMPTS.rewriteFDIEnglish).toMatch(/fdiTips/);
  });
});

describe('SYSTEM_PROMPTS.analyzeResume', () => {
  it('includes fdiScore in scores schema', () => {
    expect(SYSTEM_PROMPTS.analyzeResume).toMatch(/fdiScore/);
  });

  it('includes fdiReadiness object', () => {
    expect(SYSTEM_PROMPTS.analyzeResume).toMatch(/fdiReadiness/);
  });

  it('explains fdiScore calculation criteria', () => {
    expect(SYSTEM_PROMPTS.analyzeResume).toMatch(/englishQuality/);
    expect(SYSTEM_PROMPTS.analyzeResume).toMatch(/hasQuantifiedAchievements/);
  });
});

describe('SYSTEM_PROMPTS.generateCoverLetter', () => {
  it('handles korean-fdi tone', () => {
    expect(SYSTEM_PROMPTS.generateCoverLetter).toMatch(/korean-fdi/);
  });

  it('handles japanese-fdi tone', () => {
    expect(SYSTEM_PROMPTS.generateCoverLetter).toMatch(/japanese-fdi/);
  });

  it('handles western-fdi tone', () => {
    expect(SYSTEM_PROMPTS.generateCoverLetter).toMatch(/western-fdi/);
  });
});

describe('SYSTEM_PROMPTS.matchJob', () => {
  it('instructs bilingual output (Vietnamese comments, English keywords)', () => {
    expect(SYSTEM_PROMPTS.matchJob).toMatch(/tiếng Việt/);
    expect(SYSTEM_PROMPTS.matchJob).toMatch(/tiếng Anh/);
  });
});

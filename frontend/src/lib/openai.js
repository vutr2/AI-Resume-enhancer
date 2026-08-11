import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default anthropic;

// System prompts for different AI tasks
export const SYSTEM_PROMPTS = {
  parseResume: `Bạn là chuyên gia phân tích CV. Nhiệm vụ của bạn là trích xuất thông tin từ CV và trả về dưới dạng JSON với cấu trúc sau:
{
  "personalInfo": {
    "name": "Họ tên đầy đủ",
    "email": "email@example.com",
    "phone": "Số điện thoại",
    "address": "Địa chỉ",
    "linkedin": "LinkedIn URL",
    "github": "GitHub URL",
    "website": "Website cá nhân"
  },
  "summary": "Tóm tắt bản thân",
  "experience": [
    {
      "company": "Tên công ty",
      "position": "Vị trí",
      "location": "Địa điểm",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY hoặc 'Hiện tại'",
      "current": true/false,
      "description": "Mô tả công việc",
      "achievements": ["Thành tích 1", "Thành tích 2"]
    }
  ],
  "education": [
    {
      "institution": "Tên trường",
      "degree": "Bằng cấp",
      "field": "Ngành học",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "gpa": "Điểm GPA",
      "achievements": ["Thành tích học tập"]
    }
  ],
  "skills": {
    "technical": ["Kỹ năng chuyên môn"],
    "soft": ["Kỹ năng mềm"],
    "languages": [{"name": "Tiếng Anh", "level": "Thành thạo"}],
    "certifications": [{"name": "Chứng chỉ", "issuer": "Đơn vị cấp", "date": "YYYY"}]
  },
  "projects": [
    {
      "name": "Tên dự án",
      "description": "Mô tả",
      "technologies": ["Tech 1", "Tech 2"],
      "url": "URL"
    }
  ],
  "awards": [
    {
      "title": "Giải thưởng",
      "issuer": "Đơn vị trao",
      "date": "YYYY",
      "description": "Mô tả"
    }
  ]
}

Chỉ trả về JSON, không có text khác. Nếu không tìm thấy thông tin nào, để trống hoặc mảng rỗng.`,

  scorePublic: `Bạn là chuyên gia ATS. Chấm điểm CV và trả về JSON ngắn gọn:
{
  "scores": {
    "overall": 0-100,
    "atsScore": 0-100,
    "contentScore": 0-100,
    "formatScore": 0-100,
    "keywordScore": 0-100,
    "fdiScore": 0-100
  },
  "topFixes": [
    {
      "title": "Tiêu đề ngắn (tối đa 8 từ)",
      "detail": "1 câu ngắn gọn, tối đa 15 từ, có số cụ thể. Ví dụ: 'Chỉ 2/15 bullet có số liệu. Thêm %, số người, thời gian.'"
    }
  ],
  "working": ["Điểm tốt 1 (dưới 6 từ)", "Điểm tốt 2 (dưới 6 từ)"]
}
QUAN TRỌNG:
- topFixes: đúng 2 mục, mỗi detail KHÔNG ĐƯỢC quá 20 từ — đếm số thực tế từ CV rồi viết ngắn gọn
- working: đúng 2 mục ngắn
- Chỉ trả về JSON, không thêm text nào khác`,

  analyzeResume: `Bạn là chuyên gia ATS. Phân tích CV và trả về JSON (mỗi string tối đa 15 từ):
{
  "scores": {
    "overall": 0-100,
    "atsScore": 0-100,
    "contentScore": 0-100,
    "formatScore": 0-100,
    "keywordScore": 0-100,
    "readabilityScore": 0-100,
    "fdiScore": 0-100
  },
  "fdiReadiness": {
    "englishQuality": "poor/fair/good/excellent",
    "hasQuantifiedAchievements": true,
    "formatIsAtsClean": true,
    "hasFdiKeywords": true,
    "summary": "Tối đa 8 từ"
  },
  "strengths": ["Tối đa 6 từ", "Tối đa 6 từ"],
  "weaknesses": ["Tối đa 6 từ", "Tối đa 6 từ"],
  "suggestions": ["Tối đa 8 từ", "Tối đa 8 từ"],
  "keywords": {
    "found": ["keyword1", "keyword2", "keyword3"],
    "missing": ["keyword1", "keyword2", "keyword3"],
    "recommended": ["keyword1", "keyword2"]
  },
  "topFixes": [
    { "title": "Tối đa 5 từ", "detail": "1 câu có số thực tế, tối đa 12 từ.", "priority": 1 },
    { "title": "Tối đa 5 từ", "detail": "1 câu có số thực tế, tối đa 12 từ.", "priority": 2 },
    { "title": "Tối đa 5 từ", "detail": "1 câu có số thực tế, tối đa 12 từ.", "priority": 3 }
  ],
  "working": ["Tối đa 5 từ", "Tối đa 5 từ"],
  "atsIssues": [
    { "type": "content", "severity": "high", "description": "Mô tả lỗi cụ thể, tối đa 12 từ", "suggestion": "Cách sửa, tối đa 10 từ" },
    { "type": "format", "severity": "medium", "description": "Tối đa 12 từ", "suggestion": "Tối đa 10 từ" },
    { "type": "keyword", "severity": "high", "description": "Tối đa 12 từ", "suggestion": "Tối đa 10 từ" },
    { "type": "content", "severity": "medium", "description": "Tối đa 12 từ", "suggestion": "Tối đa 10 từ" },
    { "type": "format", "severity": "low", "description": "Tối đa 12 từ", "suggestion": "Tối đa 10 từ" }
  ]
}
QUAN TRỌNG: atsIssues trả về TẤT CẢ lỗi tìm thấy (5–8 mục), topFixes đúng 3 mục ưu tiên cao nhất có số cụ thể. Chỉ trả về JSON.`,

  rewriteContent: `Bạn là chuyên gia viết CV chuyên nghiệp. Viết lại CV thành văn bản hoàn chỉnh, chuyên nghiệp, sẵn sàng in ấn.

YÊU CẦU FORMAT:
1. Tên đầy đủ IN HOA ở đầu
2. Thông tin liên hệ (email, phone, địa chỉ) trên 1 dòng, cách nhau bằng |
3. Mỗi section có tiêu đề IN HOA (VD: PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS, AWARDS)
4. Experience: Tên công ty - Vị trí - Thời gian, mô tả và achievements dạng bullet points
5. Skills: Liệt kê gọn gàng theo nhóm
6. Sử dụng động từ hành động mạnh mẽ (Led, Achieved, Developed, Implemented...)
7. Lượng hóa thành tích với số liệu cụ thể
8. Tối ưu cho ATS với từ khóa phù hợp

Trả về JSON:
{
  "rewrittenContent": "Nội dung CV đã format đẹp dạng plain text, có xuống dòng và bullet points",
  "changes": ["Thay đổi 1", "Thay đổi 2"],
  "improvements": ["Cải thiện 1", "Cải thiện 2"]
}

LƯU Ý: rewrittenContent phải là văn bản CV hoàn chỉnh, KHÔNG phải JSON. Phải có format rõ ràng với sections, bullet points (•), và xuống dòng (\\n).`,

  rewriteFDIEnglish: `You are an expert CV writer specializing in English CVs for FDI companies (Samsung, LG, Foxconn, Canon, Amkor, Goertek) operating in Vietnam.

RULES — follow strictly:
1. Write in professional business English. NEVER translate word-by-word from Vietnamese. Rewrite naturally.
2. Every bullet point must start with a strong action verb (Led, Implemented, Achieved, Reduced, Increased, Managed, Developed, Ensured, Coordinated, Monitored...).
3. Quantify achievements wherever possible (%, VND amounts converted to USD, headcount, time saved, defect rates).
4. Format: single column, no icons, no colors, no tables — pure ATS-safe plain text.
5. Section order: PERSONAL INFORMATION → OBJECTIVE → EDUCATION → WORK EXPERIENCE → SKILLS → CERTIFICATIONS
6. Objective section (2-3 sentences): highlight discipline, process adherence, teamwork, ability to work under pressure, willingness to work shifts/OT if mentioned.
7. Skills section: separate Technical Skills from Soft Skills. Include language proficiency (e.g., "English: Intermediate (B1)").
8. Keep CV to 1 page for candidates with < 3 years experience, max 2 pages otherwise.
9. Do NOT invent experience or numbers. If no data is provided for a bullet, write the responsibility clearly without fake numbers.

Return JSON:
{
  "rewrittenContent": "Complete CV in plain text with \\n line breaks and • bullet points",
  "changes": ["Change 1 in Vietnamese", "Change 2 in Vietnamese"],
  "improvements": ["Improvement 1 in Vietnamese", "Improvement 2 in Vietnamese"],
  "fdiTips": ["FDI-specific tip 1 in Vietnamese", "FDI-specific tip 2 in Vietnamese"]
}

rewrittenContent must be the full CV text, NOT JSON inside JSON.`,

  generateCoverLetter: `Bạn là chuyên gia viết thư ứng tuyển. Tạo thư ứng tuyển chuyên nghiệp với:
1. Mở đầu hấp dẫn, nêu rõ vị trí ứng tuyển
2. Thân bài: liên kết kinh nghiệm với yêu cầu công việc
3. Kết thúc: thể hiện sự nhiệt tình và kêu gọi hành động
4. Độ dài 300-400 từ

Nếu tone là "korean-fdi": viết bằng tiếng Anh, nhấn mạnh kỷ luật, tinh thần đồng đội, sẵn sàng làm việc áp lực cao và OT, trung thành với tổ chức, tránh quá cá nhân.
Nếu tone là "japanese-fdi": viết bằng tiếng Anh, nhấn mạnh sự tỉ mỉ, cải tiến liên tục (kaizen), tôn trọng quy trình, khiêm tốn, cam kết dài hạn.
Nếu tone là "western-fdi": viết bằng tiếng Anh, thể hiện tư duy độc lập, thành tích cá nhân, sáng tạo, trực tiếp và tự tin.
Các tone khác: viết bằng tiếng Việt, giọng chuyên nghiệp nhưng thân thiện.

Trả về JSON:
{
  "coverLetter": "Nội dung thư ứng tuyển",
  "keyPoints": ["Điểm nhấn 1", "Điểm nhấn 2"]
}`,

  matchJob: `Bạn là chuyên gia tuyển dụng. Đánh giá mức độ phù hợp giữa CV và mô tả công việc.

Trả về JSON (nhận xét bằng tiếng Việt, từ khóa kỹ thuật/chuyên ngành giữ nguyên tiếng Anh):
{
  "matchScore": 0-100,
  "matchedSkills": ["English keyword 1", "English keyword 2"],
  "missingSkills": ["English keyword còn thiếu"],
  "matchedExperience": ["Kinh nghiệm phù hợp (mô tả tiếng Việt)"],
  "gaps": ["Khoảng cách cần bù đắp (tiếng Việt)"],
  "recommendations": ["Gợi ý cụ thể để tăng độ phù hợp (tiếng Việt)"],
  "interviewTips": ["Mẹo phỏng vấn cho vị trí này (tiếng Việt)"]
}`,
};

// Helper function to call Claude API
export async function callOpenAI(systemPrompt, userContent, options = {}) {
  const { model = 'claude-sonnet-4-5', temperature = 0.7, maxTokens = 4000 } = options;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt + '\n\nIMPORTANT: Luôn trả về kết quả dưới dạng JSON object hợp lệ. Không thêm text nào ngoài JSON.',
      messages: [
        { role: 'user', content: userContent },
      ],
    });

    const content = response.content[0]?.text;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Try to extract JSON from response
    // First try to find JSON block with ```json or ```
    let jsonString = content;

    // Remove markdown code blocks if present
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    // Try to find JSON object
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON found, throw error to let caller handle it
      console.error('No JSON found in AI response:', content.substring(0, 500));
      throw new Error('AI không trả về định dạng JSON hợp lệ');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError?.message, 'Content:', jsonMatch[0].substring(0, 500));
      throw new Error('AI trả về JSON không hợp lệ');
    }
  } catch (error) {
    // Sanitize error — Anthropic SDK error objects can have cyclic references
    const message = error?.message || String(error);
    const status = error?.status ?? error?.statusCode ?? null;
    console.error('Claude API error:', status ? `[${status}] ${message}` : message);
    throw new Error(message);
  }
}

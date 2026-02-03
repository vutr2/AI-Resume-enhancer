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

  analyzeResume: `Bạn là chuyên gia tuyển dụng và ATS (Applicant Tracking System). Phân tích CV và trả về JSON với cấu trúc:
{
  "scores": {
    "overall": 0-100,
    "atsScore": 0-100,
    "contentScore": 0-100,
    "formatScore": 0-100,
    "keywordScore": 0-100,
    "readabilityScore": 0-100
  },
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "suggestions": ["Gợi ý cải thiện 1", "Gợi ý cải thiện 2"],
  "keywords": {
    "found": ["Từ khóa tìm thấy"],
    "missing": ["Từ khóa còn thiếu"],
    "recommended": ["Từ khóa nên thêm"]
  },
  "atsIssues": [
    {
      "type": "format/content/keyword",
      "severity": "low/medium/high",
      "description": "Mô tả vấn đề",
      "suggestion": "Cách khắc phục"
    }
  ]
}

Đánh giá khách quan, chi tiết và đưa ra gợi ý cụ thể để cải thiện CV.`,

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

  generateCoverLetter: `Bạn là chuyên gia viết thư ứng tuyển. Tạo thư ứng tuyển chuyên nghiệp bằng tiếng Việt với:
1. Mở đầu hấp dẫn, nêu rõ vị trí ứng tuyển
2. Thân bài: liên kết kinh nghiệm với yêu cầu công việc
3. Kết thúc: thể hiện sự nhiệt tình và kêu gọi hành động
4. Giọng điệu chuyên nghiệp nhưng thân thiện
5. Độ dài 300-400 từ

Trả về JSON:
{
  "coverLetter": "Nội dung thư ứng tuyển",
  "keyPoints": ["Điểm nhấn 1", "Điểm nhấn 2"]
}`,

  matchJob: `Bạn là chuyên gia tuyển dụng. Đánh giá mức độ phù hợp giữa CV và mô tả công việc.

Trả về JSON:
{
  "matchScore": 0-100,
  "matchedSkills": ["Kỹ năng phù hợp"],
  "missingSkills": ["Kỹ năng còn thiếu"],
  "matchedExperience": ["Kinh nghiệm phù hợp"],
  "gaps": ["Khoảng cách cần bù đắp"],
  "recommendations": ["Gợi ý để tăng độ phù hợp"],
  "interviewTips": ["Mẹo phỏng vấn cho vị trí này"]
}`,
};

// Helper function to call Claude API
export async function callOpenAI(systemPrompt, userContent, options = {}) {
  const { model = 'claude-sonnet-4-20250514', temperature = 0.7, maxTokens = 4000 } = options;

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
      console.error('JSON parse error:', parseError, 'Content:', jsonMatch[0].substring(0, 500));
      throw new Error('AI trả về JSON không hợp lệ');
    }
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

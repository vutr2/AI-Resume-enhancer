export const PACKAGES = {
  credit_1: {
    id: 'credit_1',
    label: '1 lượt mở khoá',
    description: 'Mở khoá đầy đủ 1 CV — viết lại, so khớp JD, thư ứng tuyển',
    price: 10000,
    credits: 1,
    freeCreditsBonus: 1, // +1 lượt phân tích ATS
    passDays: 0,
  },
  credit_3: {
    id: 'credit_3',
    label: '3 lượt mở khoá',
    description: '3 lượt mở khoá — mỗi lượt cho 1 CV',
    price: 25000,
    credits: 3,
    freeCreditsBonus: 3, // +3 lượt phân tích ATS
    passDays: 0,
    popular: true,
    savings: '17%',
  },
  week_pass: {
    id: 'week_pass',
    label: 'Pass 7 ngày',
    description: 'Không giới hạn mọi tính năng AI trong 7 ngày',
    price: 99000,
    credits: 0,
    freeCreditsBonus: 0, // pass 7 ngày = không giới hạn (bypass credit check)
    passDays: 7,
  },
};

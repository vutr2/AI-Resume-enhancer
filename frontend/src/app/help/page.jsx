'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Target,
  Shield,
  Mail,
  PenTool,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  MessageCircle,
  Book,
  HelpCircle,
  Zap,
  Headphones,
  Send,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// FAQ Data
const faqCategories = [
  {
    id: 'general',
    title: 'Câu hỏi chung',
    icon: HelpCircle,
    questions: [
      {
        q: 'ResuMax VN là gì?',
        a: 'ResuMax VN là nền tảng tối ưu hóa CV bằng AI hàng đầu Việt Nam. Chúng tôi giúp bạn tạo CV chuyên nghiệp, tối ưu cho hệ thống ATS, và tăng cơ hội được nhà tuyển dụng chú ý.',
      },
      {
        q: 'ATS là gì và tại sao cần tối ưu CV cho ATS?',
        a: 'ATS (Applicant Tracking System) là hệ thống quản lý ứng viên mà hơn 90% công ty lớn sử dụng để lọc CV. Nếu CV của bạn không được tối ưu cho ATS, nó có thể bị loại trước khi đến tay nhà tuyển dụng. ResuMax VN giúp bạn kiểm tra và tối ưu CV để vượt qua vòng lọc này.',
      },
      {
        q: 'Có miễn phí không?',
        a: 'Có! ResuMax VN cung cấp gói miễn phí cho phép bạn phân tích 3 CV mỗi tháng. Để sử dụng không giới hạn và các tính năng nâng cao, bạn có thể nâng cấp lên gói Pro hoặc Premium.',
      },
      {
        q: 'Dữ liệu CV của tôi có được bảo mật không?',
        a: 'Tuyệt đối! Chúng tôi sử dụng mã hóa SSL/TLS và tuân thủ các tiêu chuẩn bảo mật cao nhất. Dữ liệu CV của bạn không bao giờ được chia sẻ với bên thứ ba và bạn có toàn quyền kiểm soát dữ liệu của mình.',
      },
    ],
  },
  {
    id: 'upload',
    title: 'Tải lên CV',
    icon: Upload,
    questions: [
      {
        q: 'Định dạng file nào được hỗ trợ?',
        a: 'ResuMax VN hỗ trợ các định dạng: PDF và DOCX. Chúng tôi khuyến nghị sử dụng PDF để đảm bảo định dạng không bị thay đổi.',
      },
      {
        q: 'Kích thước file tối đa là bao nhiêu?',
        a: 'Kích thước file tối đa được phép là 10MB. Nếu file của bạn lớn hơn, hãy thử nén hoặc giảm chất lượng hình ảnh trong CV.',
      },
      {
        q: 'Tại sao CV của tôi không được phân tích?',
        a: 'Có thể do: (1) File bị hỏng hoặc không đọc được, (2) CV chứa quá nhiều hình ảnh thay vì text, (3) Định dạng không được hỗ trợ. Hãy thử tải lên file PDF với nội dung text rõ ràng.',
      },
    ],
  },
  {
    id: 'ats',
    title: 'Kiểm tra ATS',
    icon: Shield,
    questions: [
      {
        q: 'Điểm ATS được tính như thế nào?',
        a: 'Điểm ATS được tính dựa trên nhiều yếu tố: định dạng CV, từ khóa, cấu trúc, khả năng đọc bởi máy, và độ phù hợp với các tiêu chuẩn ATS phổ biến. Điểm từ 0-100, trong đó trên 70 được coi là tốt.',
      },
      {
        q: 'Làm sao để cải thiện điểm ATS?',
        a: 'Một số cách: (1) Sử dụng định dạng đơn giản, không có bảng phức tạp, (2) Thêm từ khóa phù hợp với ngành nghề, (3) Sử dụng font chuẩn, (4) Tránh header/footer, (5) Đặt tên file rõ ràng.',
      },
      {
        q: 'Điểm ATS cao nhất có thể đạt được là bao nhiêu?',
        a: 'Điểm tối đa là 100. Tuy nhiên, điểm từ 80 trở lên đã được coi là xuất sắc và có khả năng cao vượt qua hầu hết các hệ thống ATS.',
      },
    ],
  },
  {
    id: 'match',
    title: 'So khớp JD',
    icon: Target,
    questions: [
      {
        q: 'Tính năng so khớp JD hoạt động như thế nào?',
        a: 'Bạn dán mô tả công việc (JD) vào, AI sẽ phân tích và so sánh với CV của bạn. Hệ thống sẽ chỉ ra những kỹ năng/từ khóa còn thiếu và đề xuất cách bổ sung.',
      },
      {
        q: 'Độ khớp bao nhiêu phần trăm là đủ?',
        a: 'Độ khớp từ 70% trở lên được coi là tốt. Tuy nhiên, điều quan trọng là đảm bảo các kỹ năng "must-have" trong JD đều có trong CV của bạn.',
      },
    ],
  },
  {
    id: 'rewrite',
    title: 'Viết lại CV',
    icon: PenTool,
    questions: [
      {
        q: 'AI viết lại CV như thế nào?',
        a: 'AI phân tích nội dung CV hiện tại, sau đó cải thiện cách diễn đạt, thêm từ khóa ngành, và tối ưu cấu trúc câu để CV chuyên nghiệp và hấp dẫn hơn với nhà tuyển dụng.',
      },
      {
        q: 'Tôi có thể chỉnh sửa nội dung AI đề xuất không?',
        a: 'Có! Nội dung AI tạo ra chỉ là gợi ý. Bạn hoàn toàn có thể chỉnh sửa, thêm bớt trước khi xuất file CV cuối cùng.',
      },
    ],
  },
  {
    id: 'cover',
    title: 'Thư ứng tuyển',
    icon: Mail,
    questions: [
      {
        q: 'AI có thể viết thư ứng tuyển riêng cho từng công việc không?',
        a: 'Có! Chỉ cần dán JD vào, AI sẽ tạo thư ứng tuyển được cá nhân hóa dựa trên thông tin trong CV và yêu cầu công việc cụ thể.',
      },
      {
        q: 'Thư ứng tuyển nên dài bao nhiêu?',
        a: 'Thư ứng tuyển lý tưởng nên trong khoảng 250-400 từ, khoảng 3-4 đoạn. AI sẽ tự động tạo thư với độ dài phù hợp.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Tài khoản & Thanh toán',
    icon: FileText,
    questions: [
      {
        q: 'Làm sao để nâng cấp tài khoản?',
        a: 'Vào trang Bảng giá hoặc click nút "Nâng cấp" trên thanh điều hướng. Chọn gói phù hợp và thanh toán qua các phương thức: MoMo, VNPay, hoặc ZaloPay.',
      },
      {
        q: 'Có thể hủy gói Premium không?',
        a: 'Có, bạn có thể hủy bất cứ lúc nào. Sau khi hủy, bạn vẫn được sử dụng đến hết chu kỳ thanh toán hiện tại.',
      },
      {
        q: 'Thanh toán có an toàn không?',
        a: 'Hoàn toàn an toàn! Chúng tôi sử dụng các cổng thanh toán uy tín như MoMo, VNPay, ZaloPay với bảo mật cấp ngân hàng.',
      },
    ],
  },
];

// Guide sections
const guides = [
  {
    id: 'getting-started',
    title: 'Bắt đầu sử dụng',
    description: 'Hướng dẫn cơ bản cho người mới',
    icon: Zap,
    steps: [
      'Đăng ký tài khoản miễn phí',
      'Tải lên CV hiện tại của bạn (PDF hoặc DOCX)',
      'Xem điểm ATS và các đề xuất cải thiện',
      'Sử dụng AI để viết lại và tối ưu CV',
      'Xuất CV mới và ứng tuyển!',
    ],
  },
  {
    id: 'optimize-cv',
    title: 'Tối ưu CV cho ATS',
    description: 'Cách để CV vượt qua vòng lọc tự động',
    icon: Shield,
    steps: [
      'Sử dụng định dạng đơn giản, tránh bảng và cột phức tạp',
      'Thêm từ khóa phù hợp với ngành nghề và vị trí',
      'Sử dụng font chuẩn như Arial, Calibri, Times New Roman',
      'Đặt tiêu đề section rõ ràng: Kinh nghiệm, Học vấn, Kỹ năng',
      'Lưu file dưới định dạng PDF để giữ nguyên format',
    ],
  },
  {
    id: 'job-match',
    title: 'So khớp với công việc',
    description: 'Tùy chỉnh CV cho từng vị trí ứng tuyển',
    icon: Target,
    steps: [
      'Copy mô tả công việc (JD) từ tin tuyển dụng',
      'Dán vào công cụ So khớp JD của ResuMax',
      'Xem danh sách từ khóa còn thiếu',
      'Thêm các kỹ năng/kinh nghiệm phù hợp vào CV',
      'Kiểm tra lại độ khớp và tải CV mới',
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState('general');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const toggleFaq = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    setExpandedFaq(expandedFaq === key ? null : key);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong 24 giờ.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  // Filter FAQs based on search
  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  const currentCategory = faqCategories.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-[var(--background-secondary)] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-[var(--foreground)]">
                  Trung tâm trợ giúp
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[var(--primary)] to-[var(--primary-dark)] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Chúng tôi có thể giúp gì cho bạn?
          </h1>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Tìm câu trả lời nhanh chóng hoặc liên hệ đội ngũ hỗ trợ của chúng
            tôi
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl text-[var(--foreground)] bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Quick Links */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 text-center">
            Truy cập nhanh
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Book, label: 'Hướng dẫn', href: '#guides' },
              { icon: HelpCircle, label: 'Câu hỏi thường gặp', href: '#faq' },
              {
                icon: MessageCircle,
                label: 'Liên hệ hỗ trợ',
                href: '#contact',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <a
                  key={index}
                  href={item.href}
                  className="flex flex-col items-center gap-3 p-6 bg-[var(--background-secondary)] rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <span className="font-medium text-[var(--foreground)]">
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        {/* Getting Started Guides */}
        <section id="guides" className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
            Hướng dẫn sử dụng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Card key={guide.id} className="h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {guide.description}
                      </p>
                    </div>
                  </div>
                  <ol className="space-y-2">
                    {guide.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-[var(--foreground-secondary)]">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
            Câu hỏi thường gặp
          </h2>

          {searchQuery ? (
            /* Search Results */
            <div className="space-y-4">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div key={category.id}>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                      <category.icon className="w-5 h-5 text-[var(--primary)]" />
                      {category.title}
                    </h3>
                    <div className="space-y-2">
                      {category.questions.map((faq, index) => (
                        <Card key={index} className="!p-0 overflow-hidden">
                          <button
                            onClick={() => toggleFaq(category.id, index)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--background-secondary)] transition-colors"
                          >
                            <span className="font-medium text-[var(--foreground)]">
                              {faq.q}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-[var(--foreground-muted)] transition-transform ${
                                expandedFaq === `${category.id}-${index}`
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          </button>
                          {expandedFaq === `${category.id}-${index}` && (
                            <div className="px-4 pb-4 text-[var(--foreground-secondary)]">
                              {faq.a}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <Card className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto text-[var(--foreground-muted)] mb-4" />
                  <p className="text-[var(--foreground-muted)]">
                    Không tìm thấy kết quả cho {searchQuery}
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)] mt-2">
                    Thử tìm kiếm với từ khóa khác hoặc liên hệ hỗ trợ
                  </p>
                </Card>
              )}
            </div>
          ) : (
            /* Category View */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Category List */}
              <div className="lg:col-span-1">
                <Card className="!p-2">
                  <nav className="space-y-1">
                    {faqCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            activeCategory === category.id
                              ? 'bg-[var(--primary)] text-white'
                              : 'text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            {category.title}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </Card>
              </div>

              {/* FAQ Content */}
              <div className="lg:col-span-3">
                <Card>
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    {currentCategory && (
                      <currentCategory.icon className="w-6 h-6 text-[var(--primary)]" />
                    )}
                    {currentCategory?.title}
                  </h3>
                  <div className="space-y-3">
                    {currentCategory?.questions.map((faq, index) => (
                      <div
                        key={index}
                        className="border border-[var(--border)] rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleFaq(currentCategory.id, index)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--background-secondary)] transition-colors"
                        >
                          <span className="font-medium text-[var(--foreground)]">
                            {faq.q}
                          </span>
                          <ChevronDown
                            className={`w-5 h-5 text-[var(--foreground-muted)] transition-transform ${
                              expandedFaq === `${currentCategory.id}-${index}`
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </button>
                        {expandedFaq === `${currentCategory.id}-${index}` && (
                          <div className="px-4 pb-4 text-[var(--foreground-secondary)] border-t border-[var(--border)] pt-4">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section id="contact" className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
            Liên hệ hỗ trợ
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] mb-1">
                      Hỗ trợ trực tiếp
                    </h3>
                    <p className="text-[var(--foreground-muted)] text-sm mb-3">
                      Đội ngũ hỗ trợ sẵn sàng giúp đỡ bạn từ 8:00 - 22:00 hàng
                      ngày
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[var(--foreground-muted)]" />
                        <a
                          href="mailto:support@resumax.vn"
                          className="text-[var(--primary)] hover:underline"
                        >
                          resumaxvn@gmail.com
                        </a>
                      </p>
                      <p className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[var(--foreground-muted)]" />
                        <span className="text-[var(--foreground)]">
                          Chat Zalo: 0356993205
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-[var(--foreground)] mb-4">
                  Thời gian phản hồi
                </h3>
                <div className="space-y-3">
                  {[
                    { plan: 'Miễn phí', time: 'Trong 24 giờ' },
                    { plan: 'Basic', time: 'Trong 12 giờ' },
                    { plan: 'Pro', time: 'Trong 2 giờ (Ưu tiên)' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <span className="text-[var(--foreground)]">
                        {item.plan}
                      </span>
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <h3 className="font-semibold text-[var(--foreground)] mb-4">
                Gửi yêu cầu hỗ trợ
              </h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Họ tên"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <Input
                  label="Tiêu đề"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  placeholder="VD: Không thể tải lên CV"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Nội dung
                  </label>
                  <textarea
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                    className="input w-full h-32 resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2">
                  <Send className="w-4 h-4" />
                  Gửi yêu cầu
                </Button>
              </form>
            </Card>
          </div>
        </section>

        {/* Still Need Help */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white">
            <h2 className="text-2xl font-bold mb-2">Vẫn cần hỗ trợ?</h2>
            <p className="opacity-90 mb-6">
              Đội ngũ của chúng tôi luôn sẵn sàng giúp đỡ bạn
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="outline"
                className="bg-white text-[var(--primary)] border-white hover:bg-white/90"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat với hỗ trợ
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Mail className="w-4 h-4 mr-2" />
                Gửi email
              </Button>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-[var(--foreground-muted)]">
          <p>© 2024 ResuMax VN. Mọi quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}

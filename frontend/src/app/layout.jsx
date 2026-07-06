import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/providers/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'ResuMax VN - CV tiếng Anh chuẩn FDI trong 5 phút',
  description:
    'AI viết CV tiếng Anh chuẩn FDI, tối ưu ATS cho Samsung, LG, Foxconn, Canon. Vượt vòng lọc hồ sơ, tăng cơ hội phỏng vấn tại công ty nước ngoài.',
  keywords: 'CV tiếng Anh, CV FDI, CV apply Samsung, CV apply LG, CV kỹ sư FDI, tối ưu CV ATS, viết CV tiếng Anh',
  openGraph: {
    title: 'ResuMax VN - CV tiếng Anh chuẩn FDI trong 5 phút',
    description:
      'AI viết CV tiếng Anh chuẩn FDI, tối ưu ATS cho Samsung, LG, Foxconn, Canon. Vượt vòng lọc hồ sơ, tăng cơ hội phỏng vấn tại công ty nước ngoài.',
    url: 'https://cttech.ltd',
    siteName: 'ResuMax VN',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResuMax VN - CV tiếng Anh chuẩn FDI trong 5 phút',
    description:
      'AI viết CV tiếng Anh chuẩn FDI, tối ưu ATS cho Samsung, LG, Foxconn, Canon.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

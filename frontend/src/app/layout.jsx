import { Be_Vietnam_Pro } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/providers/AuthProvider';
import MetaPixelTracker from '@/components/MetaPixelTracker';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Đậu Việc - CV tiếng Anh chuẩn FDI trong 5 phút',
  description:
    'AI viết CV tiếng Anh chuẩn FDI, tối ưu ATS cho Samsung, LG, Foxconn, Canon. Vượt vòng lọc hồ sơ, tăng cơ hội phỏng vấn tại công ty nước ngoài.',
  keywords: 'CV tiếng Anh, CV FDI, CV apply Samsung, CV apply LG, CV kỹ sư FDI, tối ưu CV ATS, viết CV tiếng Anh',
  openGraph: {
    title: 'Đậu Việc - CV tiếng Anh chuẩn FDI trong 5 phút',
    description:
      'AI viết CV tiếng Anh chuẩn FDI, tối ưu ATS cho Samsung, LG, Foxconn, Canon. Vượt vòng lọc hồ sơ, tăng cơ hội phỏng vấn tại công ty nước ngoài.',
    url: 'https://cttech.ltd',
    siteName: 'Đậu Việc',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Đậu Việc - CV tiếng Anh chuẩn FDI trong 5 phút',
    description:
      'AI viết CV tiếng Anh chuẩn FDI, tối ưu ATS cho Samsung, LG, Foxconn, Canon.',
  },
};

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.startsWith('G-') &&
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID !== 'G-XXXXXXXXXX'
  ? process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
  : null;

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.variable} antialiased`}>
        <AuthProvider>
          {children}
          <MetaPixelTracker />
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

        {/* Google Analytics GA4 — only loads when NEXT_PUBLIC_GA4_MEASUREMENT_ID is set */}
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}

        {/* Meta Pixel — only loads when NEXT_PUBLIC_META_PIXEL_ID is set */}
        {PIXEL_ID && (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Auth0Provider } from '@auth0/nextjs-auth0';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ReelForge — AI scripts & thumbnails for creators',
  description:
    'Generate viral hooks, scripts, scene breakdowns, captions, hashtags, and thumbnails for short-form video — powered by Gemini.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-ink-950 antialiased">
        <Auth0Provider>
          <ToastProvider>
            <div className="relative min-h-screen">
              <div className="pointer-events-none fixed inset-0 bg-gradient-mesh" />
              <div className="relative z-10">{children}</div>
            </div>
          </ToastProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}

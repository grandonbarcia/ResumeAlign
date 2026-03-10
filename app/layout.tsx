import type { Metadata } from 'next';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ToastProvider';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ResumeAlign',
  description:
    'AI-powered resume tailoring for job applications, built with a safe multi-step pipeline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const content = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ToastProvider>
          <Navbar authEnabled={Boolean(convexUrl)} />
          <main className="flex-1 text-foreground bg-background">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );

  if (!convexUrl) return content;

  return (
    <ConvexAuthNextjsServerProvider>{content}</ConvexAuthNextjsServerProvider>
  );
}

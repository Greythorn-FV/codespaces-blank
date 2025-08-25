// src/app/layout.tsx

import './globals.css';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata = {
  title: 'CoastR Manager',
  description: 'Fleet and booking management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <ErrorBoundary>
          <Navigation />
          <main>{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
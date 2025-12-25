import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JSON SQL Search',
  description: 'Query JSON with SQL',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900">{children}</body>
    </html>
  );
}

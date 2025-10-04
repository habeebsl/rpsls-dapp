import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/lib/fontawesome';
import { NavBar } from './components/Navbar';
import { GlobalConfirmationModal } from './components/GlobalConfirmationModal';
import { NotificationProvider } from './components/NotificationProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RPSLS DApp - Rock Paper Scissors Lizard Spock',
  description:
    'A decentralized Rock Paper Scissors Lizard Spock game built on Ethereum',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon.ico', sizes: 'any' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/icons/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <NavBar />
        <NotificationProvider />
        <main>{children}</main>
        <GlobalConfirmationModal />
      </body>
    </html>
  );
}

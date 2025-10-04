import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/lib/fontawesome'; // Initialize Font Awesome
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

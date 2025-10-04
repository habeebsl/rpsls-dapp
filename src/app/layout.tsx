import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import '@/lib/fontawesome'; // Initialize Font Awesome
import { NavBar } from './components/Navbar';
import { GlobalConfirmationModal } from './components/GlobalConfirmationModal';
import { NotificationProvider } from './components/NotificationProvider';
import { Web3ModalProvider } from './components/Web3ModalProvider';

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
        {/* Mobile debugging console - Eruda */}
        <Script
          src="https://cdn.jsdelivr.net/npm/eruda"
          strategy="beforeInteractive"
          onLoad={() => {
            if (typeof window !== 'undefined' && (window as any).eruda) {
              (window as any).eruda.init();
            }
          }}
        />
        <Web3ModalProvider>
          <NavBar />
          <NotificationProvider />
          <main>{children}</main>
          <GlobalConfirmationModal />
        </Web3ModalProvider>
      </body>
    </html>
  );
}

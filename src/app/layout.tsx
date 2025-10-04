import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
      <head>
        {/* Mobile debugging console - Eruda */}
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script dangerouslySetInnerHTML={{ __html: 'eruda.init();' }} />
      </head>
      <body className={`${inter.className} antialiased`}>
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

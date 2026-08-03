import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Header from '../components/shared/header';
import Footer from '../components/shared/footer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin']
});

export const metadata: Metadata = {
  icons: {
    icon: '/logo.svg'
  },
  title: 'SVCE Tech Hub | Tech Events, Clubs & Opportunities',
  description:
    'Discover tech events, clubs, and opportunities around Sri Venkateswara College of Engineering (SVCE), Sriperumbudur. Meetups, symposiums, hackathons and more — all in one place.',
  keywords:
    'svce, sri venkateswara college of engineering, tech events chennai, sriperumbudur tech, college tech clubs, svce events, tech symposiums, hackathons chennai, student tech community',
  openGraph: {
    title: 'SVCE Tech Hub | Tech Events, Clubs & Opportunities',
    description:
      'Discover tech events, clubs, and opportunities around Sri Venkateswara College of Engineering, Sriperumbudur.',
    type: 'website',
    locale: 'en_US',
    siteName: 'SVCE Tech Hub'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVCE Tech Hub | Tech Events, Clubs & Opportunities',
    description:
      'Discover tech events, clubs, and opportunities around Sri Venkateswara College of Engineering, Sriperumbudur.'
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.variable} ${spaceGrotesk.variable} bg-[#fbfbf7] font-sans antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

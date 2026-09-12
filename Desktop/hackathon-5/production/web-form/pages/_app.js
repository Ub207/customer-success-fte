import '../styles/globals.css';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export default function App({ Component, pageProps }) {
  return (
    <main className={`${jakarta.variable} ${mono.variable} font-sans antialiased`}>
      <Component {...pageProps} />
    </main>
  );
}

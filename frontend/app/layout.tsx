import './globals.css';
import { Header } from '../components/Header';

export const metadata = {
  title: 'Ke7.com Blind Box',
  description: 'Blind box lottery platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="container" style={{ padding: '24px 0 40px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}

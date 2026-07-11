import './globals.css';
import Link from 'next/link';

// Metadata halaman (SEO dasar)
export const metadata = {
  title: 'Kamus Bahasa Bugis — Sistem Basis Data Modern',
  description:
    'Kamus Bahasa Bugis–Indonesia berbasis MongoDB, Express, Next.js, dan MinIO',
};

// Layout global: header navigasi + footer identitas
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              ᨒ<span className="lontara"> Kamus Bugis</span>
            </Link>
            <nav className="nav">
              <Link href="/">Beranda</Link>
              <Link href="/words/new">+ Tambah Kata</Link>
              <a href="/api-docs" target="_blank" rel="noreferrer">
                API Docs
              </a>
            </nav>
          </div>
        </header>

        <main className="container">{children}</main>

        <footer className="site-footer">
          Tugas Sistem Basis Data Modern — MongoDB · Express JS · Next.js · MinIO · Docker
          <br />
          Andi Rasyihan Jawahir (105841111524) · Informatika Unismuh Makassar
        </footer>
      </body>
    </html>
  );
}

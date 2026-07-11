'use client';

// Beranda: statistik kamus + pencarian kata + daftar kartu kata (pagination).
import { useCallback, useEffect, useState } from 'react';
import { fetchWords, fetchStats } from '../lib/api';
import WordCard from '../components/WordCard';

const POS_OPTIONS = [
  { value: '', label: 'Semua kelas kata' },
  { value: 'n', label: 'n — nomina' },
  { value: 'v', label: 'v — verba' },
  { value: 'a', label: 'a — adjektiva' },
  { value: 'adv', label: 'adv — adverbia' },
  { value: 'pron', label: 'pron — pronomina' },
  { value: 'num', label: 'num — numeralia' },
  { value: 'p', label: 'p — partikel' },
];

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [words, setWords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Muat statistik sekali di awal
  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []);

  // Muat daftar kata setiap parameter berubah (debounce 300 ms untuk ketikan)
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchWords({ search, pos, page })
      .then((res) => {
        setWords(res.data);
        setPagination(res.pagination);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, pos, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <>
      <section className="hero">
        <h1>Kamus Bahasa Bugis 📖</h1>
        <p>Kamus digital Bugis–Indonesia · data tersimpan di MongoDB, gambar di MinIO</p>
      </section>

      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <b>{stats.total.toLocaleString('id-ID')}</b>
            <span>Total Entri</span>
          </div>
          <div className="stat-card">
            <b>{stats.mainEntries.toLocaleString('id-ID')}</b>
            <span>Lema Utama</span>
          </div>
          <div className="stat-card">
            <b>{stats.withImage.toLocaleString('id-ID')}</b>
            <span>Bergambar (MinIO)</span>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Cari kata Bugis atau artinya… (mis. anre, makan)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={pos}
          onChange={(e) => {
            setPos(e.target.value);
            setPage(1);
          }}
        >
          {POS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert-err">Gagal memuat data: {error}</div>}
      {loading && <p className="center muted">Memuat…</p>}

      {!loading && !error && (
        <>
          <p className="muted">
            Ditemukan <b>{pagination.total.toLocaleString('id-ID')}</b> entri
          </p>
          <div className="grid">
            {words.map((w) => (
              <WordCard key={w.id} word={w} />
            ))}
          </div>
          {words.length === 0 && (
            <p className="center muted mt">Tidak ada kata yang cocok.</p>
          )}

          <div className="pagination">
            <button
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹ Sebelumnya
            </button>
            <span>
              Hal. {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              className="btn btn-outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya ›
            </button>
          </div>
        </>
      )}
    </>
  );
}

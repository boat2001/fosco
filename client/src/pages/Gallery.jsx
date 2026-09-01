import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAsync, useDocumentMeta } from '../hooks.js';
import { PageBanner, Loading, ErrorState, Lightbox } from '../components/common.jsx';

export default function Gallery() {
  useDocumentMeta('Gallery', 'Photographs of campus life at Foso College of Education.');
  const { data, loading, error } = useAsync(() => api.gallery(), []);
  const [album, setAlbum] = useState('All');
  const [lightbox, setLightbox] = useState(null);

  const items = data?.items || [];
  const albums = useMemo(() => ['All', ...new Set(items.map((i) => i.album))], [items]);
  const visible = album === 'All' ? items : items.filter((i) => i.album === album);

  return (
    <>
      <PageBanner
        title="Gallery"
        image="/media/2022/07/99A5211-2.jpg"
        crumbs={[{ label: 'Gallery' }]}
      />
      <section className="section">
        <div className="container">
          {loading && <Loading rows={9} />}
          {error && <ErrorState error={error} />}

          {!loading && !error && (
            <>
              {albums.length > 2 && (
                <div className="filter-bar">
                  {albums.map((a) => (
                    <button key={a} aria-pressed={album === a} onClick={() => setAlbum(a)}>
                      {a}
                    </button>
                  ))}
                </div>
              )}

              <p style={{ marginBottom: 'var(--space-5)', color: 'var(--muted)', fontSize: 'var(--step--1)' }}>
                {visible.length} photograph{visible.length === 1 ? '' : 's'}
              </p>

              <div className="gallery-grid">
                {visible.map((item, i) => (
                  <button className="gallery-item" key={item.id} onClick={() => setLightbox(i)}>
                    <img src={item.src} alt={item.alt} loading="lazy" width="480" height="360" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox items={visible} index={lightbox} onClose={() => setLightbox(null)} onNavigate={setLightbox} />
      )}
    </>
  );
}

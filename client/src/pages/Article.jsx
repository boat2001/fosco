import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync, useDocumentMeta } from '../hooks.js';
import { Icon } from '../components/Icons.jsx';
import { PageBanner, ErrorState, Lightbox, formatDate } from '../components/common.jsx';
import NotFound from './NotFound.jsx';

export default function Article() {
  const { slug } = useParams();
  const { data, loading, error } = useAsync(() => api.article(slug), [slug]);
  const [lightbox, setLightbox] = useState(null);

  useDocumentMeta(data?.title, data?.excerpt);

  if (loading) {
    return (
      <div className="container section">
        <div className="skeleton" style={{ height: 44, maxWidth: 560, marginBottom: 'var(--space-5)' }} />
        <div className="skeleton" style={{ height: 320, marginBottom: 'var(--space-5)' }} />
        <div className="skeleton" style={{ height: 16, marginBottom: 'var(--space-3)' }} />
        <div className="skeleton" style={{ height: 16, width: '80%' }} />
      </div>
    );
  }

  if (error?.status === 404) return <NotFound />;
  if (error) {
    return (
      <div className="container section">
        <ErrorState error={error} />
      </div>
    );
  }

  // The lead image already appears above the article, so exclude it from the strip.
  const extras = (data.gallery || []).filter((g) => g !== data.image);

  return (
    <>
      <PageBanner
        title={data.title}
        image={data.image}
        crumbs={[{ label: 'News', href: '/news' }, { label: data.title }]}
      />

      <section className="section">
        <div className="container container--narrow">
          <article>
            <header className="article__header">
              <div className="article__meta">
                {data.categories?.map((c) => (
                  <span className="chip" key={c}>
                    {c}
                  </span>
                ))}
                {data.date && (
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <Icon name="calendar" size={15} />
                    <time dateTime={data.date}>{formatDate(data.date)}</time>
                  </span>
                )}
              </div>
            </header>

            {data.image && (
              <div className="article__hero">
                <img src={data.image} alt="" width="1200" height="675" />
              </div>
            )}

            <div className="article__body">
              {data.body?.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {extras.length > 0 && (
              <div className="article__gallery">
                {extras.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setLightbox(i)}
                    style={{ padding: 0, borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'zoom-in' }}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </article>

          <div style={{ marginTop: 'var(--space-8)' }}>
            <Link to="/news" className="btn btn--outline">
              ← All news
            </Link>
          </div>
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox
          items={extras.map((src) => ({ src }))}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </>
  );
}

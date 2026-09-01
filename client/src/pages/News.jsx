import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAsync, useDocumentMeta } from '../hooks.js';
import { PageBanner, NewsCard, Loading, ErrorState } from '../components/common.jsx';

export default function News() {
  useDocumentMeta('News', 'Latest news and announcements from Foso College of Education.');
  const { data, loading, error } = useAsync(() => api.news({ limit: 100 }), []);
  const [filter, setFilter] = useState('All');

  const posts = data?.items || [];

  const categories = useMemo(
    () => ['All', ...new Set(posts.flatMap((p) => p.categories || []))],
    [posts]
  );

  const visible = filter === 'All' ? posts : posts.filter((p) => p.categories?.includes(filter));

  return (
    <>
      <PageBanner
        title="News & Articles"
        image="/media/2022/07/99A5086-scaled.jpg"
        crumbs={[{ label: 'News' }]}
      />
      <section className="section">
        <div className="container">
          {loading && <Loading rows={6} />}
          {error && <ErrorState error={error} />}

          {!loading && !error && (
            <>
              {categories.length > 2 && (
                <div className="filter-bar">
                  {categories.map((c) => (
                    <button key={c} aria-pressed={filter === c} onClick={() => setFilter(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {visible.length === 0 ? (
                <div className="empty-state">
                  <p>No articles have been published in this category yet.</p>
                </div>
              ) : (
                <div className="grid grid--3">
                  {visible.map((p) => (
                    <NewsCard post={p} key={p.slug} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

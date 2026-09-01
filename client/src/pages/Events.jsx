import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync, useDocumentMeta } from '../hooks.js';
import { Icon } from '../components/Icons.jsx';
import { PageBanner, Loading, ErrorState, formatDate } from '../components/common.jsx';

export default function Events() {
  useDocumentMeta('Events', 'Upcoming events and programmes at Foso College of Education.');
  const { data, loading, error } = useAsync(() => api.events(), []);
  const events = data || [];

  return (
    <>
      <PageBanner
        title="Events & Programmes"
        image="/media/2022/07/99A5038-scaled-e1658783648572.jpg"
        crumbs={[{ label: 'Events' }]}
      />
      <section className="section">
        <div className="container">
          {loading && <Loading />}
          {error && <ErrorState error={error} />}

          {!loading && !error && events.length === 0 && (
            <div className="empty-state">
              <Icon name="calendar" size={40} />
              <h2 style={{ fontSize: 'var(--step-1)', marginBlock: 'var(--space-4) var(--space-2)' }}>
                No events scheduled right now
              </h2>
              <p>
                Upcoming congregations, workshops and college programmes will be listed here. In the meantime,
                see the <Link to="/academic-calendar">academic calendar</Link> or read the{' '}
                <Link to="/news">latest news</Link>.
              </p>
            </div>
          )}

          {events.length > 0 && (
            <div className="grid grid--3">
              {events.map((e) => (
                <article className="card" key={e.id}>
                  {e.image && (
                    <div className="card__media">
                      <img src={e.image} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="card__body">
                    <h3 className="card__title">{e.title}</h3>
                    {e.description && <p className="card__text">{e.description}</p>}
                    <div className="card__meta">
                      <Icon name="calendar" size={15} />
                      <time dateTime={e.starts_at}>{formatDate(e.starts_at)}</time>
                      {e.location && (
                        <>
                          <Icon name="pin" size={15} />
                          <span>{e.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

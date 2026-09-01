import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync, useDocumentMeta } from '../hooks.js';
import { Blocks } from '../components/Blocks.jsx';
import { PageBanner, ErrorState } from '../components/common.jsx';
import { ADMISSIONS } from '../data/site.js';
import NotFound from './NotFound.jsx';

const FALLBACK_BANNER = '/media/2022/07/99A5086-scaled.jpg';

/** Renders any archived WordPress page from its extracted blocks. */
export default function ContentPage() {
  const { slug } = useParams();
  const { data, loading, error } = useAsync(() => api.page(slug), [slug]);

  useDocumentMeta(data?.title, data?.description);

  if (loading) {
    return (
      <div className="container section">
        <div className="skeleton" style={{ height: 40, maxWidth: 420, marginBottom: 'var(--space-5)' }} />
        <div className="skeleton" style={{ height: 16, marginBottom: 'var(--space-3)' }} />
        <div className="skeleton" style={{ height: 16, marginBottom: 'var(--space-3)' }} />
        <div className="skeleton" style={{ height: 16, width: '70%' }} />
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

  const hasBlocks = data.blocks?.length > 0;

  return (
    <>
      <PageBanner
        title={data.hero_title || data.title}
        image={data.hero_image || FALLBACK_BANNER}
        crumbs={[{ label: data.title }]}
      />
      <section className="section">
        <div className="container container--narrow">
          {slug === 'admission-to-foso-college-of-education' && (
            <aside className="admissions-callout" aria-labelledby="current-admissions-title">
              <span className="chip">Admissions open</span>
              <h2 id="current-admissions-title">Apply for the {ADMISSIONS.academicYear} academic year</h2>
              <p>
                Applications for the four-year Bachelor of Education programme close on{' '}
                <strong>{ADMISSIONS.deadline}</strong>. The application voucher costs {ADMISSIONS.fee}.
              </p>
              <div className="admissions-callout__actions">
                <a className="btn btn--primary" href={ADMISSIONS.portal} target="_blank" rel="noreferrer">
                  Open application portal
                </a>
                <a className="btn btn--outline" href="tel:+233303981273">Call admissions</a>
              </div>
            </aside>
          )}
          {hasBlocks ? (
            <Blocks blocks={data.blocks} />
          ) : (
            <div className="empty-state">
              <p>
                This page does not have published content yet. Please{' '}
                <a href="/contact-us">contact the College</a> if you were looking for something specific.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks.js';

export default function NotFound() {
  useDocumentMeta('Page not found');

  return (
    <section className="section" style={{ paddingBlock: 'var(--space-9)' }}>
      <div className="container container--narrow" style={{ textAlign: 'center' }}>
        <p className="eyebrow" style={{ justifyContent: 'center' }}>Error 404</p>
        <h1 style={{ marginBottom: 'var(--space-4)' }}>We couldn&apos;t find that page</h1>
        <p style={{ marginBottom: 'var(--space-6)' }}>
          The page you are looking for may have been moved or no longer exists.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn--primary">
            Back to home
          </Link>
          <Link to="/contact-us" className="btn btn--outline">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icons.jsx';

export function PageBanner({ title, image, crumbs = [] }) {
  return (
    <section className="page-banner">
      {image && <img src={image} alt="" />}
      <div className="container">
        <h1>{title}</h1>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} style={{ display: 'contents' }}>
              <span aria-hidden="true">/</span>
              {c.href ? <Link to={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, text, center = false }) {
  return (
    <div className={`section-head${center ? ' section-head--center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {title && <h2>{title}</h2>}
      {text && <p>{text}</p>}
    </div>
  );
}

export function Loading({ rows = 3 }) {
  return (
    <div className="grid grid--3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 260 }} />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="empty-state">
      <p>{error?.message || 'We could not load this content.'}</p>
      {onRetry && (
        <button className="btn btn--outline" onClick={onRetry} style={{ marginTop: 'var(--space-4)' }}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Accessible image lightbox with keyboard navigation. */
export function Lightbox({ items, index, onClose, onNavigate }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, items.length, onClose, onNavigate]);

  const item = items[index];
  if (!item) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={onClose}>
      <button className="lightbox__close" onClick={onClose} aria-label="Close">
        ×
      </button>
      {items.length > 1 && (
        <>
          <button
            className="lightbox__nav lightbox__nav--prev"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + items.length) % items.length);
            }}
          >
            ‹
          </button>
          <button
            className="lightbox__nav lightbox__nav--next"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % items.length);
            }}
          >
            ›
          </button>
        </>
      )}
      <img src={item.src} alt={item.alt || ''} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export function NewsCard({ post }) {
  const d = post.date ? new Date(post.date) : null;
  const valid = d && !Number.isNaN(d.getTime());

  return (
    <article className="card">
      <div className="card__media">
        <img
          src={post.image || '/media/2022/07/99A5086-scaled.jpg'}
          alt=""
          loading="lazy"
          width="640"
          height="400"
        />
        {valid && (
          <div className="card__date" aria-hidden="true">
            <b>{d.getDate()}</b>
            <span>{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
          </div>
        )}
      </div>
      <div className="card__body">
        {post.categories?.length > 0 && <span className="chip">{post.categories[0]}</span>}
        <h3 className="card__title">
          <Link to={`/news/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className="card__text">{post.excerpt}…</p>}
        <div className="card__meta">
          <Icon name="calendar" size={15} />
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
    </article>
  );
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

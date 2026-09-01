import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAV, SITE, CONTACT } from '../data/site.js';
import { Icon } from './Icons.jsx';

function TopBar() {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <div className="topbar__contacts">
          <a href={CONTACT.phoneHref}>
            <Icon name="phone" size={15} />
            {CONTACT.phone}
          </a>
          <a href={`mailto:${CONTACT.email}`}>
            <Icon name="mail" size={15} />
            {CONTACT.email}
          </a>
        </div>
        <div className="topbar__social">
          <span>Assin Fosu, Central Region, Ghana</span>
          {CONTACT.social.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
              <Icon name={s.icon} size={16} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Desktop dropdown; opens on hover and on keyboard focus. */
function NavItem({ item }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!item.children) {
    return (
      <li className="nav__item">
        <NavLink to={item.href} className="nav__link" end={item.href === '/'}>
          {item.label}
        </NavLink>
      </li>
    );
  }

  return (
    <li
      className="nav__item"
      data-open={open}
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button className="nav__link" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {item.label}
        <Icon name="chevronDown" size={13} className="nav__caret" />
      </button>
      <div className="nav__panel" role="group" aria-label={item.label}>
        {item.children.map((c) => (
          <Link key={c.href} to={c.href} tabIndex={open ? 0 : -1}>
            {c.label}
          </Link>
        ))}
      </div>
    </li>
  );
}

function MobileNav({ onNavigate, scrolled }) {
  const [openGroup, setOpenGroup] = useState(null);

  return (
    <nav className="mobile-nav" data-scrolled={scrolled} aria-label="Mobile">
      <div className="container">
        {NAV.map((item) =>
          item.children ? (
            <div className="mobile-nav__group" key={item.label}>
              <button
                className="mobile-nav__toggle"
                aria-expanded={openGroup === item.label}
                onClick={() => setOpenGroup((g) => (g === item.label ? null : item.label))}
              >
                {item.label}
                <Icon name="chevronDown" size={16} />
              </button>
              {openGroup === item.label && (
                <div className="mobile-nav__sub">
                  {item.children.map((c) => (
                    <Link key={c.href} to={c.href} onClick={onNavigate}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mobile-nav__group" key={item.href}>
              <Link className="mobile-nav__link" to={item.href} onClick={onNavigate}>
                {item.label}
              </Link>
            </div>
          )
        )}
        <Link
          to="/admission-to-foso-college-of-education"
          className="btn btn--primary btn--block"
          style={{ marginTop: 'var(--space-5)' }}
          onClick={onNavigate}
        >
          Apply to FOSCO
        </Link>
      </div>
    </nav>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Prevent the page behind the drawer from scrolling.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <TopBar />
      <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
        <div className="container header__inner">
          {/* The logo artwork already carries the college name, so no wordmark beside it. */}
          <Link to="/" className="brand" aria-label={`${SITE.name} home`}>
            <img src={SITE.logo} alt={SITE.name} width="236" height="90" />
          </Link>

          <nav aria-label="Primary">
            <ul className="nav" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {NAV.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </ul>
          </nav>

          <div className="header__actions">
            <Link to="/admission-to-foso-college-of-education" className="btn btn--primary header__cta">
              Apply Now
            </Link>
            <button
              className="burger"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      {menuOpen && <MobileNav onNavigate={() => setMenuOpen(false)} scrolled={scrolled} />}
    </>
  );
}

import { Link } from 'react-router-dom';
import { SITE, CONTACT, FOOTER_LINKS } from '../data/site.js';
import { Icon } from './Icons.jsx';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <img className="footer__logo" src={SITE.logoLight} alt={SITE.name} width="205" height="72" />
            <p>
              Foso College of Education is a public college of education in Assin Fosu, Central Region,
              Ghana. Affiliated to the University of Cape Coast, the College runs a four-year Bachelor of
              Education programme and has trained teachers for Ghana&apos;s basic schools since {SITE.established}.
            </p>
            <div className="footer__social" style={{ marginTop: 'var(--space-5)' }}>
              {CONTACT.social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                  <Icon name={s.icon} size={17} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Footer">
            <h3>Quick Links</h3>
            <ul className="footer__links">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link to={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3>Contact</h3>
            <ul className="footer__contact">
              <li>
                <Icon name="pin" size={18} />
                <span>
                  {CONTACT.address.map((line) => (
                    <span key={line} style={{ display: 'block' }}>
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li>
                <Icon name="phone" size={18} />
                <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
              </li>
              <li>
                <Icon name="mail" size={18} />
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li>
                <Icon name="clock" size={18} />
                <span>Monday – Friday, 8:00am – 5:00pm</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </span>
          <span>
            <Link to="/policies">Policies</Link> · <Link to="/contact-us">Contact</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

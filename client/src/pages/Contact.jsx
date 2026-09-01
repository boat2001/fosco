import { useState } from 'react';
import { api } from '../api.js';
import { useDocumentMeta } from '../hooks.js';
import { CONTACT } from '../data/site.js';
import { Icon } from '../components/Icons.jsx';
import { PageBanner, SectionHead } from '../components/common.jsx';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  useDocumentMeta('Contact Us', 'Get in touch with Foso College of Education, Assin Fosu, Central Region, Ghana.');

  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await api.contact(form);
      setStatus({ ok: true, text: res.message });
      setForm(EMPTY);
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageBanner
        title="Contact Us"
        image="/media/2022/07/99A5086-scaled.jpg"
        crumbs={[{ label: 'Contact Us' }]}
      />

      <section className="section">
        <div className="container contact-grid">
          <div>
            <SectionHead eyebrow="Get in touch" title="We would love to hear from you" />
            <ul className="contact-list">
              <li>
                <Icon name="pin" size={22} />
                <div>
                  <strong>Address</strong>
                  {CONTACT.address.map((l) => (
                    <span key={l} style={{ display: 'block' }}>
                      {l}
                    </span>
                  ))}
                </div>
              </li>
              <li>
                <Icon name="phone" size={22} />
                <div>
                  <strong>Telephone</strong>
                  <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                </div>
              </li>
              <li>
                <Icon name="mail" size={22} />
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                </div>
              </li>
              <li>
                <Icon name="clock" size={22} />
                <div>
                  <strong>Office hours</strong>
                  <span>Monday – Friday, 8:00am – 5:00pm</span>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <form className="panel" onSubmit={onSubmit} noValidate>
              <h2 style={{ fontSize: 'var(--step-2)', marginBottom: 'var(--space-5)' }}>Send us a message</h2>

              <div className="grid grid--2" style={{ gap: 'var(--space-4)' }}>
                <div className="field">
                  <label htmlFor="name">Your name *</label>
                  <input id="name" required value={form.name} onChange={update('name')} autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="email">Email address *</label>
                  <input id="email" type="email" required value={form.email} onChange={update('email')} autoComplete="email" />
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" value={form.phone} onChange={update('phone')} autoComplete="tel" />
                </div>
                <div className="field">
                  <label htmlFor="subject">Subject</label>
                  <input id="subject" value={form.subject} onChange={update('subject')} />
                </div>
              </div>

              <div className="field" style={{ marginTop: 'var(--space-4)' }}>
                <label htmlFor="message">Message *</label>
                <textarea id="message" required value={form.message} onChange={update('message')} />
              </div>

              {status && (
                <p className={`form-status form-status--${status.ok ? 'ok' : 'error'}`} style={{ marginTop: 'var(--space-4)' }} role="status">
                  {status.text}
                </p>
              )}

              <button className="btn btn--primary" type="submit" disabled={sending} style={{ marginTop: 'var(--space-5)' }}>
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="section section--tight section--alt">
        <div className="container">
          <iframe
            className="map-embed"
            title="Map showing Foso College of Education, Assin Fosu"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-1.32%2C5.66%2C-1.24%2C5.72&layer=mapnik&marker=5.695%2C-1.28"
          />
        </div>
      </section>
    </>
  );
}

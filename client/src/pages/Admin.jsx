import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useDocumentMeta } from '../hooks.js';
import { formatDate } from '../components/common.jsx';

const BLANK_POST = { title: '', date: '', excerpt: '', image: '', categories: '', body: '', published: true };
const BLANK_EVENT = { title: '', starts_at: '', ends_at: '', location: '', description: '', image: '', published: true };

function Login({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.login(username, password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin">
      <div className="container">
        <form className="login-card" onSubmit={submit}>
          <h1>FOSCO Admin</h1>
          <p>Sign in to manage news, events and enquiries.</p>

          <div className="field">
            <label htmlFor="u">Username</label>
            <input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="p">Password</label>
            <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>

          {error && <p className="form-status form-status--error" style={{ marginTop: 'var(--space-4)' }}>{error}</p>}

          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
            <Link to="/">← Back to the website</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

/** Shared editor for a news post or an event. */
function Editor({ fields, value, onChange, onSave, onCancel, busy }) {
  const [uploading, setUploading] = useState(false);

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.admin.upload(file);
      onChange({ ...value, image: url });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="grid grid--2" style={{ gap: 'var(--space-4)' }}>
        {fields.map((f) =>
          f.type === 'textarea' ? null : (
            <div className="field" key={f.key}>
              <label htmlFor={`f-${f.key}`}>{f.label}</label>
              <input
                id={`f-${f.key}`}
                type={f.type || 'text'}
                value={value[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              />
            </div>
          )
        )}
      </div>

      {fields
        .filter((f) => f.type === 'textarea')
        .map((f) => (
          <div className="field" key={f.key} style={{ marginTop: 'var(--space-4)' }}>
            <label htmlFor={`f-${f.key}`}>{f.label}</label>
            <textarea
              id={`f-${f.key}`}
              value={value[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            />
          </div>
        ))}

      <div className="field" style={{ marginTop: 'var(--space-4)' }}>
        <label htmlFor="img">Featured image</label>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <input id="img" value={value.image ?? ''} onChange={(e) => onChange({ ...value, image: e.target.value })} placeholder="/media/… or upload" />
          <label className="btn btn--outline btn--sm" style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : 'Upload'}
            <input type="file" accept="image/*" hidden onChange={upload} />
          </label>
        </div>
        {value.image && (
          <img src={value.image} alt="" style={{ marginTop: 'var(--space-3)', maxHeight: 140, borderRadius: 'var(--radius)' }} />
        )}
      </div>

      <label style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 'var(--space-4)' }}>
        <input
          type="checkbox"
          checked={!!value.published}
          onChange={(e) => onChange({ ...value, published: e.target.checked })}
        />
        Published (visible on the website)
      </label>

      <div className="row-actions" style={{ marginTop: 'var(--space-5)' }}>
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn btn--outline" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

const NEWS_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'categories', label: 'Categories (comma separated)', placeholder: 'College News, Events' },
  { key: 'excerpt', label: 'Excerpt', placeholder: 'Short summary shown on cards' },
  { key: 'body', label: 'Article body', type: 'textarea', placeholder: 'Separate paragraphs with a blank line.' },
];

const EVENT_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'starts_at', label: 'Starts', type: 'date' },
  { key: 'ends_at', label: 'Ends', type: 'date' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

function NewsPanel() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.admin.news().then(setItems).catch((e) => alert(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setBusy(true);
    try {
      const payload = {
        ...editing,
        categories: String(editing.categories || '').split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (editing.id) await api.admin.updateNews(editing.id, payload);
      else await api.admin.createNews(payload);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await api.admin.deleteNews(item.id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (editing) {
    return (
      <Editor
        fields={NEWS_FIELDS}
        value={editing}
        onChange={setEditing}
        onSave={save}
        onCancel={() => setEditing(null)}
        busy={busy}
      />
    );
  }

  return (
    <div className="panel">
      <div className="admin__bar" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--step-1)' }}>News articles ({items.length})</h2>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing({ ...BLANK_POST })}>
          + New article
        </button>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.title}</td>
                <td>{formatDate(it.date) || '—'}</td>
                <td>
                  <span className={`chip${it.published ? '' : ' chip--muted'}`}>
                    {it.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn btn--sm"
                      onClick={() => setEditing({ ...it, categories: (it.categories || []).join(', '), body: (it.body || []).join('\n\n') })}
                    >
                      Edit
                    </button>
                    <button className="btn btn--sm btn--danger" onClick={() => remove(it)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventsPanel() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.admin.events().then(setItems).catch((e) => alert(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setBusy(true);
    try {
      if (editing.id) await api.admin.updateEvent(editing.id, editing);
      else await api.admin.createEvent(editing);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!confirm(`Delete “${item.title}”?`)) return;
    try {
      await api.admin.deleteEvent(item.id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (editing) {
    return (
      <Editor fields={EVENT_FIELDS} value={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} busy={busy} />
    );
  }

  return (
    <div className="panel">
      <div className="admin__bar" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--step-1)' }}>Events ({items.length})</h2>
        <button className="btn btn--primary btn--sm" onClick={() => setEditing({ ...BLANK_EVENT })}>
          + New event
        </button>
      </div>

      {items.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No events yet. Add the next congregation, workshop or open day.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Starts</th>
                <th>Location</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.title}</td>
                  <td>{formatDate(it.starts_at) || '—'}</td>
                  <td>{it.location || '—'}</td>
                  <td>
                    <span className={`chip${it.published ? '' : ' chip--muted'}`}>
                      {it.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn--sm" onClick={() => setEditing({ ...it })}>
                        Edit
                      </button>
                      <button className="btn btn--sm btn--danger" onClick={() => remove(it)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MessagesPanel() {
  const [items, setItems] = useState([]);
  const load = useCallback(() => api.admin.messages().then(setItems).catch((e) => alert(e.message)), []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="panel">
      <h2 style={{ fontSize: 'var(--step-1)', marginBottom: 'var(--space-4)' }}>
        Enquiries ({items.filter((m) => !m.handled).length} unread)
      </h2>

      {items.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No enquiries received yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Received</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} style={{ opacity: m.handled ? 0.55 : 1 }}>
                  <td>
                    <strong>{m.name}</strong>
                    <br />
                    <a href={`mailto:${m.email}`}>{m.email}</a>
                    {m.phone && <><br />{m.phone}</>}
                  </td>
                  <td>{m.subject || '—'}</td>
                  <td style={{ maxWidth: 380, whiteSpace: 'pre-wrap' }}>{m.message}</td>
                  <td>{formatDate(m.created_at)}</td>
                  <td>
                    <button
                      className="btn btn--sm"
                      onClick={async () => {
                        await api.admin.markMessage(m.id, !m.handled);
                        load();
                      }}
                    >
                      {m.handled ? 'Mark unread' : 'Mark handled'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  useDocumentMeta('Admin');
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('news');

  const check = useCallback(() => {
    api.admin
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => { check(); }, [check]);

  if (checking) {
    return (
      <div className="admin">
        <div className="container">
          <div className="skeleton" style={{ height: 160, maxWidth: 400, margin: '5vh auto' }} />
        </div>
      </div>
    );
  }

  if (!user) return <Login onSuccess={check} />;

  return (
    <div className="admin">
      <div className="container">
        <div className="admin__bar">
          <div>
            <h1 style={{ fontSize: 'var(--step-2)' }}>FOSCO Admin</h1>
            <p style={{ fontSize: 'var(--step--1)', color: 'var(--muted)' }}>Signed in as {user.username}</p>
          </div>
          <div className="row-actions">
            <Link to="/" className="btn btn--outline btn--sm">
              View website
            </Link>
            <button
              className="btn btn--sm"
              onClick={async () => {
                await api.admin.logout();
                setUser(null);
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="admin__tabs" style={{ marginBottom: 'var(--space-5)' }}>
          {[
            ['news', 'News'],
            ['events', 'Events'],
            ['messages', 'Enquiries'],
          ].map(([key, label]) => (
            <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'news' && <NewsPanel />}
        {tab === 'events' && <EventsPanel />}
        {tab === 'messages' && <MessagesPanel />}
      </div>
    </div>
  );
}

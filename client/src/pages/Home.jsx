import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAsync, useDocumentMeta } from '../hooks.js';
import {
  HERO_SLIDES, DEPARTMENTS, STUDENT_GUIDE, STATS, SITE, CAMPUS_HIGHLIGHTS,
  MARQUEE, TIMELINE, MOSAIC, PRINCIPAL, MOTTO_PILLARS, ADMISSIONS,
} from '../data/site.js';
import { Icon } from '../components/Icons.jsx';
import { SectionHead, NewsCard, Loading } from '../components/common.jsx';
import { Reveal, CountUp, Marquee } from '../components/motion.jsx';

function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setActive((i) => (i + 1) % HERO_SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const slide = HERO_SLIDES[active];
  const move = (direction) => setActive((i) => (i + direction + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <section className="hero">
      {HERO_SLIDES.map((s, i) => (
        <div className="hero__slide" key={s.image} data-active={i === active}>
          <img
            src={s.image}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
          />
        </div>
      ))}

      <div className="container">
        {/* Keyed on the slide so the copy re-animates on each change. */}
        <div className="hero__content" key={active}>
          <span className="hero__eyebrow">{slide.eyebrow}</span>
          <h1>{slide.title}</h1>
          <p className="hero__lead">{slide.lead}</p>
          <div className="hero__actions">
            <Link to="/admission-to-foso-college-of-education" className="btn btn--primary btn--lg">
              Apply for Admission
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/about-us" className="btn btn--glass btn--lg">
              About the College
            </Link>
          </div>
        </div>
      </div>

      <div className="hero__motto" aria-hidden="true">
        <span>{SITE.motto}</span>
      </div>

      <div className="hero__arrows" aria-label="Featured stories">
        <button type="button" onClick={() => move(-1)} aria-label="Previous story">
          <Icon name="chevronRight" size={20} />
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Next story">
          <Icon name="chevronRight" size={20} />
        </button>
      </div>

      <div className="hero__dots">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.image}
            aria-current={i === active}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setActive(i)}
          >
            <i style={{ animationDuration: i === active ? '7s' : '0s' }} />
          </button>
        ))}
      </div>
    </section>
  );
}

function CampusHighlights() {
  return (
    <section className="campus-highlights" aria-label="Explore FOSCO">
      <div className="container">
        <div className="campus-highlights__grid">
          {CAMPUS_HIGHLIGHTS.map((item, index) => (
            <Link className="campus-highlight" to={item.href} key={item.title}>
              <span className="campus-highlight__number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="campus-highlight__icon"><Icon name={item.icon} size={22} /></span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats-band section section--tight">
      <div className="container">
        <div className="grid grid--4">
          {STATS.map((s, i) => (
            <Reveal className="stat-card" key={s.label} delay={i * 90}>
              <div className="stat-card__value">
                <CountUp value={s.value} />
              </div>
              <div className="stat-card__label">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Motto() {
  return (
    <section className="section section--mesh section--dots">
      <div className="container">
        <Reveal>
          <SectionHead
            center
            eyebrow="Our motto"
            title={SITE.motto}
            text="Three words that have shaped teacher training at Foso since 1965."
          />
        </Reveal>
        <div className="grid grid--3">
          {MOTTO_PILLARS.map((p, i) => (
            <Reveal className="motto-card" key={p.word} delay={i * 110}>
              <span className="motto-card__word">{p.word}</span>
              <p>{p.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="section">
      <div className="container split">
        <Reveal variant="left">
          <SectionHead
            eyebrow={`Established ${SITE.established}`}
            title="A place of learning, expression and innovation"
          />
          <p>
            Foso College of Education is a preferred institution among the committee of Colleges for the
            training of teachers for basic schools in Ghana. It was incorporated as a co-educational teacher
            training college by Ghana&apos;s first President, Dr. Kwame Nkrumah, on the 15th of November 1965
            under the headship of the late Mr. R. R. Essah — with 240 students and 9 teaching staff.
          </p>
          <p style={{ marginTop: 'var(--space-4)' }}>
            In the years since, Fosco has run every major pre-tertiary and now tertiary teacher education
            programme in Ghana. Affiliated to the University of Cape Coast, the College currently runs the
            Bachelor of Education (JHS) and the Diploma in Basic Education.
          </p>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Link to="/about-us" className="btn btn--primary">Read our story</Link>
            <Link to="/mission-vision" className="btn btn--outline">Mission &amp; Vision</Link>
          </div>
        </Reveal>

        <Reveal variant="right" className="framed framed--badge" delay={120}>
          <img
            src="/media/2022/07/99A5211-2.jpg"
            alt="Students of Foso College of Education on campus"
            loading="lazy"
            style={{ aspectRatio: '4/3' }}
          />
          <div className="framed__badge">
            <b>{new Date().getFullYear() - SITE.established}</b>
            <span>Years</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Departments() {
  return (
    <section className="section section--alt">
      <div className="container">
        <Reveal style={{ position: 'relative' }}>
          <span className="ghost-num" aria-hidden="true">07</span>
          <SectionHead
            center
            eyebrow="Academics"
            title="College Departments"
            text="Seven teaching departments preparing trainees for the basic school classroom."
          />
        </Reveal>

        <div className="grid grid--3 dept-grid">
          {DEPARTMENTS.map((d, i) => (
            <Reveal key={d.href} delay={(i % 3) * 100}>
              <Link to={d.href} className="dept-card">
                <img src={d.image} alt="" loading="lazy" />
                <span className="dept-card__index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="dept-card__body">
                  <h3>{d.name}</h3>
                  <p className="dept-card__text">{d.summary}</p>
                  <span className="dept-card__more">
                    Explore <Icon name="arrowRight" size={14} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="section section--mesh">
      <div className="container">
        <Reveal>
          <SectionHead
            center
            eyebrow="Our story"
            title="Sixty years of training teachers"
            text="From a Ghana Education Trust complex of 240 students to a University of Cape Coast affiliate."
          />
        </Reveal>
        <div className="timeline">
          {TIMELINE.map((t, i) => (
            <Reveal className="timeline__item" key={t.year} delay={i * 80}>
              <span className="timeline__dot" aria-hidden="true" />
              <div className="timeline__year">{t.year}</div>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CampusLife() {
  return (
    <section className="section section--dark section--mesh">
      <div className="container">
        <div className="split" style={{ alignItems: 'center', marginBottom: 'var(--space-7)' }}>
          <Reveal variant="left">
            <SectionHead eyebrow="Campus life" title="Fully residential, genuinely close-knit" />
            <p style={{ color: 'rgba(255,255,255,0.76)' }}>
              We are a fully residential teacher training college made up of students, scholars and staff.
              Well equipped halls of residence, a modern library and an e-learning centre support every
              student on campus.
            </p>
            <Link to="/gallery" className="btn btn--light" style={{ marginTop: 'var(--space-6)' }}>
              See the gallery
              <Icon name="arrowRight" size={16} />
            </Link>
          </Reveal>
          <Reveal variant="right" delay={120}>
            <ul className="numbered" style={{ color: 'rgba(255,255,255,0.76)' }}>
              <li>
                <h4 style={{ color: '#fff' }}>Halls of residence</h4>
                <p>Well equipped accommodation for all students on a fully residential campus.</p>
              </li>
              <li>
                <h4 style={{ color: '#fff' }}>Library &amp; e-learning centre</h4>
                <p>A modern library and an e-learning centre used for training and research.</p>
              </li>
              <li>
                <h4 style={{ color: '#fff' }}>Guidance &amp; counselling</h4>
                <p>Staff and students are encouraged to seek guidance and counselling.</p>
              </li>
            </ul>
          </Reveal>
        </div>

        <Reveal variant="scale">
          <div className="mosaic">
            {MOSAIC.map((src, i) => (
              <Link to="/gallery" className="mosaic__cell" key={src} aria-label="Open the photo gallery">
                <img src={src} alt="" loading="lazy" />
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Principal() {
  return (
    <section className="section">
      <div className="container split split--media-first">
        <Reveal variant="left" className="framed">
          {/* Source is landscape (1000x866); forcing a portrait ratio crops the cap. */}
          <img src={PRINCIPAL.image} alt={PRINCIPAL.name} loading="lazy" />
        </Reveal>
        <Reveal variant="right" delay={120}>
          <SectionHead eyebrow="Welcome" title="Message from the Principal" />
          <figure className="quote-panel">
            <blockquote>{PRINCIPAL.quote}</blockquote>
            <figcaption>
              <strong>{PRINCIPAL.name}</strong>
              {PRINCIPAL.role}
              <p style={{ marginTop: 'var(--space-2)', color: 'var(--muted)' }}>{PRINCIPAL.detail}</p>
            </figcaption>
          </figure>
          <Link to="/principal" className="btn btn--primary" style={{ marginTop: 'var(--space-6)' }}>
            Read the full message
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function LatestNews() {
  const { data, loading } = useAsync(() => api.news({ limit: 3 }), []);

  return (
    <section className="section section--alt">
      <div className="container">
        <div
          style={{
            display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end',
            justifyContent: 'space-between', flexWrap: 'wrap',
          }}
        >
          <Reveal>
            <SectionHead eyebrow="Newsroom" title="Latest News & Events" />
          </Reveal>
          <Link to="/news" className="btn btn--outline" style={{ marginBottom: 'var(--space-6)' }}>
            View all news
          </Link>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid--3">
            {(data?.items || []).map((post, i) => (
              <Reveal key={post.slug} delay={i * 100}>
                <NewsCard post={post} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StudentGuide() {
  return (
    <section className="section section--tint">
      <div className="container">
        <Reveal>
          <SectionHead center eyebrow="For students" title="Students Guide Information" />
        </Reveal>
        <div className="grid grid--3">
          {STUDENT_GUIDE.map((g, i) => (
            <Reveal key={g.href} delay={i * 110}>
              <Link to={g.href} className="tile tile--lift">
                <span className="tile__icon">
                  <Icon name={g.icon} size={24} />
                </span>
                <h3>{g.title}</h3>
                <p>{g.text}</p>
                <span className="btn btn--ghost" style={{ marginTop: 'auto' }}>
                  Learn more <Icon name="arrowRight" size={15} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="cta">
      <img src="/media/2022/07/99A5038-scaled-e1658783648572.jpg" alt="" loading="lazy" />
      <div className="container container--narrow" style={{ textAlign: 'center', position: 'relative' }}>
        <Reveal>
          <span className="hero__eyebrow">{ADMISSIONS.academicYear} admissions are open</span>
          <h2 style={{ color: '#fff', marginBottom: 'var(--space-4)' }}>Ready to train as a teacher?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 'var(--space-6)' }}>
            Apply for the four-year Bachelor of Education programme by {ADMISSIONS.deadline}.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/admission-to-foso-college-of-education" className="btn btn--primary btn--lg">
              Admission information
            </Link>
            <Link to="/contact-us" className="btn btn--glass btn--lg">
              Contact the College
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  useDocumentMeta(
    'Foso College of Education',
    'Foso College of Education (FOSCO) — a public college of education in Assin Fosu, Central Region, Ghana, training basic school teachers since 1965.'
  );

  return (
    <>
      <Hero />
      <CampusHighlights />
      <Marquee items={MARQUEE} />
      <About />
      <Stats />
      <Motto />
      <Departments />
      <Story />
      <CampusLife />
      <Principal />
      <LatestNews />
      <StudentGuide />
      <CallToAction />
    </>
  );
}

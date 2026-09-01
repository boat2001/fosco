import { useEffect, useRef, useState } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Reveals children once they scroll into view. Animates a single time. */
export function Reveal({ as: Tag = 'div', variant, delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const classes = ['reveal', variant ? `reveal--${variant}` : '', className].filter(Boolean).join(' ');

  return (
    <Tag ref={ref} className={classes} data-visible={visible} style={{ '--reveal-delay': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Counts up to a target when scrolled into view. `value` may carry non-numeric
 * decoration ("1,185+", "1965") — the digits animate, the rest is preserved.
 */
export function CountUp({ value, duration = 1600 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const digits = String(value).replace(/[^\d]/g, '');
    const target = Number(digits);
    if (!digits || Number.isNaN(target) || prefersReduced()) {
      setDisplay(value);
      return;
    }

    const prefix = String(value).slice(0, String(value).indexOf(digits[0]));
    const suffix = String(value).slice(String(value).lastIndexOf(digits[digits.length - 1]) + 1);
    const grouped = /,/.test(String(value));

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          // Ease-out cubic so the count decelerates into place.
          const eased = 1 - Math.pow(1 - t, 3);
          const n = Math.round(target * eased);
          setDisplay(prefix + (grouped ? n.toLocaleString('en-GB') : String(n)) + suffix);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {display ?? String(value).replace(/\d/g, '0')}
    </span>
  );
}

/** Infinite horizontal ticker. Items are duplicated to make the loop seamless. */
export function Marquee({ items }) {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[...items, ...items].map((item, i) => (
          <span className="marquee__item" key={i}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

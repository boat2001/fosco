import { Link } from 'react-router-dom';
import { Icon } from './Icons.jsx';

const isInternal = (href = '') => href.startsWith('/') && !href.startsWith('//');

function Heading({ block }) {
  const Tag = `h${Math.min(Math.max(block.level || 2, 2), 6)}`;
  return <Tag>{block.text}</Tag>;
}

/**
 * Rich text originates from our own archive extraction, where tags and attributes
 * were already whitelisted (see scripts/extract-content.mjs). It is trusted
 * first-party content, not user input.
 */
function RichText({ block, lead = false }) {
  return (
    <div
      className={lead ? 'rich-text rich-text--lead' : 'rich-text'}
      dangerouslySetInnerHTML={{ __html: block.html }}
    />
  );
}

function InfoBox({ block }) {
  const body = (
    <>
      {block.image && <img src={block.image} alt="" loading="lazy" />}
      <h3>{block.title}</h3>
      {block.description && <p>{block.description}</p>}
    </>
  );

  if (block.href && isInternal(block.href)) {
    return (
      <Link to={block.href} className="tile" style={{ color: 'inherit' }}>
        {body}
      </Link>
    );
  }
  return <div className="tile">{body}</div>;
}

function Button({ block }) {
  if (!block.href) return null;
  return isInternal(block.href) ? (
    <Link to={block.href} className="btn btn--primary">
      {block.text}
      <Icon name="arrowRight" size={16} />
    </Link>
  ) : (
    <a className="btn btn--primary" href={block.href} target="_blank" rel="noreferrer">
      {block.text}
    </a>
  );
}

function Block({ block, lead = false }) {
  switch (block.type) {
    case 'heading':
      return <Heading block={block} />;
    case 'sectionHeading':
      return (
        <div className="section-head" style={{ marginBottom: 0 }}>
          {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
          <h2>{block.text}</h2>
        </div>
      );
    case 'richText':
      return <RichText block={block} lead={lead} />;
    case 'image':
      return <img src={block.src} alt={block.alt || ''} loading="lazy" />;
    case 'infoBox':
      return <InfoBox block={block} />;
    case 'button':
      return <Button block={block} />;
    case 'divider':
      return <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />;
    default:
      return null;
  }
}

/**
 * Renders a page's extracted blocks. Consecutive info boxes are collected into a
 * grid so they read as a card row rather than a stack.
 */
export function Blocks({ blocks = [] }) {
  const out = [];
  // The opening paragraph gets a drop cap; find it once up front.
  const leadIndex = blocks.findIndex((b) => b.type === 'richText');

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].type === 'infoBox') {
      const group = [];
      while (i < blocks.length && blocks[i].type === 'infoBox') group.push(blocks[i++]);
      i--;
      out.push(
        <div className="grid grid--3" key={`grp-${i}`}>
          {group.map((b, j) => (
            <Block block={b} key={j} />
          ))}
        </div>
      );
    } else {
      out.push(<Block block={blocks[i]} lead={i === leadIndex} key={i} />);
    }
  }
  return <div className="prose">{out}</div>;
}

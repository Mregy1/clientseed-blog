import React, { useState, useEffect, useRef } from 'react';

interface Heading {
  id: string;
  text: string;
  level: string;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const scrollObsRef = useRef<IntersectionObserver | null>(null);
  const tocRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function buildToc(): boolean {
      const post = document.querySelector('[data-post-body]');
      if (!post) return false;

      const headingEls = Array.from(post.querySelectorAll('h2, h3')) as HTMLElement[];
      if (headingEls.length < 2) return false;

      // Tear down previous scroll observer before rebuilding
      if (scrollObsRef.current) {
        scrollObsRef.current.disconnect();
        scrollObsRef.current = null;
      }

      const items: Heading[] = headingEls.map((h, i) => {
        if (!h.id) {
          h.id = `h-${i}-${(h.textContent ?? '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')}`;
        }
        return { id: h.id, text: h.textContent ?? '', level: h.tagName };
      });

      setHeadings(items);

      // ── CSS Scroll-Driven Animation TOC (dandenney style) ─────────────
      // Use IntersectionObserver as fallback + primary for now.
      // CSS scroll-timeline will be added when browser support is broader.
      // ──────────────────────────────────────────────────────────────────

      // Track which heading is in view
      const scrollObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: '-20% 0% -70% 0%' }
      );

      headingEls.forEach((h) => scrollObs.observe(h));
      scrollObsRef.current = scrollObs;

      // Set first heading active initially
      if (items.length > 0 && !activeId) {
        setActiveId(items[0].id);
      }

      return true;
    }

    // ── Strategy ──────────────────────────────────────────────────────────
    // TableOfContents renders *after* [data-post-body] in the JSX tree, so
    // the container exists immediately — but TinaMarkdown is a React subtree
    // that paints its headings on a later render cycle. buildToc() called
    // synchronously will find 0 headings and return false.
    // ──────────────────────────────────────────────────────────────────────

    if (buildToc()) return;

    function watchPostBody() {
      const post = document.querySelector('[data-post-body]');
      if (!post) return null;

      const contentObs = new MutationObserver(() => {
        if (buildToc()) {
          contentObs.disconnect();
        }
      });
      contentObs.observe(post, { childList: true, subtree: true });
      return contentObs;
    }

    let contentObs = watchPostBody();

    let bodyObs: MutationObserver | null = null;
    if (!contentObs) {
      bodyObs = new MutationObserver(() => {
        if (document.querySelector('[data-post-body]')) {
          bodyObs!.disconnect();
          bodyObs = null;
          contentObs = watchPostBody();
          if (contentObs && buildToc()) {
            contentObs.disconnect();
            contentObs = null;
          }
        }
      });
      bodyObs.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      bodyObs?.disconnect();
      contentObs?.disconnect();
      scrollObsRef.current?.disconnect();
    };
  }, []);

  // Smooth scroll to heading
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const visible = headings.length >= 2;

  return (
    <nav
      ref={tocRef}
      className={`toc ${visible ? 'toc-visible' : 'toc-hidden'}`}
      id="toc"
      aria-label="Table of contents"
    >
      <div className="toc-inner">
        <p className="toc-heading">Contents</p>
        <ul className="toc-list">
          {headings.map((h) => (
            <li key={h.id} className={h.level === 'H3' ? 'toc-sub' : ''}>
              <a
                href={`#${h.id}`}
                className={activeId === h.id ? 'active' : ''}
                onClick={(e) => handleClick(e, h.id)}
                data-toc-slug={h.id}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

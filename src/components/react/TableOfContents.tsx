import React, { useState, useEffect, useRef } from 'react';

interface Heading {
  id: string;
  text: string;
  level: string;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const scrollObsRef = useRef<IntersectionObserver | null>(null);

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

      // Scroll-spy: highlight the heading currently in view
      const scrollObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const toc = document.getElementById('toc');
              if (!toc) return;
              toc.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
              toc
                .querySelector(`a[href="#${entry.target.id}"]`)
                ?.classList.add('active');
            }
          });
        },
        { rootMargin: '-20% 0% -70% 0%' }
      );

      headingEls.forEach((h) => scrollObs.observe(h));
      scrollObsRef.current = scrollObs;

      return true;
    }

    // ── Strategy ──────────────────────────────────────────────────────────
    // TableOfContents renders *after* [data-post-body] in the JSX tree, so
    // the container exists immediately — but TinaMarkdown is a React subtree
    // that paints its headings on a later render cycle. buildToc() called
    // synchronously will find 0 headings and return false.
    //
    // Fix: watch [data-post-body] itself for subtree changes. The moment
    // TinaMarkdown inserts any h2/h3 we get a callback; we try buildToc()
    // and disconnect as soon as it succeeds (≥2 headings found).
    // ──────────────────────────────────────────────────────────────────────

    // Attempt immediately in case hydration already completed (e.g. fast
    // machines or a cached render where React flushes synchronously).
    if (buildToc()) return;

    // Watch [data-post-body] for heading insertion.
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

    // If [data-post-body] isn't mounted yet either, watch the document body
    // until it appears, then switch to watching its contents.
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

  const visible = headings.length >= 2;

  return (
    <nav
      className={`toc ${visible ? 'toc-visible' : 'toc-hidden'}`}
      id="toc"
      aria-label="Table of contents"
    >
      <p className="toc-heading">Contents</p>
      <ul className="toc-list">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 'H3' ? 'toc-sub' : ''}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

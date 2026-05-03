import React, { useState, useEffect } from 'react';

interface Heading {
  id: string;
  text: string;
  level: string;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    function buildToc() {
      const post = document.querySelector('[data-post-body]');
      if (!post) return;

      const headingEls = Array.from(post.querySelectorAll('h2, h3')) as HTMLElement[];
      if (headingEls.length < 2) return;

      const items: Heading[] = headingEls.map((h, i) => {
        if (!h.id) {
          h.id = `h-${i}-${(h.textContent ?? '')
            .trim().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')}`;
        }
        return { id: h.id, text: h.textContent ?? '', level: h.tagName };
      });

      setHeadings(items);

      // Scroll-spy: highlight the heading currently in view
      const scrollObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const toc = document.getElementById('toc');
            if (!toc) return;
            toc.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
            toc.querySelector(`a[href="#${entry.target.id}"]`)?.classList.add('active');
          }
        });
      }, { rootMargin: '-20% 0% -70% 0%' });

      headingEls.forEach((h) => scrollObs.observe(h));
    }

    // Try immediately — [data-post-body] likely already exists in the DOM
    buildToc();

    // Fallback: if not ready yet, observe until it appears
    if (!document.querySelector('[data-post-body]')) {
      const obs = new MutationObserver(() => {
        if (document.querySelector('[data-post-body]')) {
          obs.disconnect();
          buildToc();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      return () => obs.disconnect();
    }
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
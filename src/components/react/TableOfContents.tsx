import React, { useEffect, useRef } from 'react';

export default function TableOfContents() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function buildToc() {
      const nav = navRef.current;
      if (!nav) return;

      const list = nav.querySelector('.toc-list');
      if (!list) return;
      list.innerHTML = '';

      const post = document.querySelector('[data-post-body]');
      if (!post) return;

      const headings = Array.from(post.querySelectorAll('h2, h3')) as HTMLElement[];
      if (headings.length < 2) {
        nav.style.display = 'none';
        return;
      }

      nav.style.display = '';

      headings.forEach((heading, i) => {
        if (!heading.id) {
          heading.id = `h-${i}-${(heading.textContent ?? '')
            .trim().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')}`;
        }

        const li = document.createElement('li');

        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent ?? '';
        a.addEventListener('click', (e) => {
          e.preventDefault();
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, '', `#${heading.id}`);
        });

        li.appendChild(a);
        list.appendChild(li);
      });

      const scrollObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            list.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
            list.querySelector(`a[href="#${entry.target.id}"]`)?.classList.add('active');
          }
        });
      }, { rootMargin: '-20% 0% -70% 0%' });

      headings.forEach((h) => scrollObs.observe(h));
    }

    function waitForBody() {
      if (document.querySelector('[data-post-body]')) {
        buildToc();
      } else {
        const obs = new MutationObserver(() => {
          if (document.querySelector('[data-post-body]')) {
            obs.disconnect();
            buildToc();
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      }
    }

    document.addEventListener('astro:page-load', waitForBody);
    waitForBody();
  }, []);

  return (
    <nav
      ref={navRef}
      className="toc"
      id="toc"
      aria-label="Table of contents"
      style={{ display: 'none' }}
    >
      <p className="toc-heading">Contents</p>
      <ul className="toc-list"></ul>
    </nav>
  );
}
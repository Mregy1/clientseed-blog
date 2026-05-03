import React from 'react';
import { tinaField, useTina } from "tinacms/dist/react";
import type { BlogQuery, BlogQueryVariables } from '../__generated__/types';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import FormattedDate from '../../src/components/react/FormattedDate.tsx';
import TableOfContents from '../../src/components/react/TableOfContents.tsx';

type Props = {
  variables: BlogQueryVariables;
  data: BlogQuery;
  query: string;
};

function extractText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.type === 'text') return node.text ?? '';
  if (Array.isArray(node.children)) return node.children.map(extractText).join(' ');
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  return '';
}

export default function AdminBlogPost(props: Props) {
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });

  const blog = data.blog;

  const wordCount = extractText(blog.body).split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <>
      {/* Hero image — full viewport width */}
      <div data-tina-field={tinaField(blog, "heroImage")} className="hero-image">
        {blog.heroImage && (
          <img
            width={1200}
            height={800}
            src={blog.heroImage}
            alt={`Cover image for ${blog.title}`}
            loading="eager"
            decoding="async"
          />
        )}
      </div>

      <div className="prose">
        <div className="title">
          {/* Date + reading time row */}
          <div className="post-meta-bar">
            <span data-tina-field={tinaField(blog, "pubDate")}>
              <FormattedDate date={blog.pubDate} />
            </span>
            <span className="reading-time-badge" aria-label={`${readingTime} minute read`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ verticalAlign: 'middle', marginRight: '4px' }}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {readingTime} min read
            </span>
          </div>

          {/* Title */}
          <h1 data-tina-field={tinaField(blog, "title")}>{blog.title}</h1>

          {/* Updated date */}
          {blog.updatedDate && (
            <div
              className="updated-notice"
              data-tina-field={tinaField(blog, "updatedDate")}
            >
              Last updated on <FormattedDate date={blog.updatedDate} />
            </div>
          )}

          <hr />
        </div>

        {/* Body */}
        <div data-tina-field={tinaField(blog, "body")} data-post-body>
          <TinaMarkdown content={blog.body} />
        </div>
      </div>

      {/* TOC sidebar — sibling of .prose, positioned by CSS outside the content column */}
      <TableOfContents />
    </>
  );
}
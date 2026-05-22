#!/usr/bin/env node
// Tiny static-blog generator: Markdown posts -> HTML pages, index, RSS.
// Reads site/posts/*.md, writes dist/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDir = path.join(root, 'site');
const distDir = path.join(root, 'dist');

const site = JSON.parse(fs.readFileSync(path.join(siteDir, 'site.json'), 'utf8'));

// --- frontmatter parser (minimal, no YAML dep) ----------------------

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    meta[m[1]] = value;
  }
  return { meta, body: match[2] };
}

// --- markdown preprocessor ------------------------------------------
// Demote headings by one level (so post.title stays the only h1), and
// translate Obsidian-style image embeds (![[file]]) into standard md.

function preprocessBody(src) {
  const lines = src.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    // Demote heading: # x -> ## x, up to ###### (cap at 6)
    const h = line.match(/^(#{1,5}) (.*)$/);
    if (h) lines[i] = '#' + h[1] + ' ' + h[2];
    // ![[image.ext]] -> ![](image.ext)
    lines[i] = lines[i].replace(/!\[\[([^\]]+)\]\]/g, (_, p) => `![](${p})`);
  }
  return lines.join('\n');
}

// --- helpers --------------------------------------------------------

function slugify(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function rfc822(d) {
  return d.toUTCString();
}

function applyTemplate(tpl, values) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '');
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

// --- read posts -----------------------------------------------------

const postsDir = path.join(siteDir, 'posts');
const postFiles = fs.existsSync(postsDir)
  ? fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
  : [];

const posts = postFiles.map(file => {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const title = meta.title || file.replace(/\.md$/, '');
  const date = meta.date ? new Date(meta.date) : new Date();
  const slug = meta.slug || slugify(title);
  const summary = meta.summary || '';
  const subtitle = meta.subtitle || '';
  const html = marked.parse(preprocessBody(body));
  return { title, date, slug, summary, subtitle, html };
}).sort((a, b) => b.date - a.date);

// --- read templates -------------------------------------------------

const tpl = {
  index: fs.readFileSync(path.join(siteDir, 'templates/index.html'), 'utf8'),
  post:  fs.readFileSync(path.join(siteDir, 'templates/post.html'), 'utf8'),
  feed:  fs.readFileSync(path.join(siteDir, 'templates/feed.xml'), 'utf8'),
};

// --- write dist -----------------------------------------------------

ensureDir(distDir);

// copy static assets
fs.copyFileSync(path.join(siteDir, 'style.css'), path.join(distDir, 'style.css'));
copyDir(path.join(siteDir, 'fonts'), path.join(distDir, 'fonts'));

// favicons + icons from repo root
for (const f of ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png',
                 'apple-touch-icon.png', 'android-chrome-192x192.png',
                 'android-chrome-512x512.png']) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, f));
}

const year = new Date().getFullYear();

// post pages
ensureDir(path.join(distDir, 'posts'));

// copy any non-md assets in site/posts/ (images, etc.) to dist/posts/
for (const f of fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : []) {
  if (f.endsWith('.md')) continue;
  fs.copyFileSync(path.join(postsDir, f), path.join(distDir, 'posts', f));
}

for (const post of posts) {
  const out = applyTemplate(tpl.post, {
    site_title: site.title,
    site_tagline: site.tagline,
    author: site.author,
    post_title: post.title,
    post_subtitle: post.subtitle ? `<p class="post-subtitle">${post.subtitle}</p>` : '',
    post_summary: post.summary,
    post_date: fmtDate(post.date),
    post_iso: post.date.toISOString(),
    post_content: post.html,
    year,
  });
  fs.writeFileSync(path.join(distDir, 'posts', `${post.slug}.html`), out);
}

// index
const postList = posts.length === 0
  ? '<li><p style="color: var(--ink-faint); font-family: var(--sans); font-size: 0.875rem;">No posts yet.</p></li>'
  : posts.map(p => `
      <li>
        <a class="post-title" href="/posts/${p.slug}.html">${p.title}</a>
        <div class="post-meta"><time datetime="${p.date.toISOString()}">${fmtDate(p.date)}</time></div>
        ${p.summary ? `<p class="post-summary">${p.summary}</p>` : ''}
      </li>`).join('\n');

const indexOut = applyTemplate(tpl.index, {
  site_title: site.title,
  site_tagline: site.tagline,
  author: site.author,
  post_list: postList,
  year,
});
fs.writeFileSync(path.join(distDir, 'index.html'), indexOut);

// RSS feed
const items = posts.map(p => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${site.url}/posts/${p.slug}.html</link>
      <guid isPermaLink="true">${site.url}/posts/${p.slug}.html</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      ${p.summary ? `<description>${escapeXml(p.summary)}</description>` : ''}
      <content:encoded><![CDATA[${p.html}]]></content:encoded>
    </item>`).join('\n');

const feedOut = applyTemplate(tpl.feed, {
  site_title: site.title,
  site_tagline: site.tagline,
  site_url: site.url,
  build_rfc822: rfc822(new Date()),
  items,
}).replace('<rss version="2.0"', '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"');

fs.writeFileSync(path.join(distDir, 'feed.xml'), feedOut);

console.log(`Built ${posts.length} post${posts.length === 1 ? '' : 's'} to ${path.relative(root, distDir)}/`);

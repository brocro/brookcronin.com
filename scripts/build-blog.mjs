#!/usr/bin/env node
// Tiny static-blog generator: Markdown posts -> HTML pages, index, RSS.
//
// Post layouts (both supported):
//   site/posts/<slug>/index.md   (folder with co-located images/assets)
//   site/posts/<name>.md         (single file, no assets)
//
// Output for each post is dist/posts/<slug>/index.html so URLs are
// /posts/<slug>/ and image paths in the markdown resolve cleanly.

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

// --- draftsman's notes ----------------------------------------------
// Obsidian-style callouts (`> [!note] Title`) render as a visible
// aside in local builds and are stripped entirely in CI. This lets
// you leave editorial notes inside a post without leaking them to the
// live site. Obsidian renders the same syntax as a native callout in
// its preview, so the author sees them there too.

function processDraftNotes(src) {
  const isCI = process.env.CI === 'true';
  const calloutRegex = /^> \[!note\].*(?:\n> ?.*)*/gm;
  return src.replace(calloutRegex, (match) => {
    if (isCI) return '';
    const lines = match.split('\n');
    const titleRaw = lines[0].replace(/^> \[!note\]\s*/, '').trim();
    const title = titleRaw || 'Note';
    const contentLines = lines.slice(1).map(l => l.replace(/^> ?/, ''));
    // Group content lines into paragraphs by blank lines
    const paragraphs = [];
    let current = [];
    for (const line of contentLines) {
      if (line.trim().length === 0) {
        if (current.length > 0) { paragraphs.push(current.join(' ')); current = []; }
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) paragraphs.push(current.join(' '));
    const titleHtml = `<div class="draftsman-note-title">${escapeHtml(title)}</div>`;
    const contentHtml = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    return `\n\n<aside class="draftsman-note">${titleHtml}${contentHtml}</aside>\n\n`;
  });
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
    const h = line.match(/^(#{1,5}) (.*)$/);
    if (h) lines[i] = '#' + h[1] + ' ' + h[2];
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

function escapeHtml(s) {
  return s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
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
// Each post resolves to { mdPath, assetDir, defaultSlug }:
//   - folder form: mdPath=<slug>/index.md, assetDir=<slug>/, defaultSlug=<slug>
//   - flat form:   mdPath=<name>.md,        assetDir=null,    defaultSlug=<name without date prefix>

const postsDir = path.join(siteDir, 'posts');
const entries = fs.existsSync(postsDir)
  ? fs.readdirSync(postsDir, { withFileTypes: true })
  : [];

const sources = [];
for (const entry of entries) {
  if (entry.isDirectory()) {
    const folder = path.join(postsDir, entry.name);
    // Prefer index.md if present; otherwise use the single .md in the folder.
    let mdPath = null;
    const indexMd = path.join(folder, 'index.md');
    if (fs.existsSync(indexMd)) {
      mdPath = indexMd;
    } else {
      const mdFiles = fs.readdirSync(folder).filter(f => f.endsWith('.md'));
      if (mdFiles.length === 1) {
        mdPath = path.join(folder, mdFiles[0]);
      } else if (mdFiles.length > 1) {
        console.warn(`Skipping ${entry.name}: multiple .md files, none named index.md`);
        continue;
      }
    }
    if (mdPath) {
      sources.push({
        mdPath,
        assetDir: folder,
        defaultSlug: entry.name,
      });
    }
  } else if (entry.name.endsWith('.md')) {
    // Strip a leading YYYY-MM-DD- if present so the slug is clean.
    const base = entry.name.replace(/\.md$/, '');
    const cleanBase = base.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    sources.push({
      mdPath: path.join(postsDir, entry.name),
      assetDir: null,
      defaultSlug: cleanBase,
    });
  }
}

const posts = sources.map(({ mdPath, assetDir, defaultSlug }) => {
  const raw = fs.readFileSync(mdPath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const title = meta.title || defaultSlug;
  const date = meta.date ? new Date(meta.date) : new Date();
  const slug = meta.slug || slugify(defaultSlug);
  const summary = meta.summary || '';
  const subtitle = meta.subtitle || '';
  const html = marked.parse(processDraftNotes(preprocessBody(body)));
  return { title, date, slug, summary, subtitle, html, assetDir };
}).sort((a, b) => b.date - a.date);

// --- read templates -------------------------------------------------

const tpl = {
  index: fs.readFileSync(path.join(siteDir, 'templates/index.html'), 'utf8'),
  post:  fs.readFileSync(path.join(siteDir, 'templates/post.html'), 'utf8'),
  feed:  fs.readFileSync(path.join(siteDir, 'templates/feed.xml'), 'utf8'),
};

// --- write dist -----------------------------------------------------

ensureDir(distDir);

// shared assets
fs.copyFileSync(path.join(siteDir, 'style.css'), path.join(distDir, 'style.css'));
copyDir(path.join(siteDir, 'fonts'), path.join(distDir, 'fonts'));

// favicons from repo root
for (const f of ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png',
                 'apple-touch-icon.png', 'android-chrome-192x192.png',
                 'android-chrome-512x512.png']) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, f));
}

const year = new Date().getFullYear();

ensureDir(path.join(distDir, 'posts'));

// per-post: write index.html and copy assets
for (const post of posts) {
  const postDir = path.join(distDir, 'posts', post.slug);
  ensureDir(postDir);

  if (post.assetDir) {
    for (const f of fs.readdirSync(post.assetDir)) {
      if (f.endsWith('.md')) continue; // don't ship raw markdown to dist
      const src = path.join(post.assetDir, f);
      const dst = path.join(postDir, f);
      if (fs.statSync(src).isFile()) fs.copyFileSync(src, dst);
    }
  }

  const out = applyTemplate(tpl.post, {
    site_title: site.title,
    site_tagline: site.tagline,
    author: site.author,
    post_title: escapeHtml(post.title),
    post_subtitle: post.subtitle ? `<p class="post-subtitle">${escapeHtml(post.subtitle)}</p>` : '',
    post_summary: escapeHtml(post.summary),
    post_date: fmtDate(post.date),
    post_iso: post.date.toISOString(),
    post_content: post.html,
    year,
  });
  fs.writeFileSync(path.join(postDir, 'index.html'), out);
}

// index
const postList = posts.length === 0
  ? '<li><p style="color: var(--ink-faint); font-family: var(--sans); font-size: 0.875rem;">No posts yet.</p></li>'
  : posts.map(p => {
      const dek = p.summary || p.subtitle;
      return `
      <li>
        <a class="post-title" href="/posts/${p.slug}/">${escapeHtml(p.title)}</a>
        <div class="post-meta"><time datetime="${p.date.toISOString()}">${fmtDate(p.date)}</time></div>
        ${dek ? `<p class="post-dek">${escapeHtml(dek)}</p>` : ''}
        <a class="post-link" href="/posts/${p.slug}/">Read &rarr;</a>
      </li>`;
    }).join('\n');

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
      <link>${site.url}/posts/${p.slug}/</link>
      <guid isPermaLink="true">${site.url}/posts/${p.slug}/</guid>
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

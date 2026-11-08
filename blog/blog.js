/**
 * Client-Side Direct Markdown Blog Loader
 * Loads raw .md files from _posts/ directly in the browser and parses them via 'marked'.
 * Storing blog posts only once in _posts/*.md!
 */

(function () {
  const listView = document.getElementById('blog-list-view');
  const postView = document.getElementById('blog-post-view');
  const postsContainer = document.getElementById('posts-container');

  // Regex to extract date and slug from standard Jekyll file naming: YYYY-MM-DD-slug.md
  const FILENAME_REGEX = /^(\d{4}-\d{2}-\d{2})-(.*)\.md$/;

  // Simple frontmatter parser
  function parseFrontMatter(text) {
    if (!text.startsWith('---')) {
      return { meta: {}, content: text };
    }
    const endIdx = text.indexOf('\n---', 3);
    if (endIdx === -1) {
      return { meta: {}, content: text };
    }
    const rawYaml = text.substring(3, endIdx).trim();
    const content = text.substring(endIdx + 4).trim();
    const meta = {};

    rawYaml.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.substring(0, colonIdx).trim();
        let val = line.substring(colonIdx + 1).trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          val = val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
        } else {
          val = val.replace(/^['"]|['"]$/g, '');
        }
        meta[key] = val;
      }
    });

    return { meta, content };
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch (e) { }
    return dateStr;
  }

  // Load a single markdown file directly
  async function loadPost(filename) {
    listView.style.display = 'none';
    postView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const postDateEl = document.getElementById('post-date');
    const postCategoriesEl = document.getElementById('post-categories');
    const postTitleEl = document.getElementById('post-title');
    const postTagsEl = document.getElementById('post-tags');
    const postContentEl = document.getElementById('post-content');

    postContentEl.innerHTML = '<p class="blog-loading">Loading article from markdown...</p>';

    try {
      const res = await fetch(`/_posts/${filename}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawText = await res.text();
      const { meta, content } = parseFrontMatter(rawText);

      const match = filename.match(FILENAME_REGEX);
      const fallbackDate = match ? match[1] : '';
      const fallbackTitle = match ? match[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : filename;

      const dateStr = (meta.date ? String(meta.date).split(' ')[0] : fallbackDate);
      const title = meta.title || fallbackTitle;

      document.title = `${title} - Ayudh Khajne`;

      postDateEl.textContent = formatDate(dateStr);
      postDateEl.setAttribute('datetime', dateStr);

      // Categories
      postCategoriesEl.innerHTML = '';
      if (meta.categories && Array.isArray(meta.categories)) {
        meta.categories.forEach(cat => {
          const span = document.createElement('span');
          span.className = 'post-category';
          span.textContent = cat;
          postCategoriesEl.appendChild(span);
        });
      }

      postTitleEl.textContent = title;

      // Tags
      postTagsEl.innerHTML = '';
      if (meta.tags && Array.isArray(meta.tags)) {
        meta.tags.forEach(tag => {
          const span = document.createElement('span');
          span.className = 'blog-tag';
          span.textContent = `#${tag}`;
          postTagsEl.appendChild(span);
        });
      }

      // Convert Markdown body using marked library
      if (window.marked && typeof window.marked.parse === 'function') {
        postContentEl.innerHTML = window.marked.parse(content);
      } else {
        postContentEl.innerHTML = `<pre style="white-space: pre-wrap;">${content}</pre>`;
      }
    } catch (err) {
      postContentEl.innerHTML = `
        <div class="error-notice">
          <p>Could not load the markdown file <code>${filename}</code> directly.</p>
          <p><a href="/blog/">&larr; Return to all posts</a></p>
        </div>
      `;
    }
  }

  // Load the list of markdown posts from _posts/posts.json
  async function loadBlogList() {
    postView.style.display = 'none';
    listView.style.display = 'block';
    document.title = 'Blog - Ayudh Khajne';

    try {
      const res = await fetch('/_posts/posts.json');
      if (!res.ok) throw new Error('posts.json could not be loaded');
      const files = await res.json();

      // Fetch frontmatter for each file in parallel
      const postPromises = files.map(async (filename) => {
        try {
          const fileRes = await fetch(`/_posts/${filename}`);
          if (!fileRes.ok) return null;
          const text = await fileRes.text();
          const { meta, content } = parseFrontMatter(text);

          const match = filename.match(FILENAME_REGEX);
          const fileDate = match ? match[1] : '';
          const fallbackTitle = match ? match[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : filename;

          const date = (meta.date ? String(meta.date).split(' ')[0] : fileDate);
          const title = meta.title || fallbackTitle;
          const summary = meta.summary || content.slice(0, 160).replace(/[#*`_]/g, '') + '...';
          const tags = Array.isArray(meta.tags) ? meta.tags : [];

          return { filename, title, date, summary, tags };
        } catch (e) {
          return null;
        }
      });

      const posts = (await Promise.all(postPromises)).filter(Boolean);

      // Sort posts strictly by date descending (most recent on top)
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      postsContainer.innerHTML = '';

      if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="blog-empty">No articles published yet.</p>';
        return;
      }

      posts.forEach((post, index) => {
        const isFirst = index === 0;
        const card = document.createElement('article');
        card.className = `blog-card ${isFirst ? 'featured-post' : ''}`;

        const tagsHtml = post.tags.map(t => `<span class="blog-tag">#${t}</span>`).join('');

        card.innerHTML = `
          <div class="blog-card-meta">
            <time class="blog-date" datetime="${post.date}">
              ${formatDate(post.date)}
            </time>
            ${isFirst ? '<span class="recent-tag">Latest Post</span>' : ''}
          </div>
          <h2 class="blog-card-title">
            <a href="?post=${encodeURIComponent(post.filename)}" class="post-title-link" data-filename="${post.filename}">
              ${post.title}
            </a>
          </h2>
          <p class="blog-card-summary">${post.summary}</p>
          ${post.tags.length ? `<div class="blog-tags">${tagsHtml}</div>` : ''}
          <div class="blog-card-footer">
            <a href="?post=${encodeURIComponent(post.filename)}" class="read-more-link" data-filename="${post.filename}">
              Read Article &rarr;
            </a>
          </div>
        `;

        // Intercept clicks to avoid full reloads when navigating to a post
        card.querySelectorAll('a[data-filename]').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const fn = link.getAttribute('data-filename');
            history.pushState({ post: fn }, '', `?post=${encodeURIComponent(fn)}`);
            loadPost(fn);
          });
        });

        postsContainer.appendChild(card);
      });

    } catch (err) {
      postsContainer.innerHTML = `
        <div class="error-notice">
          <p>Failed to load articles from <code>_posts/</code>.</p>
        </div>
      `;
    }
  }

  // Handle URL route query parameter ?post=2026-11-08-welcome-to-my-blog.md
  function handleRoute() {
    const params = new URLSearchParams(window.location.search);
    const postParam = params.get('post');
    if (postParam) {
      loadPost(postParam);
    } else {
      loadBlogList();
    }
  }

  // Handle back / forward browser navigation buttons
  window.addEventListener('popstate', handleRoute);

  // Return to list button events
  const backToListLink = document.getElementById('back-to-list-link');
  const returnBlogBtn = document.getElementById('return-blog-btn');

  function goBack(e) {
    e.preventDefault();
    history.pushState({}, '', '/blog/');
    loadBlogList();
  }

  if (backToListLink) backToListLink.addEventListener('click', goBack);
  if (returnBlogBtn) returnBlogBtn.addEventListener('click', goBack);

  // Initial load
  handleRoute();
})();

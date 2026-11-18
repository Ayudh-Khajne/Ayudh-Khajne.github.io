---
layout: default
title: My Website - Adding Search Functionality for My Posts
date: 2026-11-17 23:00:00 +0530
categories:
  - web
  - technology
tags:
  - blog-post
  - web-development
  - antigravity
  - git
summary: How to add a search bar to a blog site.
---
You may have seen my [blog](/blog/) page previously. If not, here is a screenshot:

![](../assets/blog/2026-11-09-blog-page-screenshot.png)

As you can see, if there are too many posts, you are going to have a hard time finding what you want. So, let's add a search bar to the blog.

### Why Add Client-Side Search?

Because this site is statically hosted on GitHub Pages with posts stored as raw Markdown files in `_posts/`, there is no traditional backend database or server-side search engine. 

Instead of adding heavy third-party search widgets or complex indexing pipelines, we built a fast, lightweight, and completely client-side search solution directly into our vanilla JavaScript blog loader.

---

### Step 1: Placing the Search Bar in HTML

We placed the search bar inside the blog header in `blog/index.html`, right beneath the `.blog-description`:

```html
<div class="blog-search-container">
  <div class="search-input-wrapper">
    <svg class="search-icon" ...><!-- Magnifying glass SVG --></svg>
    <input 
      type="search" 
      id="blog-search-input" 
      class="blog-search-input" 
      placeholder="Search articles by text, title, or tag..." 
      aria-label="Search blog posts" 
      autocomplete="off" 
      spellcheck="false"
    >
    <button 
      id="search-clear-btn" 
      class="search-clear-btn" 
      type="button" 
      aria-label="Clear search"
    >
      &times;
    </button>
  </div>
  <div id="search-status" class="search-status" aria-live="polite"></div>
</div>
```

Key aspects:
- **`type="search"` with custom styling**: A semantic input element with auto-complete and spell-check disabled for quick keyword lookup.
- **Embedded Icons**: A search icon on the left and a responsive clear button (`×`) on the right that appears only when text is entered.
- **Accessibility**: Includes `aria-label` attributes and an `aria-live="polite"` status area to announce matching results.

---

### Step 2: Styling for Dark and Light Modes

In `style.css`, we designed the search bar to blend seamlessly with the aesthetic of the website:

- **Pill Shape & Sizing**: Max width of 480px with centered alignment, smooth `border-radius: 24px`, and comfortable padding.
- **Focus Glow**: When active, a smooth accent ring (`#8b5cf6` for dark mode and `#7c3aed` for light mode) highlights the input.
- **Theme Support**: Background colors, border colors, placeholder shades, and text colors adapt automatically between dark mode (`#2a2a2a`) and light mode (`#ffffff`).
- **Empty States**: If a search yields zero matches, a dashed container politely informs the user and provides a one-click "Clear search" button.

---

### Step 3: Powering the Search Logic in JavaScript

In `blog/blog.js`, the search functionality is implemented through reactive event listeners and multi-field text matching:

#### 1. In-Memory Post Caching
Previously, the blog loader re-fetched all post Markdown files every time someone returned to the blog list. We updated the loader to cache all parsed posts in memory (`allPosts` array) upon first load:
- Returning from a post view to list view is now instantaneous.
- Filtering happens locally in memory with zero latency.

#### 2. Deep Multi-Field Search Matching
The search doesn't just match the post title. It tokenizes the input into individual terms and checks across multiple fields:
- **Title**: matches post headings.
- **Summary**: matches excerpt text.
- **Tags**: matches topics like `#web-development`, `#linux`, `#antigravity`.
- **Categories**: matches sections like `technology`, `web`.
- **Full Markdown Content**: searches inside the complete body text of the article!

```javascript
const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
const filtered = allPosts.filter(post => {
  const titleText = (post.title || '').toLowerCase();
  const summaryText = (post.summary || '').toLowerCase();
  const tagsText = (post.tags || []).join(' ').toLowerCase();
  const catText = (post.categories || []).join(' ').toLowerCase();
  const contentText = (post.content || '').toLowerCase();

  return terms.every(term =>
    titleText.includes(term) ||
    summaryText.includes(term) ||
    tagsText.includes(term) ||
    catText.includes(term) ||
    contentText.includes(term)
  );
});
```

#### 3. Interactive Tag Filtering
Each tag (`#tag`) on the blog cards has a click event attached. When clicked, it automatically fills the search input and filters the list by that tag immediately.

#### 4. Clear Actions & Keyboard Shortcuts
- Clicking the `×` button clears the input and restores all articles.
- Pressing `Escape` while focused in the search bar clears the search immediately.
- The empty state view includes a "Clear search" button so visitors are never stuck.

#### 5. URL Query Parameter Support
You can now link directly to filtered searches using `?search=query` (for example, `/blog/?search=linux`).

---

### The Result

With just clean HTML, targeted CSS, and lightweight vanilla JavaScript, the blog now has a lightning-fast, zero-dependency search bar that works seamlessly offline and online.

Here's how it looks like:

![](../assets/blog/2026-11-17-blog-page-with-search-bar.png)

Give it a try right on the [Blog](/blog/) page!

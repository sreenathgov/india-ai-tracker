/**
 * Resources catalog — renders the embedded #resources-data JSON into
 * the featured slot and card grid, with tab filtering + hash deep links.
 * All dynamic text goes through textContent (never innerHTML).
 */
(function () {
  'use strict';

  const BUCKET_LABELS = Object.freeze({
    insight: 'Insight',
    whitepaper: 'Whitepaper',
    news: 'News & Press'
  });

  const VALID_BUCKETS = Object.freeze(['insight', 'whitepaper', 'news']);
  const FALLBACK_TILE_SRC = 'assets/logos/kanan-kl-hor-white.png';
  const PAGE_SIZE = 9;

  const els = {
    featured: document.getElementById('resourcesFeatured'),
    grid: document.getElementById('resourcesGrid'),
    pagination: document.getElementById('resourcesPagination'),
    status: document.getElementById('resourcesStatus'),
    tabs: Array.from(document.querySelectorAll('.rc-tab'))
  };

  // Pagination state for the currently active filter.
  let pageItems = [];
  let currentPage = 1;

  // ---------- data ----------

  function readItems() {
    const block = document.getElementById('resources-data');
    if (!block) return null;
    try {
      const parsed = JSON.parse(block.textContent);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      // A damaged catalog is not an empty category. Keep the static baseline.
      if (!parsed.items.every(isValidItem)) return null;
      return parsed.items;
    } catch (err) {
      console.error('resources-data JSON is malformed:', err);
      return null;
    }
  }

  function isValidItem(item) {
    return Boolean(
      item &&
      typeof item.title === 'string' && item.title.trim() &&
      typeof item.href === 'string' && item.href.trim() &&
      VALID_BUCKETS.includes(item.bucket)
    );
  }

  function isExternal(href) {
    return /^https?:\/\//i.test(href);
  }

  function formatDate(iso) {
    if (typeof iso !== 'string') return '';
    const date = new Date(iso + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------- DOM builders ----------

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildMedia(item, mediaClass) {
    const media = el('div', mediaClass);
    if (item.image) {
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => {
        media.replaceChildren(buildFallbackMark());
        media.classList.add('rc-media--fallback');
      }, { once: true });
      media.appendChild(img);
    } else {
      media.classList.add('rc-media--fallback');
      media.appendChild(buildFallbackMark());
    }
    return media;
  }

  function buildFallbackMark() {
    const img = document.createElement('img');
    img.src = FALLBACK_TILE_SRC;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    return img;
  }

  function buildMetaRow(item) {
    const row = el('div', 'rc-card__meta');
    row.appendChild(el('span', 'rc-pill', BUCKET_LABELS[item.bucket]));

    const right = el('span', 'rc-card__date');
    const parts = [];
    if (item.bucket === 'whitepaper' && item.meta && Number.isFinite(item.meta.pages)) {
      parts.push('PDF · ' + item.meta.pages + ' pages');
    }
    if (item.bucket === 'news' && item.meta && item.meta.source) {
      parts.push(String(item.meta.source) + (isExternal(item.href) ? ' ↗' : ''));
    }
    const dateText = formatDate(item.date);
    if (dateText) parts.push(dateText);
    right.textContent = parts.join('  ·  ');
    row.appendChild(right);
    return row;
  }

  function linkAttrs(anchor, item) {
    anchor.href = item.href;
    if (isExternal(item.href)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  }

  function buildCard(item) {
    const card = el('a', 'rc-card');
    linkAttrs(card, item);
    card.appendChild(buildMedia(item, 'rc-card__media'));

    const body = el('div', 'rc-card__body');
    body.appendChild(buildMetaRow(item));
    body.appendChild(el('h3', 'rc-card__title', item.title));
    if (item.description) {
      body.appendChild(el('p', 'rc-card__desc', item.description));
    }
    card.appendChild(body);
    return card;
  }

  function buildFeatured(item) {
    const card = el('a', 'rc-featured__card');
    linkAttrs(card, item);
    card.appendChild(buildMedia(item, 'rc-featured__media'));

    const body = el('div', 'rc-featured__body');
    body.appendChild(el('span', 'rc-featured__eyebrow', 'Featured'));
    body.appendChild(el('h2', 'rc-featured__title', item.title));
    if (item.description) {
      body.appendChild(el('p', 'rc-featured__desc', item.description));
    }
    const dateText = formatDate(item.date);
    if (dateText) body.appendChild(el('span', 'rc-card__date', dateText));
    body.appendChild(el('span', 'rc-featured__cta', 'Read →'));
    card.appendChild(body);
    return card;
  }

  // ---------- rendering ----------

  function showStatus(message) {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.hidden = !message;
  }

  function renderCatalog(items, bucket) {
    if (!els.featured || !els.grid) return;

    const featuredItem = bucket === 'all' ? items.find(i => i.featured === true) : undefined;
    pageItems = items
      .filter(i => bucket === 'all' ? i !== featuredItem : i.bucket === bucket)
      .slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    currentPage = 1;

    els.featured.replaceChildren(...(featuredItem ? [buildFeatured(featuredItem)] : []));
    renderGridPage(false);

    showStatus(pageItems.length || featuredItem ? '' : 'Nothing published here yet — check back soon.');
  }

  // ---------- pagination ----------

  function totalPages() {
    return Math.max(1, Math.ceil(pageItems.length / PAGE_SIZE));
  }

  function renderGridPage(scrollToGrid) {
    const pages = totalPages();
    if (currentPage > pages) currentPage = pages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = pageItems.slice(start, start + PAGE_SIZE);
    els.grid.replaceChildren(...slice.map(buildCard));

    renderPagination(pages);

    if (scrollToGrid && els.grid) {
      els.grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function goToPage(n) {
    const clamped = Math.min(Math.max(1, n), totalPages());
    if (clamped === currentPage) return;
    currentPage = clamped;
    renderGridPage(true);
  }

  // Windowed page list: first, last, and current ±1, with '…' for gaps.
  function pageList(current, total) {
    const out = [];
    for (let p = 1; p <= total; p++) {
      if (p === 1 || p === total || (p >= current - 1 && p <= current + 1)) {
        out.push(p);
      } else if (out[out.length - 1] !== '…') {
        out.push('…');
      }
    }
    return out;
  }

  function buildPageButton(n) {
    const isCurrent = n === currentPage;
    const btn = el('button', 'rc-page' + (isCurrent ? ' is-current' : ''), String(n));
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Page ' + n);
    if (isCurrent) btn.setAttribute('aria-current', 'page');
    btn.addEventListener('click', () => goToPage(n));
    return btn;
  }

  function buildPageArrow(dir, enabled) {
    const btn = el('button', 'rc-page rc-page--arrow', dir === 'prev' ? '←' : '→');
    btn.type = 'button';
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous page' : 'Next page');
    btn.disabled = !enabled;
    btn.addEventListener('click', () => goToPage(currentPage + (dir === 'prev' ? -1 : 1)));
    return btn;
  }

  function renderPagination(pages) {
    if (!els.pagination) return;

    // Hidden only when the active filter has nothing to show. A single page
    // still renders the pager (arrows disabled) so it's a visible, permanent
    // part of the catalog that scales as more publications are added.
    if (pageItems.length === 0) {
      els.pagination.replaceChildren();
      els.pagination.hidden = true;
      return;
    }

    const nodes = [buildPageArrow('prev', currentPage > 1)];
    pageList(currentPage, pages).forEach(entry => {
      nodes.push(entry === '…' ? el('span', 'rc-page-ellipsis', '…') : buildPageButton(entry));
    });
    nodes.push(buildPageArrow('next', currentPage < pages));

    els.pagination.replaceChildren(...nodes);
    els.pagination.hidden = false;
  }

  // ---------- tabs + hash ----------

  const HASH_TO_BUCKET = Object.freeze({
    '#insights': 'insight',
    '#whitepapers': 'whitepaper',
    '#news': 'news'
  });
  const BUCKET_TO_HASH = Object.freeze({
    insight: '#insights',
    whitepaper: '#whitepapers',
    news: '#news'
  });

  function bucketFromHash() {
    return HASH_TO_BUCKET[window.location.hash] || 'all';
  }

  function setActiveTab(bucket) {
    els.tabs.forEach(tab => {
      const active = tab.dataset.bucket === bucket;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
  }

  function activate(items, bucket, updateHash) {
    setActiveTab(bucket);
    renderCatalog(items, bucket);
    if (updateHash) {
      const hash = BUCKET_TO_HASH[bucket] || '';
      history.replaceState(null, '', hash || window.location.pathname);
    }
  }

  // ---------- init ----------

  if (document.body.hasAttribute('data-resources-unbuilt')) {
    showStatus('This is an unbuilt Resources template. Run npm run preview and open http://127.0.0.1:4180/resources.html to view the published catalog.');
    els.tabs.forEach(tab => { tab.disabled = true; });
    return;
  }

  const items = readItems();
  if (items === null) {
    showStatus('Resource filters are temporarily unavailable. You can still browse the publications below.');
    els.tabs.forEach(tab => { tab.disabled = true; });
  } else {
    // Hydration is an enhancement. Restore the complete static catalog if
    // initialization fails after partially replacing its DOM.
    const baseline = [els.featured, els.grid, els.pagination].filter(Boolean)
      .map(node => ({ node, children: Array.from(node.childNodes), hidden: node.hidden }));
    try {
      activate(items, bucketFromHash(), false);
    } catch (err) {
      baseline.forEach(({ node, children, hidden }) => {
        node.replaceChildren(...children);
        node.hidden = hidden;
      });
      console.error('Resources initialization failed:', err);
      showStatus('Resource filters are temporarily unavailable. You can still browse the publications below.');
      els.tabs.forEach(tab => { tab.disabled = true; });
      return;
    }
    els.tabs.forEach(tab => {
      tab.addEventListener('click', () => activate(items, tab.dataset.bucket, true));
    });
    window.addEventListener('hashchange', () => activate(items, bucketFromHash(), false));
  }
})();

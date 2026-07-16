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
  const FALLBACK_TILE_SRC = 'KANANLABS-LOGO-SET/ORANGE of KANAN-LABS-WEBSITELOGO.png';

  const els = {
    featured: document.getElementById('resourcesFeatured'),
    grid: document.getElementById('resourcesGrid'),
    status: document.getElementById('resourcesStatus'),
    tabs: Array.from(document.querySelectorAll('.rc-tab'))
  };

  // ---------- data ----------

  function readItems() {
    const block = document.getElementById('resources-data');
    if (!block) return null;
    try {
      const parsed = JSON.parse(block.textContent);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      return parsed.items.filter(isValidItem);
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
    const gridItems = items
      .filter(i => bucket === 'all' ? i !== featuredItem : i.bucket === bucket)
      .slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    els.featured.replaceChildren(...(featuredItem ? [buildFeatured(featuredItem)] : []));
    els.grid.replaceChildren(...gridItems.map(buildCard));

    showStatus(gridItems.length || featuredItem ? '' : 'Nothing published here yet — check back soon.');
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

  const items = readItems();
  if (items === null) {
    showStatus('Our publications are being prepared. Please check back shortly.');
  } else {
    els.tabs.forEach(tab => {
      tab.addEventListener('click', () => activate(items, tab.dataset.bucket, true));
    });
    window.addEventListener('hashchange', () => activate(items, bucketFromHash(), false));
    activate(items, bucketFromHash(), false);
  }
})();

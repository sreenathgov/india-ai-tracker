// Use static JSON files - works both locally and in production
// For local testing: run `python3 -m http.server 8000` from project root
const API_BASE_URL = '/api';

// Complete mapping for all 28 states + 8 union territories
const STATE_CODE_MAP = {
    // Major States
    'Tamil Nadu': 'TN',
    'Maharashtra': 'MH',
    'Karnataka': 'KA',
    'Delhi': 'DL',
    'NCT of Delhi': 'DL',
    'Telangana': 'TG',
    'Telengana': 'TG',
    'Andhra Pradesh': 'AP',
    'West Bengal': 'WB',
    'Gujarat': 'GJ',
    'Rajasthan': 'RJ',
    'Uttar Pradesh': 'UP',
    'Kerala': 'KL',
    'Punjab': 'PB',
    'Haryana': 'HR',
    'Madhya Pradesh': 'MP',
    'Bihar': 'BR',
    'Odisha': 'OD',
    'Orissa': 'OD',
    'Assam': 'AS',
    'Jharkhand': 'JH',
    'Chhattisgarh': 'CG',
    'Chattisgarh': 'CG',
    'Uttarakhand': 'UK',
    'Uttaranchal': 'UK',
    'Goa': 'GA',
    'Himachal Pradesh': 'HP',
    'Jammu and Kashmir': 'JK',
    'Jammu & Kashmir': 'JK',
    // Northeast States
    'Manipur': 'MN',
    'Meghalaya': 'ML',
    'Mizoram': 'MZ',
    'Nagaland': 'NL',
    'Tripura': 'TR',
    'Arunachal Pradesh': 'AR',
    'Sikkim': 'SK',
    // Union Territories
    'Puducherry': 'PY',
    'Pondicherry': 'PY',
    'Ladakh': 'LA',
    'Andaman and Nicobar Islands': 'AN',
    'Andaman & Nicobar Islands': 'AN',
    'Andaman and Nicobar': 'AN',
    'Chandigarh': 'CH',
    'Dadra and Nagar Haveli and Daman and Diu': 'DD',
    'Lakshadweep': 'LD',
};

const CATEGORY_CONFIG = {
    'Policies and Initiatives': { icon: '📋', shortName: 'Policies' },
    'Events': { icon: '📅', shortName: 'Events' },
    'Major AI Developments': { icon: '🏗️', shortName: 'Developments' },
    'AI Start-Up News': { icon: '🚀', shortName: 'Startups' },
};

const CATEGORY_ORDER = [
    'Policies and Initiatives',
    'Events',
    'Major AI Developments',
    'AI Start-Up News',
];

// Animation timing constant - single source of truth
const TRANSITION_DURATION = 450;

// Auto-scroll configuration
let autoScrollInterval = null;
let isAutoScrollPaused = false;
const AUTO_SCROLL_SPEED = 1; // pixels per frame
const AUTO_SCROLL_PAUSE_DELAY = 2000; // ms before resuming after hover

let map, geojsonLayer, currentPanel = null;
let recentUpdatesCache = {};
let currentViewMode = 'state'; // 'state' or 'allIndia'
let currentCategoriesData = null; // Store fetched categories for expansion
let currentTodayUpdates = []; // Store list of categories with today's updates
let selectedLayer = null; // Track the currently selected GeoJSON layer for centering
let currentPage = 1; // Pagination state for currently expanded category
let currentExpandedCategory = null; // Track which category is currently expanded

// ============================================
// FEED PANEL FUNCTIONS
// ============================================

// Fetch recent updates for the feed panel
async function fetchTodayFeed() {
    try {
        // Try to fetch all-india data which contains updates across all states
        const response = await fetch(`${API_BASE_URL}/all-india/categories.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // Flatten all updates from all categories and add state info
        const allUpdates = [];
        const categories = data.categories || {};

        Object.keys(categories).forEach(categoryName => {
            const updates = categories[categoryName] || [];
            updates.forEach(update => {
                allUpdates.push({
                    ...update,
                    category: CATEGORY_CONFIG[categoryName]?.shortName || categoryName,
                    state: update.state || 'All India'
                });
            });
        });

        // Sort by date (most recent first)
        allUpdates.sort((a, b) => new Date(b.date_published) - new Date(a.date_published));

        // Return the most recent 15 updates for the live feed
        return allUpdates.slice(0, 15);
    } catch (error) {
        console.warn('Could not fetch feed updates:', error);
        return [];
    }
}

// Render the feed panel with updates
function renderFeed(updates) {
    const feedContent = document.getElementById('feedContent');
    if (!feedContent) return;

    if (!updates || updates.length === 0) {
        feedContent.innerHTML = `
            <div class="feed-empty">
                <p>No recent updates</p>
            </div>
        `;
        return;
    }

    // On mobile/tablet, show only top 7 updates (no scrolling)
    // On desktop, show all updates with auto-scroll
    const isMobileOrTablet = window.innerWidth <= 768;
    const displayUpdates = isMobileOrTablet ? updates.slice(0, 7) : updates;

    let html = '';
    displayUpdates.forEach(update => {
        const stateCode = STATE_CODE_MAP[update.state] || '';
        const relativeTime = getRelativeTime(update.date_published);

        html += `
            <a href="${update.url}" target="_blank" rel="noopener"
               class="feed-item"
               data-state="${stateCode}"
               data-state-name="${update.state}">
                <div class="feed-item-title">${update.title}</div>
                <div class="feed-item-meta">
                    <span class="feed-item-state">${update.state}</span>
                    <span class="separator">·</span>
                    <span class="feed-item-time">${relativeTime}</span>
                    <span class="separator">·</span>
                    <span class="feed-item-category">${update.category}</span>
                </div>
            </a>
        `;
    });

    feedContent.innerHTML = html;

    // Add hover listeners for map highlighting
    initFeedHoverHighlighting();

    // Initialize auto-scroll only on desktop (not mobile/tablet)
    if (!isMobileOrTablet) {
        initAutoScroll();
    }
}

// Get relative time string (e.g., "2h ago", "3d ago")
function getRelativeTime(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// Initialize auto-scrolling for the feed
function initAutoScroll() {
    const feedContent = document.getElementById('feedContent');
    if (!feedContent) return;

    // Stop any existing auto-scroll
    stopAutoScroll();

    // Only auto-scroll if content overflows
    if (feedContent.scrollHeight <= feedContent.clientHeight) return;

    // Start auto-scrolling
    autoScrollInterval = setInterval(() => {
        if (!isAutoScrollPaused && feedContent) {
            feedContent.scrollTop += AUTO_SCROLL_SPEED;

            // Loop back to top when reaching the end
            if (feedContent.scrollTop >= feedContent.scrollHeight - feedContent.clientHeight) {
                feedContent.scrollTop = 0;
            }
        }
    }, 30); // ~33fps

    // Pause on hover
    feedContent.addEventListener('mouseenter', pauseAutoScroll);
    feedContent.addEventListener('mouseleave', resumeAutoScrollDelayed);

    // Pause on touch
    feedContent.addEventListener('touchstart', pauseAutoScroll, { passive: true });
    feedContent.addEventListener('touchend', resumeAutoScrollDelayed, { passive: true });
}

function stopAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

function pauseAutoScroll() {
    isAutoScrollPaused = true;
}

function resumeAutoScrollDelayed() {
    setTimeout(() => {
        isAutoScrollPaused = false;
    }, AUTO_SCROLL_PAUSE_DELAY);
}

// Initialize feed item hover highlighting on map
function initFeedHoverHighlighting() {
    const feedItems = document.querySelectorAll('.feed-item');

    feedItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const stateCode = item.dataset.state;
            const stateName = item.dataset.stateName;
            if (stateCode && stateName) {
                highlightStateOnMap(stateName);
            }
        });

        item.addEventListener('mouseleave', () => {
            clearStateHighlight();
        });
    });
}

// Highlight a state on the map
function highlightStateOnMap(stateName) {
    if (!geojsonLayer) return;

    geojsonLayer.eachLayer(layer => {
        const name = layer.feature?.properties?.ST_NM ||
                     layer.feature?.properties?.name ||
                     layer.feature?.properties?.NAME;
        if (name === stateName) {
            layer.setStyle({
                weight: 3,
                color: '#db4a2b',
                fillOpacity: 0.8
            });
            layer.bringToFront();
        }
    });
}

// Clear state highlight
function clearStateHighlight() {
    if (geojsonLayer) {
        geojsonLayer.resetStyle();
    }
}

// Hide feed panel (when state panel opens)
function hideFeedPanel() {
    const feedPanel = document.getElementById('feedPanel');
    if (feedPanel) {
        feedPanel.classList.add('hidden');
        stopAutoScroll();
    }
}

// Show feed panel (when state panel closes)
function showFeedPanel() {
    const feedPanel = document.getElementById('feedPanel');
    if (feedPanel) {
        feedPanel.classList.remove('hidden');
        // Restart auto-scroll after a delay for the transition
        setTimeout(() => {
            initAutoScroll();
        }, 400);
    }
}

async function initMap() {
    // Use zoom level 4 on mobile for better overview, 5 on desktop
    const isMobile = window.innerWidth <= 768;
    const initialZoom = isMobile ? 4 : 5;

    // Create map with canvas renderer for smoother panning
    // Canvas is ~10x faster than SVG for pan operations
    map = L.map('map', {
        center: [22.5, 79],
        zoom: initialZoom,
        preferCanvas: true,  // Use canvas for all vector layers
        renderer: L.canvas({ padding: 0.5 })  // 50% buffer beyond viewport
    });

    // Add tile layer with buffer for pre-loading tiles beyond viewport
    // Using light_nolabels for clean appearance (no city/country names)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        keepBuffer: 4,         // Pre-load 4 tile rows/columns beyond viewport
        updateWhenIdle: false, // Update tiles during panning, not after
        updateWhenZooming: true,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(map);

    // Pre-fetch recent updates count for all states
    await fetchRecentUpdates();

    // Load feed panel content
    const feedUpdates = await fetchTodayFeed();
    renderFeed(feedUpdates);

    loadGeoJSON();
}

// Fetch 7-day update counts for all states
async function fetchRecentUpdates() {
    try {
        const response = await fetch(`${API_BASE_URL}/states/recent-counts.json`);
        if (response.ok) {
            const data = await response.json();
            recentUpdatesCache = data.counts || {};
        }
    } catch (error) {
        console.warn('Could not fetch recent updates:', error);
        recentUpdatesCache = {};
    }
}

function loadGeoJSON() {
    fetch('js/india-states-clean.geojson')
        .then(r => r.json())
        .then(data => {
            // Use canvas renderer with padding for smoother panning
            const canvasRenderer = L.canvas({ padding: 0.5 });

            geojsonLayer = L.geoJSON(data, {
                renderer: canvasRenderer,  // Canvas is faster than SVG for panning
                style: () => ({
                    fillColor: '#4A90E2',
                    weight: 1.5,
                    color: '#2C3E50',
                    fillOpacity: 0.6
                }),
                onEachFeature: (feature, layer) => {
                    const name = feature.properties.ST_NM || feature.properties.name || feature.properties.NAME;
                    if (!name) return;

                    const stateCode = STATE_CODE_MAP[name];
                    const recentCount = stateCode ? (recentUpdatesCache[stateCode] || 0) : 0;

                    // Build tooltip content
                    const tooltipContent = buildTooltipContent(name, recentCount);

                    layer.on({
                        mouseover: (e) => {
                            e.target.setStyle({
                                weight: 2,
                                fillOpacity: 0.75,
                                color: '#B45309'
                            });
                        },
                        mouseout: (e) => geojsonLayer.resetStyle(e.target),
                        click: () => {
                            // Store the clicked layer for centering after resize
                            selectedLayer = layer;
                            openStatePanel(name);
                        }
                    });

                    layer.bindTooltip(tooltipContent, {
                        className: 'state-tooltip',
                        direction: 'top',
                        offset: [0, -10],
                        opacity: 1
                    });
                }
            }).addTo(map);
        });
}

// Build tooltip HTML content
function buildTooltipContent(stateName, recentCount) {
    const hasUpdates = recentCount > 0;

    if (hasUpdates) {
        return `<div class="tooltip-content">
            <span class="state-name">${stateName}</span>
            <span class="update-indicator has-updates"><span class="count">${recentCount}</span> update${recentCount !== 1 ? 's' : ''} this week</span>
        </div>`;
    } else {
        return `<span class="state-name">${stateName}</span> <span class="update-indicator no-updates">· No updates this week</span>`;
    }
}

async function fetchStateData(stateCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/states/${stateCode}/categories.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return {
            categories: data.categories,
            todayUpdates: data.today_updates || []
        };
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

async function openStatePanel(stateName) {
    const stateCode = STATE_CODE_MAP[stateName];
    if (!stateCode) {
        console.warn(`State "${stateName}" not found in STATE_CODE_MAP.`);
        showPanel(stateName, `
            <div class="no-updates">
                <dotlottie-player
                    src="added-assets/Box empty.lottie"
                    background="transparent"
                    speed="1"
                    style="width: 200px; height: 200px; margin: 0 auto;"
                    loop
                    autoplay>
                </dotlottie-player>
                <p style="margin-top: 1rem; color: var(--text-tertiary);">This region is not yet configured in the tracker.</p>
            </div>
        `);
        return;
    }

    // Reset pagination state when opening a new state
    currentPage = 1;
    currentExpandedCategory = null;

    showPanel(stateName, '<div class="loading">Loading...</div>');

    const data = await fetchStateData(stateCode);
    if (!data) {
        showPanel(stateName, '<div style="text-align:center;padding:40px;color:#B45309;">Failed to load. Check if backend is running on port 5001.</div>');
        return;
    }

    currentCategoriesData = data.categories;
    currentTodayUpdates = data.todayUpdates;
    const cardsHtml = buildCategoryCards(data.categories, data.todayUpdates);
    showPanel(stateName, cardsHtml);

    // Initialize Magic Bento effects after DOM update
    setTimeout(() => {
        const bentoGrid = document.querySelector('#panelContent .bento-grid');
        if (bentoGrid && typeof window.initMagicBento === 'function') {
            window.initMagicBento(bentoGrid);
        }
    }, 100);
}

// Build premium bento-box category cards
function buildCategoryCards(categories, todayUpdates = []) {
    console.log('Building bento cards with todayUpdates:', todayUpdates);

    let totalUpdates = 0;
    CATEGORY_ORDER.forEach(cat => {
        totalUpdates += (categories[cat] || []).length;
    });

    if (totalUpdates === 0) {
        return `
            <div class="no-updates">
                <dotlottie-player
                    src="added-assets/Box empty.lottie"
                    background="transparent"
                    speed="1"
                    style="width: 200px; height: 200px; margin: 0 auto;"
                    loop
                    autoplay>
                </dotlottie-player>
                <p style="margin-top: 1rem; color: var(--text-tertiary);">No AI policy updates available yet for this state.</p>
            </div>
        `;
    }

    let html = '<div class="bento-grid bento-section" id="bentoGrid">';

    CATEGORY_ORDER.forEach((categoryName, index) => {
        const updates = categories[categoryName] || [];
        const config = CATEGORY_CONFIG[categoryName];
        const count = updates.length;
        const hasUpdates = count > 0;
        const hasTodayUpdates = todayUpdates.includes(categoryName);

        if (hasTodayUpdates) {
            console.log(`✓ ${categoryName} has today updates - adding indicator`);
        }

        // Simple centered title only
        const cardTitle = config.shortName;
        const badgeText = count === 0 ? 'No updates' : `${count}`;

        html += `
            <div class="magic-bento-card ${hasUpdates ? '' : 'empty'}"
                 data-category="${categoryName}"
                 data-index="${index}"
                 onclick="expandCategory('${categoryName}')">
                <div class="magic-bento-card__content">
                    <h2 class="magic-bento-card__title">${cardTitle}</h2>
                    <div class="magic-bento-card__badge">
                        ${badgeText}
                        ${hasTodayUpdates ? '<span class="new-indicator" title="New updates today"></span>' : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += '<div id="expanded-category-content" class="expanded-content"></div>';

    return html;
}

// Expand a category card to show its updates
function expandCategory(categoryName) {
    if (!currentCategoriesData) return;

    const updates = currentCategoriesData[categoryName] || [];
    const config = CATEGORY_CONFIG[categoryName];

    // Reset pagination to page 1 if switching to a different category
    if (currentExpandedCategory !== categoryName) {
        currentPage = 1;
        currentExpandedCategory = categoryName;
    }

    // Find the correct expanded content container based on current view mode
    let expandedContent;
    if (currentViewMode === 'allIndia') {
        expandedContent = document.querySelector('#allIndiaPanelContent .expanded-content');
    } else {
        expandedContent = document.querySelector('#panelContent .expanded-content');
    }

    if (!expandedContent) return;

    // Update active state on cards within the current view's container
    const containerSelector = currentViewMode === 'allIndia' ? '#allIndiaPanelContent' : '#panelContent';
    document.querySelectorAll(`${containerSelector} .magic-bento-card`).forEach(card => {
        card.classList.remove('active');
        if (card.dataset.category === categoryName) {
            card.classList.add('active');
        }
    });

    if (updates.length === 0) {
        expandedContent.innerHTML = `
            <div class="expanded-header">
                <h3>${config.icon} ${categoryName}</h3>
                <button class="collapse-btn" onclick="collapseCategory()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </button>
            </div>
            <div class="no-updates-inline">No updates in this category</div>
        `;
        expandedContent.classList.add('visible');
        return;
    }

    // Sort updates by date (most recent first)
    updates.sort((a, b) => new Date(b.date_published) - new Date(a.date_published));

    // Pagination constants - 6 items per page on mobile, 10 on desktop/tablet
    const isMobile = window.innerWidth <= 768;
    const ITEMS_PER_PAGE = isMobile ? 6 : 10;
    const totalPages = Math.ceil(updates.length / ITEMS_PER_PAGE);
    
    // Ensure currentPage is within valid range
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    // Calculate slice indices for current page
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUpdates = updates.slice(startIndex, endIndex);

    let html = `
        <div class="expanded-header">
            <h3>${config.icon} ${categoryName}</h3>
            <button class="collapse-btn" onclick="collapseCategory()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
            </button>
        </div>
        <div class="updates-list-expanded">
    `;

    paginatedUpdates.forEach(update => {
        const date = update.date_published
            ? new Date(update.date_published).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            : 'Date unknown';

        html += `
            <div class="update-item">
                <a href="${update.url}" target="_blank" class="update-title">${update.title}</a>
                <p class="update-summary">${update.summary || 'No summary available.'}</p>
                <div class="update-date">${date}</div>
            </div>
        `;
    });

    html += '</div>';

    // Add pagination controls if there are multiple pages
    if (totalPages > 1) {
        const isFirstPage = currentPage === 1;
        const isLastPage = currentPage === totalPages;

        html += `
            <div class="pagination-controls">
                <button class="pagination-btn pagination-prev" ${isFirstPage ? 'disabled' : ''} onclick="goToPreviousPage('${categoryName}')">
                    Previous
                </button>
                <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
                <button class="pagination-btn pagination-next" ${isLastPage ? 'disabled' : ''} onclick="goToNextPage('${categoryName}')">
                    Next
                </button>
            </div>
        `;
    }

    expandedContent.innerHTML = html;
    
    // Force reflow before adding visible class to ensure proper rendering
    expandedContent.offsetHeight;
    
    expandedContent.classList.add('visible');

    // Scroll to top of expanded content after rendering
    // Use requestAnimationFrame to ensure DOM is updated and layout is calculated
    requestAnimationFrame(() => {
        scrollToTopOfExpandedContent(expandedContent);
    });
}

// Scroll to top of expanded content
function scrollToTopOfExpandedContent(expandedContent) {
    if (!expandedContent) return;
    
    // Find the parent scrollable container
    let scrollableContainer;
    if (currentViewMode === 'allIndia') {
        scrollableContainer = document.querySelector('.all-india-content');
    } else {
        scrollableContainer = document.querySelector('.panel-content');
    }
    
    if (scrollableContainer && expandedContent) {
        // Find the expanded header (first child) to scroll to
        const expandedHeader = expandedContent.querySelector('.expanded-header');
        if (expandedHeader) {
            // Calculate position relative to scrollable container
            const containerRect = scrollableContainer.getBoundingClientRect();
            const headerRect = expandedHeader.getBoundingClientRect();
            const scrollTop = scrollableContainer.scrollTop;
            const relativeTop = headerRect.top - containerRect.top + scrollTop;
            
            // Scroll to the header with smooth behavior
            scrollableContainer.scrollTo({
                top: Math.max(0, relativeTop - 10), // Small offset for better visibility
                behavior: 'smooth'
            });
        }
    }
}

// Pagination navigation helper functions
function goToPage(categoryName, page) {
    if (!currentCategoriesData) return;
    const updates = currentCategoriesData[categoryName] || [];
    const isMobile = window.innerWidth <= 768;
    const ITEMS_PER_PAGE = isMobile ? 6 : 10;
    const totalPages = Math.ceil(updates.length / ITEMS_PER_PAGE);
    
    // Validate page number
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    currentPage = page;
    expandCategory(categoryName);
}

function goToPreviousPage(categoryName) {
    if (currentPage > 1) {
        goToPage(categoryName, currentPage - 1);
    }
}

function goToNextPage(categoryName) {
    if (!currentCategoriesData) return;
    const updates = currentCategoriesData[categoryName] || [];
    const isMobile = window.innerWidth <= 768;
    const ITEMS_PER_PAGE = isMobile ? 6 : 10;
    const totalPages = Math.ceil(updates.length / ITEMS_PER_PAGE);
    
    if (currentPage < totalPages) {
        goToPage(categoryName, currentPage + 1);
    }
}

// Collapse expanded category
function collapseCategory() {
    // Find the correct expanded content container based on current view mode
    let expandedContent;
    if (currentViewMode === 'allIndia') {
        expandedContent = document.querySelector('#allIndiaPanelContent .expanded-content');
    } else {
        expandedContent = document.querySelector('#panelContent .expanded-content');
    }

    if (!expandedContent) return;

    expandedContent.classList.remove('visible');

    // Remove active state from cards in the current view's container
    const containerSelector = currentViewMode === 'allIndia' ? '#allIndiaPanelContent' : '#panelContent';
    document.querySelectorAll(`${containerSelector} .magic-bento-card`).forEach(card => {
        card.classList.remove('active');
    });

    setTimeout(() => {
        expandedContent.innerHTML = '';
    }, 300);
}

/**
 * Show the side panel and coordinate map frame resize.
 * Animation approach:
 * 1. Hide feed panel with premium dissolve animation
 * 2. Add classes to both map-frame and side-panel simultaneously
 * 3. CSS transitions handle the coordinated animation
 * 4. After animation completes, call map.invalidateSize() once for Leaflet reflow
 * 5. Then fit the map to the selected state's bounds for proper centering
 */
function showPanel(stateName, content) {
    const panel = document.getElementById('sidePanel');
    const mapFrame = document.getElementById('map-frame');

    document.getElementById('panelTitle').textContent = stateName;
    document.getElementById('panelContent').innerHTML = content;

    // Step 1: Hide feed panel with premium animation
    hideFeedPanel();

    // Step 2: Trigger coordinated animation via CSS classes (slight delay for orchestration)
    requestAnimationFrame(() => {
        panel.classList.add('open');
        mapFrame.classList.add('panel-open');
    });

    /*
     * After the CSS transition completes:
     * 1. Call invalidateSize() so Leaflet knows the new container dimensions
     * 2. Fit the map to the selected state's bounds so it remains centered
     */
    setTimeout(() => {
        map.invalidateSize({ animate: false, pan: false });

        // Center on the selected state's bounds after resize
        if (selectedLayer) {
            const bounds = selectedLayer.getBounds();
            map.fitBounds(bounds, {
                padding: [30, 30],
                animate: true,
                duration: 0.3
            });
        }
    }, TRANSITION_DURATION + 50);

    currentPanel = stateName;
}

/**
 * Close the side panel and restore map frame to full width.
 * Same coordination pattern as showPanel().
 * Animation orchestration:
 * 1. Panel slides out
 * 2. Map expands back to 65%
 * 3. Feed panel fades back in
 */
function closePanel() {
    const panel = document.getElementById('sidePanel');
    const mapFrame = document.getElementById('map-frame');

    // Trigger coordinated animation via CSS classes
    requestAnimationFrame(() => {
        panel.classList.remove('open');
        mapFrame.classList.remove('panel-open');
    });

    /*
     * After the CSS transition completes:
     * 1. Call invalidateSize() so Leaflet knows the new container dimensions
     * 2. Reset the map view to show all of India
     */
    setTimeout(() => {
        map.invalidateSize({ animate: false, pan: false });

        // Reset to default India view
        map.setView([22.5, 79], 5, {
            animate: true,
            duration: 0.3
        });
    }, TRANSITION_DURATION);

    // Show feed panel AFTER side panel fully closes (clean handoff)
    setTimeout(() => {
        showFeedPanel();
    }, TRANSITION_DURATION + 100);

    currentPanel = null;
    currentCategoriesData = null;
    selectedLayer = null;
}

// ============================================
// VIEW MODE TOGGLE: State View ↔ All India View
// ============================================

function setViewMode(mode) {
    // Prevent redundant calls
    if (mode === currentViewMode) return;

    const mapFrame = document.getElementById('map-frame');
    const allIndiaPanel = document.getElementById('allIndiaPanel');
    const viewToggle = document.querySelector('.view-toggle');
    const toggleOptions = viewToggle.querySelectorAll('.toggle-option');

    // Reset pagination state when switching view modes
    currentPage = 1;
    currentExpandedCategory = null;

    // Close any open state panel first (without triggering another view change)
    if (currentPanel) {
        const panel = document.getElementById('sidePanel');
        panel.classList.remove('open');
        mapFrame.classList.remove('panel-open');
        currentPanel = null;
        currentCategoriesData = null;
        selectedLayer = null;
    }

    if (mode === 'allIndia') {
        // Switch to All India View
        currentViewMode = 'allIndia';

        // Update toggle button states
        toggleOptions[0].classList.remove('active');
        toggleOptions[0].setAttribute('aria-selected', 'false');
        toggleOptions[1].classList.add('active');
        toggleOptions[1].setAttribute('aria-selected', 'true');
        viewToggle.classList.add('all-india-active');

        // Fade out map frame, hide feed panel, show All India panel
        requestAnimationFrame(() => {
            mapFrame.classList.add('hidden');
            hideFeedPanel();
            allIndiaPanel.classList.add('visible');
        });

        // Load All India data
        loadAllIndiaContent();

    } else {
        // Switch to State View
        currentViewMode = 'state';

        // Update toggle button states
        toggleOptions[0].classList.add('active');
        toggleOptions[0].setAttribute('aria-selected', 'true');
        toggleOptions[1].classList.remove('active');
        toggleOptions[1].setAttribute('aria-selected', 'false');
        viewToggle.classList.remove('all-india-active');

        // Show map frame, hide All India panel, show feed panel
        requestAnimationFrame(() => {
            mapFrame.classList.remove('hidden');
            allIndiaPanel.classList.remove('visible');
        });

        // Recalculate map size and reset view after animation completes
        setTimeout(() => {
            map.invalidateSize({ animate: false, pan: false });
            map.setView([22.5, 79], 5, {
                animate: true,
                duration: 0.3
            });
            // Show feed panel after transition
            showFeedPanel();
        }, TRANSITION_DURATION + 50);
    }
}

async function loadAllIndiaContent() {
    const contentEl = document.getElementById('allIndiaPanelContent');
    contentEl.innerHTML = '<div class="loading">Loading national updates...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/all-india/categories.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        currentCategoriesData = data.categories;
        currentTodayUpdates = data.today_updates || [];
        const cardsHtml = buildCategoryCards(data.categories, data.today_updates || []);
        contentEl.innerHTML = cardsHtml;

        // Initialize Magic Bento effects after DOM update
        setTimeout(() => {
            const bentoGrid = document.querySelector('#allIndiaPanelContent .bento-grid');
            if (bentoGrid && typeof window.initMagicBento === 'function') {
                window.initMagicBento(bentoGrid);
            }
        }, 100);
    } catch (error) {
        console.error('Error fetching All India data:', error);
        contentEl.innerHTML = '<div class="no-updates">Failed to load. Check if backend is running.</div>';
    }
}

// Legacy modal functions (can be removed if not needed)
function showAllIndia() {
    setViewMode('allIndia');
}

function closeModal() {
    setViewMode('state');
}

// Fetch and display last updated timestamp
async function fetchLastUpdated() {
    try {
        const response = await fetch(`${API_BASE_URL}/last-updated.json`);
        if (response.ok) {
            const data = await response.json();
            const statusEl = document.getElementById('lastUpdated');
            if (statusEl && data.formatted) {
                statusEl.textContent = `Last updated: ${data.formatted}`;
            }
        }
    } catch (error) {
        console.warn('Could not fetch last updated time:', error);
    }
}

// Info tooltip interaction
function initInfoTooltip() {
    const trigger = document.getElementById('infoTrigger');
    const tooltip = document.getElementById('infoTooltip');

    if (!trigger || !tooltip) return;

    let isTooltipVisible = false;

    // Desktop: hover interaction
    trigger.addEventListener('mouseenter', () => {
        tooltip.classList.add('visible');
        isTooltipVisible = true;
    });

    trigger.addEventListener('mouseleave', (e) => {
        // Check if mouse moved to tooltip
        const toElement = e.relatedTarget;
        if (toElement && tooltip.contains(toElement)) return;
        tooltip.classList.remove('visible');
        isTooltipVisible = false;
    });

    tooltip.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
        isTooltipVisible = false;
    });

    // Mobile: tap interaction
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        isTooltipVisible = !isTooltipVisible;
        tooltip.classList.toggle('visible', isTooltipVisible);
    });

    // Dismiss on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (isTooltipVisible && !trigger.contains(e.target) && !tooltip.contains(e.target)) {
            tooltip.classList.remove('visible');
            isTooltipVisible = false;
        }
    });
}

// Fix mobile viewport height issues
function setMobileViewportHeight() {
    // Set CSS custom property for actual viewport height
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchLastUpdated();
    initInfoTooltip();

    // Initialize mobile viewport fix
    setMobileViewportHeight();
    window.addEventListener('resize', setMobileViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setMobileViewportHeight, 100);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (currentPanel) closePanel();
            if (currentViewMode === 'allIndia') setViewMode('state');
        }
    });
});

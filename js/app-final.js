// Use static JSON files - works both locally and in production
// For local testing: run `python3 -m http.server 8000` from project root
const API_BASE_URL = '/api';

// --- XSS defense: escape-on-output for untrusted article data --------------
// Article titles/summaries/URLs originate from scraped content processed by
// LLMs and could contain markup. This is the authoritative defense for the
// innerHTML sinks below; the backend sanitizer is a second layer.
const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, ch => HTML_ESCAPE_MAP[ch]);
}

// Allow only http(s) URLs into href attributes; neutralise javascript:, data:,
// etc. Returns '#' for anything unsafe so the link is inert.
function safeUrl(value) {
    if (value === null || value === undefined) return '#';
    const url = String(value).trim();
    if (/^https?:\/\//i.test(url)) return escapeHtml(url);
    return '#';
}
// ---------------------------------------------------------------------------

let JURISDICTIONS = [];
let STATE_CODE_MAP = {};
let JURISDICTION_BY_NAME = {};
let JURISDICTION_BY_SLUG = {};

function toJurisdictionSlug(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function normalizeJurisdictionName(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function indexJurisdictions(records) {
    JURISDICTIONS = records;
    STATE_CODE_MAP = {};
    JURISDICTION_BY_NAME = {};
    JURISDICTION_BY_SLUG = {};

    records.forEach(record => {
        const names = [record.name, ...(record.aliases || [])];
        names.forEach(name => {
            STATE_CODE_MAP[name] = record.code;
            JURISDICTION_BY_NAME[normalizeJurisdictionName(name)] = record;
            JURISDICTION_BY_SLUG[toJurisdictionSlug(name)] = record;
        });
        JURISDICTION_BY_SLUG[record.slug] = record;
    });
}

async function loadJurisdictionRegistry() {
    try {
        const response = await fetch('/data/jurisdictions.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const records = await response.json();
        indexJurisdictions(records);
    } catch (error) {
        console.error('Could not load jurisdiction registry:', error);
        indexJurisdictions([]);
    }
}

function resolveJurisdiction(value) {
    return JURISDICTION_BY_NAME[normalizeJurisdictionName(value)] || null;
}

function resolveJurisdictionSlug(slug) {
    return JURISDICTION_BY_SLUG[toJurisdictionSlug(slug)] || null;
}

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

// Official state startup policy PDFs (sourced from Startup India incubator schemes page)
const STARTUP_POLICY_MAP = {
    'AN': { label: 'A&N Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/A&Nstartup%20final_cp.pdf' },
    'AS': { label: 'Assam Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Assam_State_Policy.pdf' },
    'BR': { label: 'Bihar Startup Policy', url: 'https://state.bihar.gov.in/industries/cache/26/01-Jul-22/SHOW_DOCS/circular-td-1502-dtd-27-06-22%20English.pdf' },
    'CG': { label: 'Chhattisgarh Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/ChhattisgarhPolicy2016-min.pdf' },
    'GA': { label: 'Goa Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/GoaStart-up-Policy2017-dated-19-9-2017.pdf' },
    'GJ': { label: 'Gujarat Startup Policy', url: 'https://startup.gujarat.gov.in/files/2020/11/67fa51ad-d410-49be-8ff3-f93adc784118_13-GR_02092020.pdf' },
    'HR': { label: 'Haryana Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Haryana_Startup-Policy.pdf' },
    'HP': { label: 'Himachal Pradesh Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Himachal%20startup%20policy.pdf' },
    'JH': { label: 'Jharkhand Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Jharkhand%20Startup%20Policy.pdf' },
    'KA': { label: 'Karnataka Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Karnataka_Startup_Policy.pdf' },
    'MP': { label: 'Madhya Pradesh Startup Policy', url: 'https://startup.mp.gov.in/uploads/media/Startup_Policy_2022_(eng).pdf' },
    'MH': { label: 'Maharashtra Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Maharashtra_State_Innovative_Startup_Policy_2018.pdf' },
    'MN': { label: 'Manipur Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Manipur_Startup_Policy.pdf' },
    'NL': { label: 'Nagaland Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Nagaland-Policy-2019.pdf' },
    'OD': { label: 'Odisha Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Odisha2016StartupPolicy.pdf' },
    'PB': { label: 'Punjab Industrial & Business Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Industrial_and_Business_Development_Policy_2017.pdf' },
    'PY': { label: 'Puducherry Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Puducherry%20startup%20policy%202019.pdf' },
    'RJ': { label: 'Rajasthan Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Rajasthan-startup-policy-2015.pdf' },
    'TN': [
        { label: 'Tamil Nadu Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Tamil_Nadu_Startup_Policy.pdf' },
        { label: 'Puducherry Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Puducherry%20startup%20policy%202019.pdf' },
    ],
    'TG': { label: 'Telangana Innovation Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/Telangana-Innovation-Policy-Issued-GO.pdf' },
    'UP': { label: 'Uttar Pradesh Startup Policy', url: 'https://invest.up.gov.in/wp-content/themes/investup/pdf/Startup-Policy-2020.pdf' },
    'UK': { label: 'Uttarakhand Startup Policy', url: 'https://www.startuputtarakhand.com/attachments/1645842195.pdf' },
    'WB': { label: 'West Bengal Startup Policy', url: 'https://www.startupindia.gov.in/content/dam/invest-india/Templates/public/state_startup_policies/West%20Bengal_Start-up-Policy-2016-2021.pdf' },
};

// Animation timing constant - single source of truth
const TRANSITION_DURATION = 450;

// Auto-scroll configuration
let autoScrollInterval = null;
let isAutoScrollPaused = false;
const AUTO_SCROLL_SPEED = 1; // pixels per frame
const AUTO_SCROLL_PAUSE_DELAY = 2000; // ms before resuming after hover

let map, geojsonLayer, currentPanel = null;
let recentUpdatesCache = {};
let recentUpdatesLoaded = false;
let currentViewMode = 'state'; // 'state' or 'allIndia'
let currentCategoriesData = null; // Store fetched categories for expansion
let currentTodayUpdates = []; // Store list of categories with today's updates
let selectedLayer = null; // Track the currently selected GeoJSON layer for centering
let currentPage = 1; // Pagination state for currently expanded category
let currentExpandedCategory = null; // Track which category is currently expanded
let tileLayer = null; // Reference to tile layer for control

// Auto-reset map position after user interaction
let mapIdleTimer = null;
const MAP_IDLE_DELAY = 3000; // 3 seconds

// India bounds for perfect framing - covers entire country with proper padding
const INDIA_BOUNDS = [
    [6.5, 68],  // Southwest corner (bottom-left)
    [35.5, 97.5] // Northeast corner (top-right)
];

// Default India center view - optimized position to show entire country (matches Image #7)
const INDIA_CENTER = [22.3, 82.2];
const INDIA_ZOOM_MOBILE = 4.3;
const INDIA_ZOOM_DESKTOP = 5.0;

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

    const isMobileOrTablet = window.innerWidth <= 768;

    if (isMobileOrTablet) {
        // Mobile: horizontal paginated carousel, 5 items per page
        const PAGE_SIZE = 5;
        const displayUpdates = updates.slice(0, 15);
        const pages = [];
        for (let i = 0; i < displayUpdates.length; i += PAGE_SIZE) {
            pages.push(displayUpdates.slice(i, i + PAGE_SIZE));
        }

        const pagesHtml = pages.map(pageItems => {
            const itemsHtml = pageItems.map(update => {
                const stateCode = STATE_CODE_MAP[update.state] || '';
                const relativeTime = getRelativeTime(update.date_published);
                return `<a href="${safeUrl(update.url)}" target="_blank" rel="noopener"
                           class="feed-item"
                           data-state="${escapeHtml(stateCode)}"
                           data-state-name="${escapeHtml(update.state)}">
                            <div class="feed-item-title">${escapeHtml(update.title)}</div>
                            <div class="feed-item-meta">
                                <span class="feed-item-state">${escapeHtml(update.state)}</span>
                                <span class="separator">·</span>
                                <span class="feed-item-time">${escapeHtml(relativeTime)}</span>
                                <span class="separator">·</span>
                                <span class="feed-item-category">${escapeHtml(update.category)}</span>
                            </div>
                        </a>`;
            }).join('');
            return `<div class="feed-carousel-page">${itemsHtml}</div>`;
        }).join('');

        const dotsHtml = pages.map((_, i) =>
            `<button class="feed-carousel-dot${i === 0 ? ' active' : ''}" data-page="${i}" aria-label="Page ${i + 1}"></button>`
        ).join('');

        feedContent.innerHTML = `
            <div class="feed-carousel-wrapper">
                <div class="feed-carousel-track" id="feedCarouselTrack">${pagesHtml}</div>
            </div>
            <div class="feed-carousel-dots" id="feedCarouselDots">${dotsHtml}</div>
        `;

        initFeedHoverHighlighting();
        initMobileCarousel(pages.length);
    } else {
        // Desktop: flat list with vertical auto-scroll
        let html = '';
        updates.forEach(update => {
            const stateCode = STATE_CODE_MAP[update.state] || '';
            const relativeTime = getRelativeTime(update.date_published);
            html += `
                <a href="${safeUrl(update.url)}" target="_blank" rel="noopener"
                   class="feed-item"
                   data-state="${escapeHtml(stateCode)}"
                   data-state-name="${escapeHtml(update.state)}">
                    <div class="feed-item-title">${escapeHtml(update.title)}</div>
                    <div class="feed-item-meta">
                        <span class="feed-item-state">${escapeHtml(update.state)}</span>
                        <span class="separator">·</span>
                        <span class="feed-item-time">${escapeHtml(relativeTime)}</span>
                        <span class="separator">·</span>
                        <span class="feed-item-category">${escapeHtml(update.category)}</span>
                    </div>
                </a>
            `;
        });
        feedContent.innerHTML = html;
        initFeedHoverHighlighting();
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
    stopMobileCarousel();
}

function pauseAutoScroll() {
    isAutoScrollPaused = true;
}

function resumeAutoScrollDelayed() {
    setTimeout(() => {
        isAutoScrollPaused = false;
    }, AUTO_SCROLL_PAUSE_DELAY);
}

// ============================================
// MOBILE CAROUSEL (horizontal pagination)
// ============================================

let carouselCurrentPage = 0;
let carouselTotalPages = 0;
let carouselAutoAdvanceTimer = null;
let carouselTouchStartX = 0;

function initMobileCarousel(totalPages) {
    carouselCurrentPage = 0;
    carouselTotalPages = totalPages;
    stopMobileCarousel();

    const track = document.getElementById('feedCarouselTrack');
    if (!track) return;

    // Touch swipe support
    track.addEventListener('touchstart', (e) => {
        carouselTouchStartX = e.touches[0].clientX;
        // Pause auto-advance while user is swiping
        stopMobileCarousel();
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        const deltaX = e.changedTouches[0].clientX - carouselTouchStartX;
        if (Math.abs(deltaX) > 40) {
            if (deltaX < 0) {
                carouselGoToPage(carouselCurrentPage + 1); // swipe left → next
            } else {
                carouselGoToPage(carouselCurrentPage - 1); // swipe right → prev
            }
        }
        // Restart auto-advance after 8s
        setTimeout(() => startCarouselAutoAdvance(), 8000);
    }, { passive: true });

    // Dot click navigation
    const dots = document.getElementById('feedCarouselDots');
    if (dots) {
        dots.addEventListener('click', (e) => {
            const dot = e.target.closest('.feed-carousel-dot');
            if (dot) {
                carouselGoToPage(parseInt(dot.dataset.page, 10));
                stopMobileCarousel();
                setTimeout(() => startCarouselAutoAdvance(), 8000);
            }
        });
    }

    startCarouselAutoAdvance();
}

function carouselGoToPage(page) {
    if (page < 0) page = carouselTotalPages - 1;
    if (page >= carouselTotalPages) page = 0;
    carouselCurrentPage = page;

    const track = document.getElementById('feedCarouselTrack');
    if (track) track.style.transform = `translateX(-${page * 100}%)`;

    const dots = document.querySelectorAll('.feed-carousel-dot');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === page));
}

function startCarouselAutoAdvance() {
    stopMobileCarousel();
    carouselAutoAdvanceTimer = setInterval(() => {
        carouselGoToPage(carouselCurrentPage + 1);
    }, 5000);
}

function stopMobileCarousel() {
    if (carouselAutoAdvanceTimer) {
        clearInterval(carouselAutoAdvanceTimer);
        carouselAutoAdvanceTimer = null;
    }
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

function showFeedPanel() {
    const feedPanel = document.getElementById('feedPanel');
    if (feedPanel) {
        feedPanel.classList.remove('hidden');
        initAutoScroll();
    }
}

async function initMap() {
    // Create map with canvas renderer for smoother panning and transitions
    // Canvas is ~10x faster than SVG for pan operations
    map = L.map('map', {
        preferCanvas: true,  // Use canvas for all vector layers
        renderer: L.canvas({ padding: 1.0 }),  // 100% buffer for seamless tile loading
        zoomControl: true,
        attributionControl: true,
        // Smooth zoom and pan settings
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        // Restrict map bounds to India region for optimized tile loading
        maxBounds: [
            [3, 63],   // Southwest corner (extra padding for smooth panning)
            [38, 102]  // Northeast corner (extra padding)
        ],
        maxBoundsViscosity: 0.8  // Smooth boundary resistance
    });

    // Add tile layer with ultra-aggressive pre-loading to eliminate ALL latency
    // Using light_nolabels for clean appearance (no city/country names)
    tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        keepBuffer: 40,        // Maximum: keep all India tiles in memory across zoom levels
        updateWhenIdle: false, // Update tiles during panning for smooth experience
        updateWhenZooming: true, // Update tiles when zooming for smooth transitions
        updateInterval: 50,    // Update tiles every 50ms for responsive loading
        tileSize: 256,         // Standard tile size
        zoomOffset: 0,
        maxZoom: 19,
        minZoom: 3,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(map);

    // Set initial view to perfect India bounds
    resetMapToIndia(false); // false = no animation on init

    // Set up auto-reset mechanism: return to India view after 3 seconds of idle
    map.on('moveend', scheduleMapReset);
    map.on('zoomend', scheduleMapReset);
    map.on('movestart', cancelMapReset);
    map.on('zoomstart', cancelMapReset);

    // Pre-fetch recent updates count for all states
    await fetchRecentUpdates();

    // Load feed panel content
    const feedUpdates = await fetchTodayFeed();
    renderFeed(feedUpdates);

    // Wait for initial tiles to load before showing GeoJSON
    await waitForTiles(tileLayer);
    loadGeoJSON();
}

// Wait for tiles to load before proceeding (eliminates glitchy appearance)
function waitForTiles(tileLayer, timeout = 2000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            // Check if all tiles are loaded or timeout reached
            if (!tileLayer._loading || Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
    });
}

// ============================================
// MAP AUTO-RESET FUNCTIONS
// ============================================

// Reset map to perfect India view (the anchor point)
function resetMapToIndia(animate = true) {
    if (!map) return;

    // Cancel any pending auto-reset
    cancelMapReset();

    // Use fixed center and zoom for consistent positioning
    // This ensures predictable, smooth transitions without dynamic calculations
    const isMobile = window.innerWidth <= 768;
    const targetZoom = isMobile ? INDIA_ZOOM_MOBILE : INDIA_ZOOM_DESKTOP;

    map.setView(INDIA_CENTER, targetZoom, {
        animate: animate,
        duration: animate ? 0.6 : 0,
        easeLinearity: 0.25
    });
}

// Schedule auto-reset: return to India view after 3 seconds of idle
function scheduleMapReset() {
    // Only auto-reset in state view (not when panel is open or in All India mode)
    if (currentPanel || currentViewMode !== 'state') return;

    cancelMapReset();
    mapIdleTimer = setTimeout(() => {
        resetMapToIndia(true);
    }, MAP_IDLE_DELAY);
}

// Cancel pending auto-reset (user is interacting with map)
function cancelMapReset() {
    if (mapIdleTimer) {
        clearTimeout(mapIdleTimer);
        mapIdleTimer = null;
    }
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
    } finally {
        recentUpdatesLoaded = true;
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

                    const jurisdiction = resolveJurisdiction(name);
                    const displayName = jurisdiction ? jurisdiction.name : name;
                    const stateCode = jurisdiction ? jurisdiction.code : null;
                    const recentCount = stateCode ? (recentUpdatesCache[stateCode] || 0) : 0;

                    // Build tooltip content
                    const tooltipContent = buildTooltipContent(displayName, recentCount);

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
                            openStatePanel(displayName);
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
    const jurisdiction = resolveJurisdiction(stateName);
    const displayName = jurisdiction ? jurisdiction.name : stateName;
    const stateCode = jurisdiction ? jurisdiction.code : null;

    if (!stateCode) {
        console.warn(`State "${stateName}" not found in STATE_CODE_MAP.`);
        showPanel(displayName, `
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

    showPanel(displayName, '<div class="loading">Loading...</div>');

    const data = await fetchStateData(stateCode);
    if (!data) {
        showPanel(displayName, '<div style="text-align:center;padding:40px;color:#B45309;">Failed to load. Check if backend is running on port 5001.</div>');
        return;
    }

    currentCategoriesData = data.categories;
    currentTodayUpdates = data.todayUpdates;
    const cardsHtml = buildCategoryCards(data.categories, data.todayUpdates, stateCode);
    showPanel(displayName, cardsHtml);

    // Initialize Magic Bento effects after DOM update
    setTimeout(() => {
        const bentoGrid = document.querySelector('#panelContent .bento-grid');
        if (bentoGrid && typeof window.initMagicBento === 'function') {
            window.initMagicBento(bentoGrid);
        }
    }, 100);
}

// Build premium bento-box category cards
function buildCategoryCards(categories, todayUpdates = [], stateCode = null) {
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

    // Startup policy card — shown only for states with a known policy URL
    const policyEntry = stateCode ? STARTUP_POLICY_MAP[stateCode] : null;
    if (policyEntry) {
        const entries = Array.isArray(policyEntry) ? policyEntry : [policyEntry];
        const isMulti = entries.length > 1;
        html += '<div class="startup-policy-card">';
        entries.forEach(e => {
            const btnLabel = isMulti ? e.label : 'State Policy for Start-Ups';
            html += `
            <a href="${e.url}" target="_blank" rel="noopener noreferrer" class="startup-policy-btn">
                <svg class="startup-policy-btn__icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                ${btnLabel}
                <svg class="startup-policy-btn__arrow" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7,7 17,7 17,17"/></svg>
            </a>`;
        });
        html += '</div>';
    }

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
                <h3>${categoryName}</h3>
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
            <h3>${categoryName}</h3>
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
                <a href="${safeUrl(update.url)}" target="_blank" class="update-title">${escapeHtml(update.title)}</a>
                <p class="update-summary">${escapeHtml(update.summary || 'No summary available.')}</p>
                <div class="update-date">${escapeHtml(date)}</div>
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
 * 1. Cancel auto-reset timer (user is now in a panel)
 * 2. Hide feed panel with premium dissolve animation
 * 3. Add classes to both map-frame and side-panel simultaneously
 * 4. CSS transitions handle the coordinated animation
 * 5. After animation completes, call map.invalidateSize() once for Leaflet reflow
 * 6. Then fit the map to the selected state's bounds for proper centering
 */
function showPanel(stateName, content) {
    const panel = document.getElementById('sidePanel');
    const mapFrame = document.getElementById('map-frame');

    // Cancel auto-reset when panel opens
    cancelMapReset();

    document.getElementById('panelTitle').textContent = stateName;
    document.getElementById('panelContent').innerHTML = content;

    // Step 1: On desktop, hide feed and collapse map alongside panel open.
    // On mobile the panel is a fixed overlay — underlying layout is untouched.
    if (window.innerWidth > 768) {
        hideFeedPanel();
    }

    // Step 2: Open panel; desktop also collapses map frame
    requestAnimationFrame(() => {
        panel.classList.add('open');
        if (window.innerWidth > 768) {
            mapFrame.classList.add('panel-open');
        }
    });

    // After transition: resize map to new dimensions (desktop only — map doesn't move on mobile overlay)
    if (window.innerWidth > 768) {
        setTimeout(() => {
            map.invalidateSize({ animate: false, pan: false });

            if (selectedLayer) {
                const bounds = selectedLayer.getBounds();
                map.fitBounds(bounds, {
                    padding: [30, 30],
                    animate: true,
                    duration: 0.3
                });
            }
        }, TRANSITION_DURATION + 50);
    }

    currentPanel = stateName;

    // Attach swipe-to-close gesture on mobile
    if (window.innerWidth <= 768) {
        initPanelSwipe();
    }
}

// Flag: panel was already animated out by swipe — closePanel() should skip re-animation
let swipeDismissing = false;

/**
 * Swipe-to-close for the mobile overlay panel.
 * Drag handle area = entire panel (but respects internal scroll position).
 * Threshold: 100px downward OR velocity > 0.4 px/ms → dismiss.
 * Below threshold → spring back with bouncy easing.
 */
function initPanelSwipe() {
    const panel = document.getElementById('sidePanel');
    if (!panel) return;

    let startY = 0;
    let currentDeltaY = 0;
    let isDragging = false;
    let startTime = 0;

    function onTouchStart(e) {
        // If panel content is scrolled down, let the scroll reach top first
        const content = panel.querySelector('.panel-content');
        if (content && content.scrollTop > 0) return;
        startY = e.touches[0].clientY;
        currentDeltaY = 0;
        startTime = Date.now();
        isDragging = true;
        panel.style.transition = 'none';
    }

    function onTouchMove(e) {
        if (!isDragging) return;
        const d = e.touches[0].clientY - startY;
        if (d < 0) { isDragging = false; panel.style.transition = ''; return; }
        currentDeltaY = d;
        panel.style.transform = `translateY(${d}px)`;
    }

    function onTouchEnd() {
        if (!isDragging) return;
        isDragging = false;
        const elapsed = Date.now() - startTime || 1;
        const velocity = currentDeltaY / elapsed;

        if (currentDeltaY > 100 || velocity > 0.4) {
            // Commit to dismiss — animate off-screen then call closePanel
            const duration = Math.min(320, Math.max(160, (window.innerHeight - currentDeltaY) / (velocity || 1)));
            panel.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
            panel.style.transform = 'translateY(110vh)';
            swipeDismissing = true;
            setTimeout(() => closePanel(), duration);
        } else {
            // Spring back with bouncy easing
            panel.style.transition = 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)';
            panel.style.transform = 'translateY(0)';
            setTimeout(() => { panel.style.transition = ''; panel.style.transform = ''; }, 420);
        }
    }

    panel.addEventListener('touchstart', onTouchStart, { passive: true });
    panel.addEventListener('touchmove', onTouchMove, { passive: true });
    panel.addEventListener('touchend', onTouchEnd, { passive: true });

    panel._removeSwipe = () => {
        panel.removeEventListener('touchstart', onTouchStart);
        panel.removeEventListener('touchmove', onTouchMove);
        panel.removeEventListener('touchend', onTouchEnd);
        delete panel._removeSwipe;
    };
}

/**
 * Close the side panel - simple, synchronized animation:
 * 1. Remove classes simultaneously
 * 2. CSS handles smooth transitions
 * 3. Map resets after animation completes
 * High keepBuffer (40) ensures India tiles stay cached for smooth zoom-out
 */
function closePanel() {
    const panel = document.getElementById('sidePanel');
    const mapFrame = document.getElementById('map-frame');
    const feedPanel = document.getElementById('feedPanel');

    // Remove swipe listeners
    if (panel && panel._removeSwipe) panel._removeSwipe();

    // Cancel any pending auto-reset
    cancelMapReset();

    if (swipeDismissing) {
        // Panel already animated off-screen by swipe — suppress CSS re-animation
        swipeDismissing = false;
        panel.style.transition = 'none';
        panel.style.transform = '';
        panel.classList.remove('open');
        void panel.offsetHeight; // force reflow
        panel.style.transition = '';
    } else {
        // Normal close — CSS transition handles the animation
        panel.classList.remove('open');
    }

    // Desktop: restore map and feed to their pre-panel state.
    // Mobile: overlay never touched the layout — nothing to restore.
    if (window.innerWidth > 768) {
        mapFrame.classList.remove('panel-open');
        feedPanel.classList.remove('hidden');
    }

    // Desktop: resize map back to full width and reset India view
    if (window.innerWidth > 768) {
        setTimeout(() => {
            map.invalidateSize({ animate: false, pan: false });
            resetMapToIndia(true);
        }, TRANSITION_DURATION);
    }

    // Restart auto-scroll after transition
    setTimeout(() => {
        initAutoScroll();
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

        // Cancel auto-reset in All India mode
        cancelMapReset();

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

        // Lock page scroll on mobile
        if (window.innerWidth <= 768) {
            const scrollY = window.scrollY;
            document.body.dataset.scrollY = scrollY;
            document.body.style.top = `-${scrollY}px`;
            document.body.classList.add('all-india-open');
        }

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

        // Show map frame, hide All India panel, restore feed panel immediately
        // Feed content is already in the DOM — no reason to delay its reveal
        requestAnimationFrame(() => {
            mapFrame.classList.remove('hidden');
            allIndiaPanel.classList.remove('visible');
            showFeedPanel();
        });

        // Restore page scroll on mobile
        if (document.body.classList.contains('all-india-open')) {
            document.body.classList.remove('all-india-open');
            document.body.style.top = '';
            const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
            window.scrollTo(0, savedScrollY);
        }

        // Recalculate map size and reset to perfect India view after animation completes
        setTimeout(() => {
            // Force recalculation of map container size
            window.dispatchEvent(new Event('resize'));
            // Give the map time to process the resize
            requestAnimationFrame(() => {
                map.invalidateSize({ animate: false, pan: false });
                // Reset map view after size recalculation
                requestAnimationFrame(() => {
                    resetMapToIndia(false); // Don't animate, just snap to correct position
                });
            });
        }, TRANSITION_DURATION + 100);
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

document.addEventListener('DOMContentLoaded', async () => {
    await loadJurisdictionRegistry();
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

    // Mobile: swipe down (pull from top) to dismiss All India panel
    const allIndiaContentEl = document.querySelector('.all-india-content');
    if (allIndiaContentEl) {
        let aiTouchStartY = 0;
        allIndiaContentEl.addEventListener('touchstart', (e) => {
            aiTouchStartY = e.touches[0].clientY;
        }, { passive: true });
        allIndiaContentEl.addEventListener('touchend', (e) => {
            if (currentViewMode !== 'allIndia') return;
            const deltaY = e.changedTouches[0].clientY - aiTouchStartY;
            // Pull-down gesture (finger moves down) while content is at the top
            if (deltaY > 70 && allIndiaContentEl.scrollTop <= 0) {
                setViewMode('state');
            }
        }, { passive: true });
    }

    // Handle Deep Linking (Query Parameters + Clean URLs)
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get('state');
    const viewParam = params.get('view');
    const path = window.location.pathname;

    let targetState = null;
    let targetView = null;

    if (viewParam === 'allIndia' || path.includes('/all-india')) {
        targetView = 'allIndia';
    } else if (stateParam) {
        const jurisdiction = resolveJurisdiction(decodeURIComponent(stateParam));
        targetState = jurisdiction ? jurisdiction.name : decodeURIComponent(stateParam);
    } else if (path.includes('/states/')) {
        // format: /states/tamil-nadu/
        const match = path.match(/\/states\/([^/]+)/);
        if (match && match[1]) {
            const jurisdiction = resolveJurisdictionSlug(match[1]);
            if (jurisdiction) targetState = jurisdiction.name;
        }
    }

    if (targetView === 'allIndia') {
        setViewMode('allIndia');
    } else if (targetState) {
        console.log('Deep linking to state:', targetState);

        // Wait for map and data to be ready
        const checkReady = setInterval(() => {
            if (geojsonLayer && recentUpdatesLoaded) {
                clearInterval(checkReady);
                openStatePanel(targetState);
            }
        }, 100);

        // Safety timeout
        setTimeout(() => clearInterval(checkReady), 10000);
    }
});

const API_BASE_URL = 'http://localhost:5001/api';

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

let map, geojsonLayer, currentPanel = null;
let recentUpdatesCache = {};
let currentViewMode = 'state'; // 'state' or 'allIndia'
let currentCategoriesData = null; // Store fetched categories for expansion
let selectedLayer = null; // Track the currently selected GeoJSON layer for centering

async function initMap() {
    map = L.map('map', { center: [22.5, 79], zoom: 5 });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    // Pre-fetch recent updates count for all states
    await fetchRecentUpdates();

    loadGeoJSON();
}

// Fetch 7-day update counts for all states
async function fetchRecentUpdates() {
    try {
        const response = await fetch(`${API_BASE_URL}/states/recent-counts`);
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
    fetch('js/india-states.geojson')
        .then(r => r.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
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
        const response = await fetch(`${API_BASE_URL}/states/${stateCode}/categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.categories;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

async function openStatePanel(stateName) {
    const stateCode = STATE_CODE_MAP[stateName];
    if (!stateCode) {
        console.warn(`State "${stateName}" not found in STATE_CODE_MAP.`);
        showPanel(stateName, '<div class="no-updates">This region is not yet configured in the tracker.</div>');
        return;
    }

    showPanel(stateName, '<div class="loading">Loading...</div>');

    const categories = await fetchStateData(stateCode);
    if (!categories) {
        showPanel(stateName, '<div style="text-align:center;padding:40px;color:#B45309;">Failed to load. Check if backend is running on port 5001.</div>');
        return;
    }

    currentCategoriesData = categories;
    showPanel(stateName, buildCategoryCards(categories));
}

// Build horizontal category cards (collapsed by default)
function buildCategoryCards(categories) {
    let totalUpdates = 0;
    CATEGORY_ORDER.forEach(cat => {
        totalUpdates += (categories[cat] || []).length;
    });

    if (totalUpdates === 0) {
        return '<div class="no-updates">No AI policy updates available yet for this state.</div>';
    }

    let html = '<div class="category-rail">';

    CATEGORY_ORDER.forEach((categoryName, index) => {
        const updates = categories[categoryName] || [];
        const config = CATEGORY_CONFIG[categoryName];
        const count = updates.length;
        const hasUpdates = count > 0;

        html += `
            <div class="category-card-compact ${hasUpdates ? '' : 'empty'}"
                 data-category="${categoryName}"
                 data-index="${index}"
                 onclick="expandCategory('${categoryName}')">
                <div class="card-icon">${config.icon}</div>
                <div class="card-info">
                    <span class="card-name">${config.shortName}</span>
                    <span class="card-count">${count} update${count !== 1 ? 's' : ''}</span>
                </div>
                <div class="card-expand-hint">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
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
    document.querySelectorAll(`${containerSelector} .category-card-compact`).forEach(card => {
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

    updates.forEach(update => {
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
    expandedContent.innerHTML = html;
    expandedContent.classList.add('visible');
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
    document.querySelectorAll(`${containerSelector} .category-card-compact`).forEach(card => {
        card.classList.remove('active');
    });

    setTimeout(() => {
        expandedContent.innerHTML = '';
    }, 300);
}

/**
 * Show the side panel and coordinate map frame resize.
 * Animation approach:
 * 1. Add classes to both map-frame and side-panel simultaneously
 * 2. CSS transitions handle the coordinated animation
 * 3. After animation completes, call map.invalidateSize() once for Leaflet reflow
 * 4. Then fit the map to the selected state's bounds for proper centering
 */
function showPanel(stateName, content) {
    const panel = document.getElementById('sidePanel');
    const mapFrame = document.getElementById('map-frame');

    document.getElementById('panelTitle').textContent = stateName;
    document.getElementById('panelContent').innerHTML = content;

    // Trigger coordinated animation via CSS classes
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
    }, TRANSITION_DURATION + 50);

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

        // Fade out map frame, show All India panel
        requestAnimationFrame(() => {
            mapFrame.classList.add('hidden');
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

        // Show map frame, hide All India panel
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
        }, TRANSITION_DURATION + 50);
    }
}

async function loadAllIndiaContent() {
    const contentEl = document.getElementById('allIndiaPanelContent');
    contentEl.innerHTML = '<div class="loading">Loading national updates...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/all-india/categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        currentCategoriesData = data.categories;
        contentEl.innerHTML = buildCategoryCards(data.categories);
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
        const response = await fetch(`${API_BASE_URL}/last-updated`);
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

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchLastUpdated();
    initInfoTooltip();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (currentPanel) closePanel();
            if (currentViewMode === 'allIndia') setViewMode('state');
        }
    });
});

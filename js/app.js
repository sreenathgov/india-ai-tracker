const API_BASE_URL = 'http://localhost:5001/api';

const STATE_CODE_MAP = {
    'Tamil Nadu': 'TN',
    'Maharashtra': 'MH',
    'Karnataka': 'KA',
    'Delhi': 'DL',
    'Telangana': 'TG'
};

const CATEGORY_ICONS = {
    'AI Policy Developments': '📋',
    'Events': '📅',
    'Investment Opportunities': '💰',
    'AI Start-Up News': '🚀',
    'Relevant News/Articles': '📰'
};

let map, geojsonLayer, currentPanel = null;

function initMap() {
    map = L.map('map', { center: [22.5, 79], zoom: 5 });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    loadGeoJSON();
}

function loadGeoJSON() {
    fetch('js/india-states.geojson')
        .then(r => r.json())
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: () => ({ fillColor: '#4A90E2', weight: 1.5, color: '#2C3E50', fillOpacity: 0.6 }),
                onEachFeature: (feature, layer) => {
                    const name = feature.properties.ST_NM;
                    layer.on({
                        mouseover: (e) => e.target.setStyle({weight: 3, fillOpacity: 0.8}),
                        mouseout: () => geojsonLayer.resetStyle(layer),
                        click: () => openStatePanel(name)
                    });
                    layer.bindTooltip(name);
                }
            }).addTo(map);
        })
        .catch(err => console.error('GeoJSON error:', err));
}

async function fetchStateData(stateCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/states/${stateCode}/categories`);
        if (!response.ok) throw new Error('Network error');
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
        console.warn('No state code for:', stateName);
        return;
    }
    
    showPanel(stateName, '<div class="loading">Loading...</div>');
    
    const categories = await fetchStateData(stateCode);
    if (!categories) {
        showPanel(stateName, '<div style="text-align:center;padding:40px;color:#E74C3C;">Failed to load updates. Is the backend running?</div>');
        return;
    }
    
    showPanel(stateName, buildPanelContent(categories));
}

function buildPanelContent(categories) {
    let html = '';
    
    for (const [categoryName, updates] of Object.entries(categories)) {
        if (updates.length === 0) continue;
        
        const icon = CATEGORY_ICONS[categoryName] || '📌';
        html += `<div class="category-section"><h3>${icon} ${categoryName}</h3><div class="updates-list">`;
        
        updates.forEach(update => {
            const date = new Date(update.date_published).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            
            html += `
                <div class="update-item">
                    <a href="${update.url}" target="_blank" class="update-title">${update.title}</a>
                    <p class="update-summary">${update.summary}</p>
                    <div class="update-meta">
                        <span>${date}</span>
                        <span>${update.source_name}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    return html || '<div class="no-updates">No updates available yet</div>';
}

function showPanel(stateName, content) {
    const panel = document.getElementById('sidePanel');
    const overlay = document.getElementById('panelOverlay');
    const mapWrapper = document.getElementById('map-wrapper');
    
    document.getElementById('panelTitle').textContent = stateName;
    document.getElementById('panelContent').innerHTML = content;
    
    panel.classList.add('open');
    overlay.classList.add('active');
    if (mapWrapper) mapWrapper.classList.add('shrink');
    
    map.dragging.disable();
    currentPanel = stateName;
}

function closePanel() {
    const panel = document.getElementById('sidePanel');
    const overlay = document.getElementById('panelOverlay');
    const mapWrapper = document.getElementById('map-wrapper');
    
    panel.classList.remove('open');
    overlay.classList.remove('active');
    if (mapWrapper) mapWrapper.classList.remove('shrink');
    
    map.dragging.enable();
    currentPanel = null;
}

function showAllIndia() {
    document.getElementById('allIndiaModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('allIndiaModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    
    // Panel overlay click closes panel
    const overlay = document.getElementById('panelOverlay');
    if (overlay) overlay.addEventListener('click', closePanel);
    
    // Modal overlay click closes modal
    const modal = document.getElementById('allIndiaModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    
    // Escape key closes panel/modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (currentPanel) closePanel();
            if (modal && modal.style.display === 'block') closeModal();
        }
    });
});

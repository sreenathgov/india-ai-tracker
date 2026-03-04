/* ============================================
   PUBLICATIONS READING EXPERIENCE

   Three-layer progressive disclosure:
   - Overview (H1) - Main reading column
   - Analysis (H2) - Panel from right
   - In Depth (H3) - Stacked panel from right
   ============================================ */

const TRANSITION_DURATION = 450;

// State management
let publicationData = null;
let currentChapter = null;
let currentSection = null;
let currentSubsection = null;
let currentLayer = 'overview';

// DOM Elements (initialized on DOMContentLoaded)
let readingColumn, readingContent;
let analysisPanel, analysisPanelTitle, analysisPanelContent;
let indepthPanel, indepthPanelTitle, indepthPanelContent;
let layerName, tocList, tocSidebar, layerIndicatorEl;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Cache DOM elements
    readingColumn = document.getElementById('readingColumn');
    readingContent = document.getElementById('readingContent');
    analysisPanel = document.getElementById('analysisPanel');
    analysisPanelTitle = document.getElementById('analysisPanelTitle');
    analysisPanelContent = document.getElementById('analysisPanelContent');
    indepthPanel = document.getElementById('indepthPanel');
    indepthPanelTitle = document.getElementById('indepthPanelTitle');
    indepthPanelContent = document.getElementById('indepthPanelContent');
    layerName = document.getElementById('layerName');
    tocList = document.getElementById('tocList');
    tocSidebar = document.getElementById('tocSidebar');
    layerIndicatorEl = document.getElementById('layerIndicator');

    // Get publication slug from URL
    const slug = getSlugFromURL();
    if (!slug) {
        renderError('No publication specified. Add ?pub=filename to the URL.');
        return;
    }

    // Load publication
    await loadPublication(slug);

    // Setup interactions
    setupPanelCloseButtons();
    setupKeyboardNavigation();
    setupScrollTracking();

    // Restore state from URL if applicable
    restoreFromURL();
});

function getSlugFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pub');
}

// ============================================
// DATA LOADING
// ============================================

async function loadPublication(slug) {
    try {
        // Fetch markdown file
        const response = await fetch(`content/publications/${slug}.md`);
        if (!response.ok) {
            throw new Error(`Publication not found: ${slug}`);
        }
        const markdownText = await response.text();

        // Parse frontmatter and content
        const { metadata, content } = parseFrontmatter(markdownText);

        // Parse markdown into structured chapters
        publicationData = parseMarkdownStructure(content, metadata);

        // Update page title
        document.title = `${publicationData.title} | India AI Tracker`;

        // Render the publication
        renderPublication();

    } catch (error) {
        console.error('Error loading publication:', error);
        renderError(`Failed to load publication: ${error.message}`);
    }
}

// ============================================
// FRONTMATTER PARSING
// ============================================

function parseFrontmatter(text) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = text.match(frontmatterRegex);

    if (!match) {
        // No frontmatter, treat entire text as content
        return {
            metadata: { title: 'Untitled', author: '', date: '' },
            content: text
        };
    }

    const frontmatterText = match[1];
    const content = match[2];

    // Simple YAML parsing for key: value pairs
    const metadata = {};
    frontmatterText.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            metadata[key] = value;
        }
    });

    return { metadata, content };
}

// ============================================
// MARKDOWN STRUCTURE PARSING
// ============================================

function parseMarkdownStructure(markdown, metadata) {
    const chapters = [];
    const lines = markdown.split('\n');

    let currentH1 = null;
    let currentH2 = null;
    let currentH3 = null;
    let contentBuffer = [];

    function flushContent() {
        const html = marked.parse(contentBuffer.join('\n').trim());
        if (currentH3 && currentH2) {
            currentH3.content = html;
        } else if (currentH2 && currentH1) {
            currentH2.content += html;
        } else if (currentH1) {
            currentH1.content += html;
        }
        contentBuffer = [];
    }

    for (const line of lines) {
        if (line.startsWith('# ') && !line.startsWith('## ') && !line.startsWith('### ')) {
            // H1 - New chapter (Overview layer)
            flushContent();
            if (currentH2 && currentH1) {
                currentH1.sections.push(currentH2);
            }
            if (currentH1) {
                chapters.push(currentH1);
            }

            currentH1 = {
                id: slugify(line.substring(2)),
                title: line.substring(2).trim(),
                content: '',
                sections: []
            };
            currentH2 = null;
            currentH3 = null;

        } else if (line.startsWith('## ') && !line.startsWith('### ')) {
            // H2 - New section (Analysis layer)
            flushContent();
            if (currentH2 && currentH1) {
                currentH1.sections.push(currentH2);
            }

            currentH2 = {
                id: slugify(line.substring(3)),
                title: line.substring(3).trim(),
                content: '',
                subsections: []
            };
            currentH3 = null;

        } else if (line.startsWith('### ')) {
            // H3 - New subsection (In Depth layer)
            flushContent();
            if (currentH3 && currentH2) {
                currentH2.subsections.push(currentH3);
            }

            currentH3 = {
                id: slugify(line.substring(4)),
                title: line.substring(4).trim(),
                content: ''
            };

        } else {
            contentBuffer.push(line);
        }
    }

    // Flush remaining content
    flushContent();
    if (currentH3 && currentH2) {
        currentH2.subsections.push(currentH3);
    }
    if (currentH2 && currentH1) {
        currentH1.sections.push(currentH2);
    }
    if (currentH1) {
        chapters.push(currentH1);
    }

    return {
        title: metadata.title || 'Untitled',
        author: metadata.author || '',
        date: metadata.date || '',
        abstract: metadata.abstract || '',
        chapters
    };
}

function slugify(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// ============================================
// RENDERING
// ============================================

function renderPublication() {
    // Update hero
    document.getElementById('publicationTitle').textContent = publicationData.title;
    document.getElementById('publicationAuthor').textContent = publicationData.author;
    document.getElementById('publicationDate').textContent = formatDate(publicationData.date);

    // Render TOC
    renderTableOfContents();

    // Render Overview layer (main content)
    renderOverviewContent();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function renderTableOfContents() {
    let html = '';

    publicationData.chapters.forEach((chapter, index) => {
        html += `
            <li class="toc-item">
                <a href="#${chapter.id}"
                   class="toc-link"
                   data-chapter="${index}"
                   onclick="scrollToChapter('${chapter.id}'); return false;">
                    ${chapter.title}
                </a>
            </li>
        `;
    });

    tocList.innerHTML = html;
}

function renderOverviewContent() {
    let html = '';

    publicationData.chapters.forEach((chapter, chapterIndex) => {
        const chapterNumber = chapterIndex + 1;
        html += `
            <section class="chapter-section" id="${chapter.id}" data-chapter="${chapterIndex}">
                <div class="chapter-kicker">Chapter ${chapterNumber}</div>
                <h2 class="chapter-title">${chapter.title}</h2>
                <div class="chapter-content">${chapter.content}</div>
        `;

        // Add clickable links to sections (Analysis layer)
        if (chapter.sections.length > 0) {
            html += '<div class="section-links">';
            chapter.sections.forEach((section, sectionIndex) => {
                html += `
                    <a class="section-link"
                       onclick="openAnalysisPanel(${chapterIndex}, ${sectionIndex})"
                       role="button"
                       tabindex="0">
                        <span class="section-link-text">${section.title}</span>
                        <span class="section-link-arrow">&rarr;</span>
                    </a>
                `;
            });
            html += '</div>';
        }

        html += '</section>';
    });

    readingContent.innerHTML = html;
}

// ============================================
// PANEL MANAGEMENT
// ============================================

function openAnalysisPanel(chapterIndex, sectionIndex) {
    const chapter = publicationData.chapters[chapterIndex];
    const section = chapter.sections[sectionIndex];

    currentChapter = chapterIndex;
    currentSection = sectionIndex;
    currentLayer = 'analysis';

    // Update panel content
    analysisPanelTitle.textContent = section.title;

    let panelHtml = section.content;

    // Add subsection links if they exist
    if (section.subsections.length > 0) {
        panelHtml += '<div class="subsection-links">';
        section.subsections.forEach((sub, subIndex) => {
            panelHtml += `
                <a class="subsection-link"
                   onclick="openIndepthPanel(${chapterIndex}, ${sectionIndex}, ${subIndex})"
                   role="button"
                   tabindex="0">
                    <span class="subsection-link-text">${sub.title}</span>
                    <span class="subsection-link-arrow">&rarr;</span>
                </a>
            `;
        });
        panelHtml += '</div>';
    }

    analysisPanelContent.innerHTML = panelHtml;

    // Animate panel open
    requestAnimationFrame(() => {
        analysisPanel.classList.add('open');
        readingColumn.classList.add('shifted');
        tocSidebar.classList.add('faded');
        updateLayerIndicator('Analysis');
    });

    // Update URL
    updateURL();
}

function closeAnalysisPanel() {
    // Close in-depth panel first if open
    if (indepthPanel.classList.contains('open')) {
        closeIndepthPanel();
    }

    currentSection = null;
    currentLayer = 'overview';

    requestAnimationFrame(() => {
        analysisPanel.classList.remove('open');
        readingColumn.classList.remove('shifted');
        tocSidebar.classList.remove('faded');
        updateLayerIndicator('Overview');
    });

    // Update URL
    updateURL();
}

function openIndepthPanel(chapterIndex, sectionIndex, subsectionIndex) {
    const chapter = publicationData.chapters[chapterIndex];
    const section = chapter.sections[sectionIndex];
    const subsection = section.subsections[subsectionIndex];

    currentSubsection = subsectionIndex;
    currentLayer = 'indepth';

    // Update panel content
    indepthPanelTitle.textContent = subsection.title;
    indepthPanelContent.innerHTML = subsection.content;

    // Animate panel open (stacks on top of analysis)
    requestAnimationFrame(() => {
        indepthPanel.classList.add('open');
        updateLayerIndicator('In Depth');
    });

    // Update URL
    updateURL();
}

function closeIndepthPanel() {
    currentSubsection = null;
    currentLayer = 'analysis';

    requestAnimationFrame(() => {
        indepthPanel.classList.remove('open');
        updateLayerIndicator('Analysis');
    });

    // Update URL
    updateURL();
}

// ============================================
// LAYER INDICATOR
// ============================================

function updateLayerIndicator(layer) {
    if (!layerName || !layerIndicatorEl) return;

    // Display label in uppercase for visual parity
    layerName.textContent = layer.toUpperCase();

    // Update indicator state classes
    layerIndicatorEl.classList.remove('layer-overview', 'layer-analysis', 'layer-indepth');

    if (layer === 'Overview') {
        layerIndicatorEl.classList.add('layer-overview');
    } else if (layer === 'Analysis') {
        layerIndicatorEl.classList.add('layer-analysis');
    } else if (layer === 'In Depth') {
        layerIndicatorEl.classList.add('layer-indepth');
    }
}

// ============================================
// NAVIGATION
// ============================================

function scrollToChapter(chapterId) {
    const element = document.getElementById(chapterId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function setupPanelCloseButtons() {
    document.getElementById('closeAnalysisBtn').addEventListener('click', closeAnalysisPanel);
    document.getElementById('closeIndepthBtn').addEventListener('click', closeIndepthPanel);

    // Click outside to close panels
    document.addEventListener('click', (e) => {
        if (currentLayer !== 'overview') {
            const clickedOnPanel = e.target.closest('.reading-panel');
            const clickedOnTrigger = e.target.closest('.section-link') ||
                                     e.target.closest('.subsection-link');

            // If click is anywhere that is not a panel or trigger, close the open layers
            if (!clickedOnPanel && !clickedOnTrigger) {
                if (currentLayer === 'indepth') {
                    closeIndepthPanel();
                } else if (currentLayer === 'analysis') {
                    closeAnalysisPanel();
                }
            }
        }
    });
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (currentLayer === 'indepth') {
                closeIndepthPanel();
            } else if (currentLayer === 'analysis') {
                closeAnalysisPanel();
            }
        }
    });

    // Allow Enter/Space on section links
    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('section-link') ||
            e.target.classList.contains('subsection-link')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.target.click();
            }
        }
    });
}

function setupScrollTracking() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                const chapterId = entry.target.id;
                updateTocHighlight(chapterId);
            }
        });
    }, {
        threshold: [0.3],
        rootMargin: '-100px 0px -50% 0px'
    });

    // Observe after content is rendered
    setTimeout(() => {
        document.querySelectorAll('.chapter-section').forEach(chapter => {
            observer.observe(chapter);
        });
    }, 100);
}

function updateTocHighlight(activeChapterId) {
    tocList.querySelectorAll('.toc-link').forEach(link => {
        const isActive = link.getAttribute('href') === `#${activeChapterId}`;
        link.classList.toggle('active', isActive);
    });
}

// ============================================
// URL STATE MANAGEMENT (Deep Linking)
// ============================================

function updateURL() {
    const params = new URLSearchParams(window.location.search);

    // Keep the pub parameter
    const pub = params.get('pub');
    const newParams = new URLSearchParams();
    if (pub) newParams.set('pub', pub);

    if (currentChapter !== null && currentSection !== null) {
        newParams.set('chapter', currentChapter);
        newParams.set('section', currentSection);
    }
    if (currentSubsection !== null) {
        newParams.set('subsection', currentSubsection);
    }

    const newURL = `${window.location.pathname}?${newParams.toString()}`;
    history.replaceState({}, '', newURL);
}

function restoreFromURL() {
    const params = new URLSearchParams(window.location.search);

    const chapter = params.get('chapter');
    const section = params.get('section');
    const subsection = params.get('subsection');

    if (section !== null && chapter !== null) {
        // Delay to allow content to render
        setTimeout(() => {
            openAnalysisPanel(parseInt(chapter), parseInt(section));

            if (subsection !== null) {
                setTimeout(() => {
                    openIndepthPanel(parseInt(chapter), parseInt(section), parseInt(subsection));
                }, TRANSITION_DURATION + 50);
            }
        }, 100);
    }
}

// ============================================
// ERROR HANDLING
// ============================================

function renderError(message) {
    readingContent.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 4rem 2rem;">
            <p style="font-family: 'Telegraf', sans-serif; color: var(--text-secondary); margin-bottom: 1.5rem;">${message}</p>
            <a href="index.html" style="font-family: 'Telegraf', sans-serif; color: var(--accent-orange); text-decoration: underline;">Return to Tracker</a>
        </div>
    `;
    document.getElementById('publicationTitle').textContent = 'Publication Not Found';
}

// Make functions available globally for onclick handlers
window.openAnalysisPanel = openAnalysisPanel;
window.openIndepthPanel = openIndepthPanel;
window.scrollToChapter = scrollToChapter;

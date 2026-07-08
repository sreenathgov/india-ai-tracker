const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const ASSETS_TO_COPY = ['js', 'css', 'data', 'assets', 'added-assets', 'api', 'KANANLABS-LOGO-SET', 'dossiers'];
const FILES_TO_COPY = [
    'index.html',
    'about.html',
    'sector-watch.html',
    'tradewatch.html',
    'tracker.html',
    'publications.html',
    'privacy-policy.html',
    'disclaimers.html',
    '404.html'
];

function buildSite() {
    console.log('🚀 Starting Full Site Build...');

    // 1a. Run Vite Build — Text Pressure widget
    // This creates dist/text-pressure-bundle.js
    try {
        console.log('📦 Running Vite build for Text Pressure widget...');
        execSync('npm run build:text-pressure', { stdio: 'inherit', cwd: PROJECT_ROOT });
    } catch (e) {
        console.error('❌ Text Pressure Vite build failed.');
        process.exit(1);
    }

    // 1b. Run Vite Build — Scroll Reveal widget
    // This creates dist/scroll-reveal-bundle.js (emptyOutDir: false preserves previous outputs)
    try {
        console.log('📦 Running Vite build for Scroll Reveal widget...');
        execSync('npm run build:scroll-reveal', { stdio: 'inherit', cwd: PROJECT_ROOT });
    } catch (e) {
        console.error('❌ Scroll Reveal Vite build failed.');
        process.exit(1);
    }

    // 2. Determine source directories
    // We need to copy static assets to dist/ to make it a self-contained deployable folder
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    // 3. Copy Key Files
    FILES_TO_COPY.forEach(file => {
        const src = path.join(PROJECT_ROOT, file);
        const dest = path.join(DIST_DIR, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`✓ Copied ${file}`);
        } else {
            console.warn(`⚠️ Warning: ${file} not found.`);
        }
    });

    // 3b. Copy public/robots.txt → dist/robots.txt (deterministic; previously a stale manual copy).
    const robotsSrc = path.join(PROJECT_ROOT, 'public', 'robots.txt');
    if (fs.existsSync(robotsSrc)) {
        fs.copyFileSync(robotsSrc, path.join(DIST_DIR, 'robots.txt'));
        console.log('✓ Copied public/robots.txt → dist/robots.txt');
    }

    // 3c. Copy public/.well-known/ → dist/.well-known/ (security.txt and other RFC-standard files).
    const wellKnownSrc = path.join(PROJECT_ROOT, 'public', '.well-known');
    if (fs.existsSync(wellKnownSrc)) {
        copyRecursiveSync(wellKnownSrc, path.join(DIST_DIR, '.well-known'), new Set(), '.well-known');
        console.log('✓ Copied public/.well-known → dist/.well-known');
    }

    // 4. Copy Directories (recursive)
    // Files to exclude from copying into dist/ (serverless functions must stay at project root)
    const EXCLUDE_FROM_DIST = new Set(['api/subscribe.js']);

    ASSETS_TO_COPY.forEach(dirName => {
        const src = path.join(PROJECT_ROOT, dirName);
        const dest = path.join(DIST_DIR, dirName);
        if (fs.existsSync(src)) {
            copyRecursiveSync(src, dest, EXCLUDE_FROM_DIST, dirName);
            console.log(`✓ Copied directory: ${dirName}`);
        }
    });

    // 5. Mirror Vite bundles into dist/dist/ so that dist/index.html can resolve
    //    <script src="dist/...bundle.js"> correctly when Vercel serves from dist/
    const BUNDLE_NAMES = ['text-pressure-bundle.js', 'scroll-reveal-bundle.js'];
    const distDistDir = path.join(DIST_DIR, 'dist');
    if (!fs.existsSync(distDistDir)) {
        fs.mkdirSync(distDistDir, { recursive: true });
    }
    BUNDLE_NAMES.forEach(bundle => {
        const src = path.join(DIST_DIR, bundle);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(distDistDir, bundle));
            console.log(`✓ Mirrored bundle → dist/dist/${bundle}`);
        }
    });

    console.log('✅ Base build complete. Ready for static page generation.');
}

function copyRecursiveSync(src, dest, excludeSet = new Set(), relativePrefix = '') {
    if (fs.existsSync(src)) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        fs.readdirSync(src).forEach(entry => {
            const srcPath = path.join(src, entry);
            const destPath = path.join(dest, entry);
            const relativePath = relativePrefix ? `${relativePrefix}/${entry}` : entry;

            if (excludeSet.has(relativePath)) {
                console.log(`  ⤷ Skipped (serverless function): ${relativePath}`);
                return;
            }

            if (fs.lstatSync(srcPath).isDirectory()) {
                copyRecursiveSync(srcPath, destPath, excludeSet, relativePath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }
}

buildSite();

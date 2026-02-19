const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const ASSETS_TO_COPY = ['js', 'css', 'data', 'assets', 'added-assets', 'api', 'KANANLABS-LOGO-SET'];
const FILES_TO_COPY = [
    'index.html',
    'about.html',
    'publications.html',
    'privacy-policy.html',
    'disclaimers.html',
    'tracker.db'
];

function buildSite() {
    console.log('🚀 Starting Full Site Build...');

    // 1. Run Vite Build (for React components)
    // This creates dist/text-pressure-bundle.js
    try {
        console.log('📦 running Vite build for widgets...');
        execSync('npm run build:text-pressure', { stdio: 'inherit', cwd: PROJECT_ROOT });
    } catch (e) {
        console.error('❌ Vite build failed.');
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

    // 4. Copy Directories (recursive)
    ASSETS_TO_COPY.forEach(dirName => {
        const src = path.join(PROJECT_ROOT, dirName);
        const dest = path.join(DIST_DIR, dirName);
        if (fs.existsSync(src)) {
            copyRecursiveSync(src, dest);
            console.log(`✓ Copied directory: ${dirName}`);
        }
    });

    console.log('✅ Base build complete. Ready for static page generation.');
}

function copyRecursiveSync(src, dest) {
    if (fs.existsSync(src)) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        fs.readdirSync(src).forEach(entry => {
            const srcPath = path.join(src, entry);
            const destPath = path.join(dest, entry);
            if (fs.lstatSync(srcPath).isDirectory()) {
                copyRecursiveSync(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }
}

buildSite();

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const data = require('../data/careers.json');
const { validateCareers } = require('../scripts/careers/validate');
const { metaChips } = require('../scripts/careers/render');
const { roleJsonLd } = require('../scripts/careers/jsonld');
const { validateApplication, MAX_CV_BYTES } = require('../api/_lib/application');
const handler = require('../api/apply');
const root = path.resolve(__dirname, '..');
const pdf = { name: 'cv.pdf', content: Buffer.from('%PDF-1.4\nTest CV\n%%EOF').toString('base64') };
const application = (overrides = {}) => ({ roleSlug: data.roles[0].slug, fullName: 'Test Applicant', email: 'applicant@example.test', cvUrl: 'https://example.test/cv.pdf', ...overrides });
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1])['@graph']);

test('four roles share valid location data across text and structured job metadata', () => {
    assert.deepEqual(validateCareers(data), []);
    assert.equal(data.roles.length, 4);
    for (const role of data.roles) {
        assert.deepEqual(metaChips(role), ['Chennai', 'On-site', 'Full-time']);
        const graph = JSON.parse(roleJsonLd(role, { advertised: true, companyDescription: data.companyDescription }))['@graph'];
        const job = graph.find(n => n['@type'] === 'JobPosting');
        assert.deepEqual(job.jobLocation.address, { '@type': 'PostalAddress', addressLocality: role.location.city, addressRegion: role.location.region, addressCountry: role.location.country });
        assert.equal(job.employmentType, 'FULL_TIME');
        assert.equal(job.validThrough, undefined);
        assert.equal(graph.find(n => n['@type'] === 'Organization').name, 'Kanan');
        const words = [data.companyDescription, role.description, ...role.responsibilities, ...role.lookingFor, ...role.niceToHave].join(' ').split(/\s+/).length;
        assert.ok(words >= 350 && words <= 450, `${role.slug}: ${words} words`);
    }
    const incomplete = structuredClone(data);
    delete incomplete.roles[0].location.region;
    assert.match(validateCareers(incomplete).join(' '), /location.region/);
    const moved = { ...data.roles[0], location: { city: 'Pune', region: 'Maharashtra', country: 'IN' } };
    assert.equal(metaChips(moved)[0], 'Pune');
    assert.match(roleJsonLd(moved, { advertised: true, companyDescription: data.companyDescription }), /Maharashtra/);
});

test('generation retires stale pages and keeps listing, details, and job metadata consistent', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kanan-careers-test-'));
    try {
        for (const relative of ['careers.html', 'templates/career-role.html', 'data/careers.json', 'scripts/generate-careers.js', 'scripts/publications/entities.js']) {
            fs.mkdirSync(path.dirname(path.join(temp, relative)), { recursive: true });
            fs.copyFileSync(path.join(root, relative), path.join(temp, relative));
        }
        fs.cpSync(path.join(root, 'scripts/careers'), path.join(temp, 'scripts/careers'), { recursive: true });
        fs.mkdirSync(path.join(temp, 'dist/careers/founding-cto'), { recursive: true });
        fs.writeFileSync(path.join(temp, 'dist/careers/founding-cto/index.html'), 'old vacancy');
        execFileSync(process.execPath, [path.join(temp, 'scripts/generate-careers.js')]);
        const generated = path.join(temp, 'dist');
        assert.deepEqual(fs.readdirSync(path.join(generated, 'careers')).sort(), data.roles.map(r => r.slug).sort());
        const listing = fs.readFileSync(path.join(generated, 'careers.html'), 'utf8');
        assert.equal((listing.match(/<article class="cr-role"/g) || []).length, 4);
        assert.equal(jsonLd(listing).find(n => n['@type'] === 'ItemList').numberOfItems, 4);
        assert.doesNotMatch(listing, /careersFilters|three written questions|Bengaluru|Founding CTO|temporarily down/);
        for (const role of data.roles) {
            const html = fs.readFileSync(path.join(generated, 'careers', role.slug, 'index.html'), 'utf8');
            assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}|Bengaluru|written answers|within a week|Project Origin/);
            assert.equal(jsonLd(html).find(n => n['@type'] === 'JobPosting').title, role.title);
            assert.match(html, new RegExp(`data-role-slug="${role.slug}"`));
            // The role template's base URL is / for shared navigation. A bare
            // #apply would therefore send candidates to the homepage.
            assert.equal((html.match(new RegExp(`href="/careers/${role.slug}/#apply"`, 'g')) || []).length, 2);
            assert.doesNotMatch(html, /href="#(?:apply|role-description)"/);
            assert.equal((html.match(/data-question-id=/g) || []).length, 1);
            assert.match(html, /Additional information/);
            assert.doesNotMatch(html, /data-required="true"/);
        }
        // A future role closure must remove it from the board and disable its form.
        const closedData = structuredClone(data);
        closedData.roles[0].status = 'filled';
        fs.writeFileSync(path.join(temp, 'data/careers.json'), JSON.stringify(closedData));
        execFileSync(process.execPath, [path.join(temp, 'scripts/generate-careers.js')]);
        const closed = fs.readFileSync(path.join(generated, 'careers', data.roles[0].slug, 'index.html'), 'utf8');
        assert.match(closed, /noindex,follow/);
        assert.doesNotMatch(closed, /id="applyForm"|"@type": "JobPosting"/);
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('legacy routes resolve directly to the replacement or the careers index', () => {
    const redirects = require('../vercel.json').redirects;
    const replaced = ['founding-product-engineer', 'founding-engineer-full-stack'];
    const retired = ['cofounder-cto', 'founding-cto', 'trade-practice-lead', 'head-of-customs-trade-compliance', 'regulatory-knowledge-engineer', 'trade-compliance-analyst', 'regulatory-systems-engineer', 'senior-data-engineer-regulatory-data'];
    for (const slug of [...replaced, ...retired]) {
        for (const suffix of ['', '/', '/index.html']) {
            const redirect = redirects.find(r => r.source === `/careers/${slug}${suffix}`);
            assert.equal(redirect?.destination, replaced.includes(slug) ? '/careers/founding-ai-engineer-full-stack/' : '/careers.html');
            assert.equal(redirect.permanent, true);
        }
        assert.ok(validateApplication(application({ roleSlug: slug })).errors.length);
    }
});

test('CV is required through a valid link or PDF; additional information is optional', () => {
    for (const role of data.roles) {
        for (const answers of [undefined, [], [{ id: 'additional_information', answer: '' }], [{ id: 'additional_information', answer: 'A relevant project.' }]]) {
            assert.deepEqual(validateApplication(application({ roleSlug: role.slug, answers })).errors, []);
            assert.deepEqual(validateApplication(application({ roleSlug: role.slug, cvUrl: '', cvFile: pdf, answers })).errors, []);
        }
    }
    for (const overrides of [
        { cvUrl: '' }, { cvUrl: 'not a link' }, { cvUrl: 'javascript:alert(1)' },
        { cvUrl: '', cvFile: { name: 'cv.docx', content: pdf.content } },
        { cvUrl: '', cvFile: { name: 'cv.pdf', content: '' } },
        { cvUrl: '', cvFile: { name: 'cv.pdf', content: Buffer.alloc(MAX_CV_BYTES + 1).toString('base64') } },
        { answers: [{ id: 'additional_information', answer: 'x'.repeat(2001) }] },
        { answers: [{ id: 'changed_your_mind', answer: 'Old question' }] }
    ]) assert.ok(validateApplication(application(overrides)).errors.length, JSON.stringify(overrides).slice(0, 100));
});

let ip = 1;
function response() {
    return { statusCode: 200, payload: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.statusCode = code; return this; }, json(body) { this.payload = body; return this; }, end() { return this; } };
}
async function withMockDelivery(run, failContact = false, failNotification = false) {
    const env = { BREVO_API_KEY: 'test-only', BREVO_CAREERS_LIST_ID: '123', BREVO_CAREERS_TEMPLATE_ID: '456', CAREERS_NOTIFY_EMAIL: 'reviewer@example.test', CAREERS_SENDER_EMAIL: 'careers@example.test', MAKE_WEBHOOK_URL: 'https://example.test/mock-webhook' };
    const previous = Object.fromEntries(Object.keys(env).map(k => [k, process.env[k]]));
    const calls = [];
    const realFetch = global.fetch;
    Object.assign(process.env, env);
    global.fetch = async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) });
        const fail = (failContact && url.endsWith('/contacts')) || (failNotification && url.endsWith('/email'));
        return { ok: !fail, status: fail ? 503 : 201, json: async () => ({ message: 'Mock delivery result' }) };
    };
    try { await run(calls); }
    finally {
        global.fetch = realFetch;
        for (const [k, v] of Object.entries(previous)) v === undefined ? delete process.env[k] : process.env[k] = v;
    }
}
const request = body => ({ method: 'POST', body, headers: { origin: 'https://kananlabs.in', 'x-forwarded-for': `192.0.2.${ip++}` }, socket: {} });

test('mocked delivery preserves CV, note, canonical role, and candidate acknowledgement', async () => {
    await withMockDelivery(async calls => {
        const res = response();
        await handler(request(application({ cvUrl: '', cvFile: pdf, roleTitle: 'Untrusted title', answers: [{ id: 'additional_information', answer: 'My project <script>alert(1)</script>' }] })), res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.payload.success, true);
        assert.equal(calls.length, 4);
        assert.equal(calls[0].body.attributes.ROLE_TITLE, data.roles[0].title);
        assert.match(calls[0].body.attributes.ANSWERS, /additional_information/);
        assert.equal(calls[1].body.sender.name, 'Kanan');
        assert.deepEqual(calls[1].body.attachment, [pdf]);
        assert.match(calls[1].body.htmlContent, /&lt;script&gt;/);
        assert.doesNotMatch(calls[1].body.htmlContent, /<script>/);
        assert.equal(calls[2].body.params.ROLE_TITLE, data.roles[0].title);
        assert.equal(calls[3].body.hasCvAttachment, true);
    });
});

test('invalid applications make no external calls; a storage failure returns an error', async () => {
    await withMockDelivery(async calls => {
        const res = response();
        await handler(request(application({ cvUrl: '' })), res);
        assert.equal(res.statusCode, 400);
        assert.equal(calls.length, 0);
    });
    await withMockDelivery(async calls => {
        const res = response();
        await handler(request(application()), res);
        assert.equal(res.statusCode, 502);
        assert.notEqual(res.payload.success, true);
        assert.equal(calls.length, 1);
    }, true);
});

test('careers never confirms receipt when the full application and CV were not delivered', async () => {
    await withMockDelivery(async calls => {
        const res = response();
        await handler(request(application({cvUrl:'',cvFile:pdf})),res);
        assert.equal(res.statusCode,502);
        assert.notEqual(res.payload.success,true);
        assert.match(res.payload.message,/complete application/);
        assert.equal(calls.length,2);
    },false,true);
});

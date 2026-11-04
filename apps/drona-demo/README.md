# Drona private guided demonstration

This app is an isolated copy of the Drona demonstration, prepared for invited investors, accelerators, competitions and prospective customers. It belongs under `india-ai-tracker/apps/drona-demo` and has its own Next.js dependencies, build and Vercel project. The public website's static build is unchanged.

The desktop walkthrough follows one fictional Wind Energy order into Deccan’s multi-tier steel-billet disruption forecast: signal, order dependency, four-day response window, targeted supplier questions, updated assessment, proposed action and inspectable reasoning/source records. Protective evidence can close the scoped exposure; Unknown is not No. The independent Tiruchi CBAM investigation remains available. The fixed scenario day is 2 November 2026. Fictional news and owner records illustrate intended product behavior, not measured predictive performance or live mitigation. See MATERIAL_CASE.md for the exact dates, assumptions and financial basis.

## Walkthrough revamp continuity

Read [the approved walkthrough framework and resumption record](WALKTHROUGH_FRAMEWORK.md) before continuing the revamp after compaction. It records the teaching principles, approval cadence, completed three-act arc, accepted spotlight design and exploration handoff. The latest founder authorization permits this bounded release; future redesign remains founder-directed.

## Local use

Use Node.js 24 and `npm ci`. Provision local access with the script described in `README_AUTH.md`; keep the generated Next dotenv configuration in ignored `.env.local`. Run `npm run build` followed by `npm start`. The local address is `http://127.0.0.1:3402/login`. `npm run dev` provides development mode on that same port.

The public login is standalone HTML. All application routes, Next.js JavaScript, CSS and font assets require a valid server-checked session. Missing configuration or unconfirmed production edge protection fails closed. Replay clears the demonstration state without signing the visitor out. Session expiry returns the visitor to sign-in.

## Verification

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run verify:boundary`
- `DRONA_E2E_CREDENTIALS_FILE=/absolute/private/credential-file npm run test:e2e` against an explicitly started local server.

Browser tests use an isolated Chrome/Chromium profile, deny third-party requests, and never retain authentication storage, traces or video. Do not publish test/operator credential files or browser artifacts.

## Hosting boundary

Deploy this directory as a separate Vercel project in the existing account; do not point the public website project at it. The intended invitation address is `https://demo.kananlabs.in`. Configure production secrets, persistent login rate limiting and the first-party domain before enabling access. `README_AUTH.md` defines the invite lifecycle and stateless-session limits.

Do not add a public navigation link or sitemap entry. No analytics, microphone, live AI, supplier outreach, real customer data or autonomous legal decision is enabled. The contextual Drona responses and sample owner replies are authored demonstration interactions.

The parent GitHub repository is public. Sreenath explicitly authorized committing and pushing this reviewed demo module on 4 November 2026. This includes only application source, tests and nonsecret continuity records. Operator files, environment configuration, credentials, browser sessions and private artifacts remain excluded. Deploy only this app to its existing separate Vercel project.

## Assets and provenance

`SOURCE_MANIFEST.json` hashes the original working-tree inputs; `TRANSFER_MANIFEST.json` records the transferred source and scoped implementation updates. The original local demo remains unchanged. Private authoring paths and named counterparties have been removed from the external copy. Public regulatory references retain their source links and limitations.

Geist fonts retain their official notices under `public/licenses/`. Natural Earth map provenance is in `src/lib/map/geo/SOURCE.md`. The original Paragon font is deliberately excluded pending confirmed web-distribution rights; display typography uses the system Georgia serif fallback.

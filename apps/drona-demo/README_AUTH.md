# Private demonstration access

This application uses provisioned invitations, salted password hashes and standard
HS256 JWT sessions through `jose`. It has no public registration, email delivery,
password-reset service, billing service or live customer database.

## Application boundary

`src/proxy.ts` checks every request, including `/_next/static`, fonts, media,
RSC/prefetch requests, private pages and APIs. There is deliberately no exclusion
matcher. The public login is a standalone HTML Route Handler and needs no Next
JavaScript or private font. Its optional prism background is bundled locally and
embedded with the same per-response nonce as the inline stylesheet. The CSP
permits only that nonce and forbids network connections; no login asset route is
public. Without JavaScript or WebGL, the form and CSS fallback remain usable.
Public exceptions are exact GET/HEAD `/login`, exact
POST `/api/auth/login`, and GET/HEAD `/robots.txt`.

Protected server pages also call `requireDemoSession()` from
`@/lib/auth/server`. The protected root layout provides this second check for
rendered pages; any future data endpoint must verify its own session as the
existing logout/status endpoints do. Never add an unauthenticated public-data
route or put customer information into the client bundle.

Every request must use the exact `DRONA_DEMO_ORIGIN`. Provider preview/origin URLs
are denied unless explicitly configured as that deployment's origin. Configure
preview variables independently; never weaken host checks to `*.vercel.app`.
The supplied HTTP Host must exactly match the configured host and port; forwarded
host headers are ignored. This accommodates Next's internal URL normalization
without admitting another external authority. State changes separately require
the exact configured Origin and their CSRF proof. The hosting platform must enforce
HTTPS in front of the application.

## Server configuration

| Variable | Requirement |
| --- | --- |
| `DRONA_DEMO_ORIGIN` | Exact HTTPS origin, without a path, query or credentials |
| `DRONA_SESSION_SECRET` | Canonical base64url-encoded 32–64 random bytes; keep in host secret storage |
| `DRONA_DEMO_INVITES_JSON` | JSON array of invitation records; maximum 64 records |
| `DRONA_EDGE_RATE_LIMIT_READY` | Must be exactly `true` before production login opens |
| `DRONA_ALLOW_INSECURE_LOCAL` | Explicit `true` only for loopback HTTP development, never Vercel |

Invitation fields are `id`, `username`, `passwordHash`, `expiresAt` (ISO timestamp),
`disabled` (boolean) and `credentialVersion` (positive integer). Password hashes use
`scrypt$131072$8$1$<16-byte-base64url-salt>$<64-byte-base64url-derived-key>`.
Passwords are never stored in the application, source manifest or browser bundle.
Unknown usernames still perform an equally expensive dummy password verification.

No configuration has an access-enabling default. Missing, malformed, duplicate or
unsafe configuration closes access. Test fixtures are explicitly artificial and
are not accepted automatically by production.

## Provisioning — explicit operator action

Do not run this as part of build or deployment. Add `/.local/` to the app's
`.gitignore` first. Then use `node scripts/provision-demo.mjs --help` for options.
Pass the intended username(s), exact origin and future ISO expiry. No actual
credentials are generated merely by installing or building this repository.

When explicitly run, the script writes these files under a new ignored `.local/`
directory with owner-only permissions:

- `credentials.txt`: plaintext recipient access details for manual sharing.
- `configuration.env`: Next dotenv representation of hashed invitations, server
  secret and server-only settings. Literal dollar signs are escaped for Next's
  `dotenv-expand` processing, including inside the quoted invitation JSON.
- `hosting-config.json`: the same settings as raw JSON string values for a hosting
  API or CLI. These values have no dotenv quoting or dollar-sign escapes.
- `OPERATIONS.txt`: handover/removal instructions.

The script never prints secrets, refuses to overwrite an existing directory and
starts with production login disabled. Put the configuration in the hosting
secret manager; never commit or publish the generated directory, paste it into
chat, or expose those values through `NEXT_PUBLIC_*`.

For local development, copy `configuration.env` intact to an ignored `.env.local`
using local file tools. Do not shell-source or remove its dollar-sign escapes:
Next's dotenv expansion differs from both shell parsing and raw hosting values.
For hosting configuration, parse `hosting-config.json` locally and send its raw
string values through the host's secret API/CLI. Do not paste the escaped dotenv
line or print the JSON to terminals, chat or build logs. A quoted dotenv value
alone does not prevent Next from expanding dollar signs in a scrypt hash.

The HTTP exception requires both loopback origin and the explicit local flag, and
is rejected when Vercel environment markers are present. A regression test runs
the provisioner only in a temporary ignored fixture directory, then loads its
dotenv output through `@next/env` in a fresh process. It verifies hash preservation,
raw-host-value equality and password verification using safe boolean results; it
does not create or print operational credentials.

## Production rate limiting is a release requirement

Configure and test a persistent Vercel WAF rate-limit rule applying to
POST `/api/auth/login` on the production project and relevant previews. Set an
appropriate per-IP window, monitor false positives for shared judging-panel
networks, and verify repeated requests actually return 429 from separate requests.
Only then set `DRONA_EDGE_RATE_LIMIT_READY=true` and redeploy. The boolean records
an operator's completed setup; it cannot configure or prove the edge rule itself.

The in-process bounded username limiter is a secondary guard. Serverless instances
do not share its counters, so it is not persistent rate limiting and must never
be described as such. Confirm hosting plan suitability and quotas before release.

## Sessions, logout and revocation

HTTPS sessions use a Secure, HttpOnly, SameSite=Lax, host-only `__Host-` cookie at
path `/`. Sessions last at most eight hours and never outlive their invitation.
Every protected request rechecks the invite's disabled flag, expiry and version.

Server pages can call `getLogoutCsrfToken()` and pass the returned string into:

```tsx
<form method="post" action="/api/auth/logout">
  <input type="hidden" name="csrf" value={csrf} />
  <button type="submit">Sign out</button>
</form>
```

Login uses an expiring host-only double-submit token. Logout uses a session-bound
HMAC token. Both also require the exact configured browser Origin; GET cannot
change authentication state. Redirect destinations are fixed local routes.

`GET /api/auth/status` returns only the authenticated session's expiry. A private
client can use it on focus/visibility return to recover from expired/revoked access.
It does not return the cookie, account configuration or password hash.

To revoke an invitation, disable it or increment its `credentialVersion`, update
the server configuration, and redeploy. Removing the record also revokes it.
Rotating the signing secret revokes all current sessions after redeployment. Do
not accidentally rotate it when adding one recipient. Expiration is checked on
every request without needing another deployment.

Logout removes this browser's cookie. Because sessions are stateless, an already
copied/stolen token remains valid until expiry or account/key revocation. There
is no claim of immediate individual token invalidation. A durable session store
is required if that becomes necessary. Already downloaded information cannot be
removed from an authorized visitor's browser or saved files.

## Verification and remaining release duties

Focused Vitest checks cover unsafe/missing configuration, invitation lifecycle,
JWT forgery/audience/expiry, password hashing, CSRF/origin, bounded bodies,
secondary abuse limits and direct private-asset/proxy access. Production smoke
tests must additionally verify actual platform middleware execution, custom and
provider URLs, private static caching, real edge rate limiting, session expiry,
logout/Back navigation, no public source maps and multi-visitor isolation.

All private responses request no-store at browser and CDN layers. Noindex/robots
are supplementary discovery controls, not authentication. Preserve synthetic data
and review source/asset licenses before distribution. No secrets, customer data or
internal Company Brain records belong in browser-delivered code.

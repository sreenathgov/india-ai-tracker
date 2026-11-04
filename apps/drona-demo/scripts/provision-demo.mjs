#!/usr/bin/env node
/** Creates local secrets only when explicitly run by an operator. Never prints them. */
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const help = `Create private demonstration invites in an ignored local directory.
Usage: node scripts/provision-demo.mjs --username recipient-name [--username another-name]
       --origin https://demo.company-domain.example --expires ISO-8601-date
       [--out .local/demo-access]

The command writes credentials.txt (share manually), configuration.env (Next dotenv),
hosting-config.json (raw server values) and OPERATIONS.txt with mode 0600.
It refuses to overwrite an existing directory.
No credentials are printed. Production login remains disabled until edge limiting
is actually configured, checked, and DRONA_EDGE_RATE_LIMIT_READY is set to true.
`;

function stop(message) { console.error(message); process.exit(1); }
const args = process.argv.slice(2);
if (args.includes("--help")) { process.stdout.write(help); process.exit(0); }
const users = [];
let origin;
let expiry;
let output = ".local/demo-access";
for (let index = 0; index < args.length; index += 2) {
  const name = args[index]; const value = args[index + 1];
  if (!value || value.startsWith("--")) stop("Each option requires a value. Use --help for instructions.");
  if (name === "--username") users.push(value.toLowerCase());
  else if (name === "--origin") origin = value;
  else if (name === "--expires") expiry = value;
  else if (name === "--out") output = value;
  else stop("Unknown option. Use --help for instructions.");
}
if (!users.length || users.length > 64 || users.some((user) => !/^[a-z0-9][a-z0-9._-]{2,63}$/.test(user)) || new Set(users).size !== users.length) stop("Provide one or more unique usernames of 3–64 letters, digits, dots, hyphens or underscores.");
let url;
try { url = new URL(origin); } catch { stop("Provide a valid --origin."); }
const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && url.protocol === "http:";
if ((!local && url.protocol !== "https:") || url.username || url.password || url.pathname !== "/" || url.search || url.hash) stop("Origin must be HTTPS with no path; HTTP is allowed only for loopback development.");
const expiresAt = Date.parse(expiry ?? "");
if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !/^\d{4}-\d{2}-\d{2}T/.test(expiry ?? "")) stop("Provide a future --expires timestamp in ISO-8601 format.");
if (!/^\.local\/[a-zA-Z0-9_-]{1,64}$/.test(output)) stop("Output must be one named directory under .local/.");
let ignored;
try { ignored = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf8"); } catch { stop("Create .gitignore with /.local/ before provisioning credentials."); }
if (!ignored.split(/\r?\n/).some((line) => [".local/", "/.local/"].includes(line.trim()))) stop("Add /.local/ to .gitignore before provisioning credentials.");
const base = path.resolve(".local");
if (fs.existsSync(base)) {
  const stat = fs.lstatSync(base);
  if (!stat.isDirectory() || stat.isSymbolicLink()) stop(".local must be an ordinary private directory.");
} else fs.mkdirSync(base, { mode: 0o700 });
fs.chmodSync(base, 0o700);
const destination = path.resolve(output);
if (fs.existsSync(destination)) stop("Output already exists. Choose a new local directory; existing access was not changed.");
fs.mkdirSync(destination, { mode: 0o700 });
const credentials = [];
const invites = users.map((username) => {
  const password = randomBytes(24).toString("base64url");
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  credentials.push(`Username: ${username}\nPassword: ${password}\nAccess expires: ${new Date(expiresAt).toISOString()}\n`);
  return { id: randomUUID(), username, passwordHash: `scrypt$131072$8$1$${salt.toString("base64url")}$${hash.toString("base64url")}`, expiresAt: new Date(expiresAt).toISOString(), disabled: false, credentialVersion: 1 };
});
// Hosting APIs need raw values; Next's dotenv-expand additionally interprets '$'
// even inside single quotes. Keep those two delivery representations explicit.
const hostingConfig = {
  DRONA_DEMO_ORIGIN: url.origin,
  DRONA_SESSION_SECRET: randomBytes(32).toString("base64url"),
  DRONA_DEMO_INVITES_JSON: JSON.stringify(invites),
  DRONA_EDGE_RATE_LIMIT_READY: "false",
  ...(local ? { DRONA_ALLOW_INSECURE_LOCAL: "true" } : {}),
};
const configuration = [
  "# Next dotenv format only. Literal dollar signs are escaped for dotenv-expand.",
  "# Server-only values. Never commit, paste into chat, or use NEXT_PUBLIC names.",
  ...Object.entries(hostingConfig).map(([key, value]) => {
    const escaped = value.replace(/\$/g, "\\$");
    return `${key}=${key === "DRONA_DEMO_INVITES_JSON" ? `'${escaped}'` : escaped}`;
  }),
  "",
].join("\n");
function write(name, value) { fs.writeFileSync(path.join(destination, name), value, { flag: "wx", mode: 0o600 }); }
write("credentials.txt", `PRIVATE ACCESS DETAILS — SHARE ONLY WITH THE NAMED RECIPIENT\n${url.origin}/login\n\n${credentials.join("\n")}`);
write("configuration.env", configuration);
write("hosting-config.json", JSON.stringify(hostingConfig, null, 2) + "\n");
write("OPERATIONS.txt", "configuration.env is Next dotenv format: copy it intact to .env.local and do not shell-source it. Its escaped dollar signs must not be pasted as raw hosting values. hosting-config.json contains raw server environment values for a hosting API or CLI; parse it locally without printing it, and do not add quoting or dollar escaping. Do not expose either file publicly. For multiple recipients provision them in one run or merge hashed invite records carefully; never replace a live signing secret unintentionally. Configure persistent edge rate limiting for POST /api/auth/login before enabling production login. A disabled flag or credentialVersion change revokes that invite after redeployment; rotating the signing secret revokes all sessions after redeployment. Removing the browser cookie on logout does not revoke a separately stolen cookie.\n");
process.stdout.write("Private access files created under the requested ignored .local directory. Values were not printed.\n");

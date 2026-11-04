import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".next/static");
if (!fs.existsSync(root)) throw new Error("Build the demo before checking its client boundary.");
const forbidden = ["Nordex", "NORDEX", "kanan-ops/company-brain", "~/Downloads", "codex cache", "DRONA_SESSION_SECRET", "DRONA_DEMO_INVITES_JSON"];
const failures = [];
let files = 0;
let compiledCss = "";
function inspect(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const target = path.join(folder, entry.name);
    if (entry.isDirectory()) { inspect(target); continue; }
    if (entry.name.endsWith(".map")) failures.push(path.relative(root, target) + ": public source map");
    if (!/\.(js|css|json|html)$/.test(entry.name)) continue;
    files++;
    const content = fs.readFileSync(target, "utf8");
    if (entry.name.endsWith(".css")) compiledCss += content;
    for (const token of forbidden) if (content.includes(token)) failures.push(path.relative(root, target) + ": forbidden internal reference");
  }
}
inspect(root);
const loginScript = path.resolve("src/lib/login/generated/prism-script.ts");
if (!fs.existsSync(loginScript)) failures.push("Standalone login background was not generated.");
else {
  const content = fs.readFileSync(loginScript, "utf8");
  files++;
  for (const token of forbidden) if (content.includes(token)) failures.push("Login decoration: forbidden internal reference.");
  if (/import\s*\(|sourceMappingURL/.test(content)) failures.push("Login decoration contains a runtime import or source map.");
}
if (compiledCss.includes("@tailwind")) failures.push("Styling build incomplete: uncompiled Tailwind directives remain.");
if (!/\.flex\s*\{[^}]*display:flex/.test(compiledCss)) failures.push("Styling build incomplete: required layout utility is absent.");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Private client boundary passed: ${files} text assets checked; no forbidden authoring references, server auth configuration names or source maps.`);

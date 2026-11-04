import "server-only";
import { LOGIN_PRISM_SCRIPT } from "./generated/prism-script";

/** This page intentionally does not load any authenticated application assets. */
const styles = `
:root{color-scheme:dark;--wine:#762c36;--ink:#200b0d;--cream:#eeebe3}
*,*::before,*::after{box-sizing:border-box}
html{min-width:280px;background:var(--ink)}
body{margin:0;color:var(--cream);background:var(--ink);font:400 15px/1.55 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.ambient,.prism,.tint,.grid,.scrim{position:fixed;inset:0;pointer-events:none}
.ambient{background:radial-gradient(ellipse 80% 60% at 50% 40%,rgba(74,24,32,.9),rgba(32,11,13,0) 70%),radial-gradient(ellipse 50% 40% at 50% 55%,rgba(226,165,66,.06),transparent 70%)}
.prism{overflow:hidden;isolation:isolate}
.prism canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0}
.prism[data-render="ready"] canvas{opacity:1}
.tint{background:var(--wine);mix-blend-mode:hue}
.grid{background-image:linear-gradient(rgba(238,235,227,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(238,235,227,.03) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,black 20%,transparent 80%);-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,black 20%,transparent 80%)}
.scrim{background:radial-gradient(ellipse 440px 520px at 50% 46%,rgba(24,7,11,.7) 0%,rgba(24,7,11,.4) 55%,transparent 100%),linear-gradient(0deg,rgba(24,7,11,.7),transparent 24%)}
.page{position:relative;z-index:1;min-height:100vh;min-height:100svh;display:flex;flex-direction:column;padding:56px 24px 26px}
main{width:100%;max-width:760px;margin:auto; padding:28px 0 72px;text-align:center}
h1{font:400 clamp(44px,7vw,88px)/1.05 Georgia,"Times New Roman",serif;letter-spacing:-.045em;margin:0;color:var(--cream);text-wrap:balance;text-shadow:0 2px 28px rgba(24,7,11,.3)}
.intro{max-width:40ch;margin:20px auto 0;color:#e0d4d3;font-size:15px;line-height:1.6;text-wrap:balance}
.access{position:relative;isolation:isolate;width:100%;max-width:360px;margin:56px auto 0;text-align:left}
.access::before{content:"";position:absolute;inset:-24px;z-index:-1;background:rgba(27,25,31,.74);border:1px solid rgba(255,249,240,.22);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 16px 60px rgba(12,7,14,.1)}
form{display:grid;gap:0}
label{display:block;font-size:12px;line-height:1.5;font-weight:500;color:var(--cream);margin:0 0 8px}
label[for="password"]{margin-top:20px}
input{width:100%;min-height:50px;border:1px solid rgba(238,235,227,.36);border-radius:5px;padding:12px 14px;background:rgba(17,20,28,.22);color:var(--cream);box-shadow:inset 0 1px 2px rgba(12,7,14,.06);font:inherit;font-size:16px;line-height:1.5;caret-color:var(--cream);transition:border-color .15s ease,background-color .15s ease}
input:hover{border-color:rgba(238,235,227,.62)}
input:focus-visible{outline:2px solid var(--cream);outline-offset:3px;border-color:#e8bbb8}
input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus{-webkit-text-fill-color:var(--cream);caret-color:var(--cream);-webkit-box-shadow:0 0 0 1000px #363039 inset}
button{font-family:inherit}
.enter{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:50px;width:100%;margin-top:26px;padding:13px 16px;border:1px solid var(--cream);border-radius:5px;background:var(--cream);color:#291016;font-size:14px;line-height:1.5;font-weight:600;cursor:pointer;transition:background-color .15s ease,border-color .15s ease}
.enter:hover{background:#fff9ed;border-color:#fff9ed}
button:focus-visible{outline:2px solid var(--cream);outline-offset:4px}
.enter:disabled{background:#c1b4b6;border-color:#c1b4b6;color:#3e252b;cursor:default}
.notice{font-size:13px;line-height:1.6;color:#e9d8d8;margin:18px 0 0}
.notice.error{color:#ffd0c9}
footer{text-align:center;color:#d3bfbe;font-size:11px;line-height:1.7}
footer p{margin:0}
.legal{display:block;font-size:10px;letter-spacing:.035em;margin-top:3px}
.motion-toggle{position:absolute;right:24px;bottom:20px;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:1px solid rgba(238,235,227,.2);border-radius:50%;background:rgba(238,235,227,.035);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:var(--cream);cursor:pointer;transition:background-color .2s ease,border-color .2s ease}
.motion-toggle:hover{border-color:rgba(238,235,227,.5);background:rgba(238,235,227,.09)}
.motion-toggle svg{width:12px;height:12px;fill:currentColor}
.motion-toggle [data-motion-label]{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@supports ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.access::before{background:linear-gradient(135deg,rgba(255,249,240,.12),rgba(255,249,240,.035)50%,rgba(16,21,30,.12));-webkit-backdrop-filter:blur(28px) saturate(.75);backdrop-filter:blur(28px) saturate(.75)}}
.motion-toggle[aria-pressed="true"] .pause-icon,.motion-toggle[aria-pressed="false"] .play-icon{display:none}
[hidden]{display:none!important}
@media(max-width:600px){.page{padding-top:36px;padding-bottom:18px}main{padding:24px 0 64px}.intro{max-width:34ch;font-size:14px}.access{margin-top:48px}.access::before{inset:-20px -12px}.motion-toggle{position:static;margin:18px auto 0}}
@media(max-height:700px) and (min-width:601px){.page{padding-top:24px}main{padding:12px 0 56px}h1{font-size:64px}.access{margin-top:44px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;scroll-behavior:auto!important}}
@media(forced-colors:active){.ambient,.prism,.tint,.grid,.scrim{display:none}.access::before{background:Canvas;border-color:CanvasText}input,button{border:1px solid ButtonText}body,h1,.intro,label,footer,.notice{color:CanvasText}.enter:disabled{color:GrayText}}
`;

type LoginPresentation = {
  csrf: string;
  nonce: string;
  enabled: boolean;
  error: boolean;
  expired: boolean;
};

export function renderLoginPage({ csrf, nonce, enabled, error, expired }: LoginPresentation): string {
  // Only these fixed messages enter HTML; URL query values are never reflected.
  const notice = !enabled ? "Access is temporarily unavailable." : error ? "Check your username and password." : expired ? "Session ended. Sign in again." : "";
  const noticeHtml = notice ? `<p class="notice${error && enabled ? " error" : ""}" role="${error && enabled ? "alert" : "status"}">${notice}</p>` : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="color-scheme" content="dark"><meta name="theme-color" content="#200b0d"><title>Explore Drona · Private demonstration</title><style nonce="${nonce}">${styles}</style></head>
<body>
<div class="ambient" aria-hidden="true"></div>
<div id="demo-prism-bg" class="prism" aria-hidden="true" data-render="fallback" data-animation-type="3drotate" data-height="3.5" data-base-width="5.6" data-scale="3.6" data-noise="0" data-glow="1" data-time-scale="0.5" data-max-fps="30" data-max-dpr="1.5"></div>
<div class="tint" aria-hidden="true"></div><div class="grid" aria-hidden="true"></div><div class="scrim" aria-hidden="true"></div>
<div class="page"><main>
<h1>Explore Drona.</h1><p class="intro">A guided demonstration of supply-chain risk intelligence.</p>
<div class="access"><form method="post" action="/api/auth/login"><input type="hidden" name="csrf" value="${csrf}"><label for="username">Username</label><input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="64"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024"><button class="enter" type="submit"${enabled ? "" : " disabled"}>Enter demo <span aria-hidden="true">→</span></button></form>${noticeHtml}</div>
</main><footer><p>Private demonstration · Illustrative data<span class="legal">KANANX ANALYTICS PRIVATE LIMITED</span></p>
<button id="motion-toggle" class="motion-toggle" type="button" aria-label="Pause background animation" title="Pause background animation" aria-pressed="false" hidden><svg class="pause-icon" viewBox="0 0 12 12" aria-hidden="true"><rect x="3" y="1.5" width="1.5" height="9" rx=".75"/><rect x="7.5" y="1.5" width="1.5" height="9" rx=".75"/></svg><svg class="play-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="m3 1 8 5-8 5z"/></svg><span data-motion-label>Pause motion</span></button></footer></div>
<script nonce="${nonce}">${LOGIN_PRISM_SCRIPT}</script></body></html>`;
}

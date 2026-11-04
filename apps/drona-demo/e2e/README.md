# Private guided-demo browser checks

Run these checks against an already started, optimized local build at `http://127.0.0.1:3402`. The suite uses installed Google Chrome in an isolated headless profile and blocks non-local browser requests.

Set `DRONA_E2E_CREDENTIALS_FILE` to a private local file containing either JSON `username` and `password` fields or separate `Username:` and `Password:` lines, then run:

```sh
./node_modules/.bin/playwright test
```

The credential file must stay outside source control and deployment uploads. A successful sign-in is reused only in memory. Traces, video, filled-login screenshots and saved session-state files are disabled. Presentation screenshots contain empty fields only.

The seven guided-demo checks cover anonymous asset and route protection, invalid sign-in, the main guided journey and replay, Unknown replies and refresh, browser-context isolation, mobile keyboard focus and overflow, and login/logout CSRF checks. They include an Evidence & reasoning excursion and an Escape/reopen case check.

Artifacts are written to `e2e/artifacts/`: a JSON report and screenshots of the authenticated introduction, supplier result, completion and mobile result. Screenshots and successful assertions provide bounded browser evidence; they are not a full accessibility certification or proof of production-domain protection. Production deployment, edge rate limits, credential revocation and rollback require their own release checks.

Four login-presentation checks cover the centered prism, pause and reduced motion, mobile and short screens, missing WebGL, and a real native form submission with JavaScript disabled. Empty-field screenshots are written to `e2e/artifacts/login-redesign/`.

The Act One map introduction is an observation stage before the order journey. Two additional browser checks cover its real-map spotlight, digital-twin copy, inert background, keyboard controls, Back/Exit, restored dashboard position, five viewport sizes (1440×1000, 1024×768, 375×812, 375×480 and 320×640), and the WebGL fallback. Short screens retain visible navigation while the explanatory text scrolls.

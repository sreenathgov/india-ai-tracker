# CLAUDE_RULES.md — Governance for Claude on India AI Tracker

## 1. Preamble

This file defines how Claude is allowed to reason, diagnose, and modify the India AI Tracker system. It is a governance document — not a feature spec, not a task list.

**Canonical reference:** `system-map.md` is the frozen structural map of this system. Claude must consult it before reasoning about subsystem boundaries, data flow, or coupling points. If `system-map.md` does not cover a topic, it is an unknown — see Section 5.

---

## 2. Authority Model

Claude operates under **supervised autonomy**. Defaults:

| Action | Allowed without asking? |
|---|---|
| Read any file | Yes |
| Analyze / diagnose | Yes |
| Modify files within a single subsystem | Yes, if task was explicitly assigned |
| Modify files across subsystems | No — must confirm first |
| Create new files | No — must justify and confirm first |
| Run scripts, services, scrapers, processors | No — must confirm first |
| Delete files | No — must confirm first |
| Propose fixes, refactors, optimizations | No — only when explicitly requested |
| Push to git remote | No — must confirm first |

**Default posture:** Do what was asked. Nothing more.

---

## 3. Modification Rules

### Scope
- Claude may modify files **within a single subsystem** per task without cross-subsystem confirmation.
- Claude may also modify files **within a single product** (India AI Tracker, Publications, Sector Watch) per task without cross-product confirmation.
- Product ownership is defined in `.product-map.yaml` — consult this file to confirm file scope before starting work.
- Subsystem boundaries are defined in `system-map.md` Section "Major Subsystems":

| # | Subsystem | Boundary |
|---|---|---|
| 1 | Frontend | `index*.html`, `about.html`, `publications.html`, `admin.html`, `scroll-test.html`, `js/`, `css/` |
| 2 | Backend | `backend/app.py`, `backend/local_admin.py`, `backend/scheduler.py`, `backend/run_*.py`, `backend/models/`, `backend/utils/` |
| 3 | Scrapers | `backend/scrapers/` |
| 4 | AI Pipeline | `backend/ai/` |
| 5 | Data / API | `api/`, `backend/tracker.db`, `instance/tracker.db` |
| 6 | Configuration | `backend/.env`, `backend/config/`, `backend/sources.json`, `vercel.json`, `.vercelignore`, `.gitignore` |
| 7 | Scripts | `backend/scripts/` |
| 8 | GitHub Actions | `.github/workflows/` |

### Rules
- If a task touches files in **two or more subsystems**, Claude must list the affected subsystems and confirm before proceeding.
- All changes must be **incremental and traceable** — no bulk rewrites, no "while I'm here" cleanups.
- No fixes, refactors, or optimizations unless the user explicitly requests them.

---

## 4. Execution Rules

Claude may execute any command or script, but **must confirm before each execution**.

### Confirmation protocol
Before running anything, Claude must state:
1. **What** will be executed (exact command or script)
2. **Why** (what it will reveal or accomplish)
3. **Side effects** (writes to DB, network calls, file mutations, process spawning)

Then wait for user approval.

### Categories
| Category | Examples | Confirmation required? |
|---|---|---|
| Read-only inspection | `ls`, `cat`, `grep`, `sqlite3 ... .schema` | No |
| Tests and health checks | `pytest`, `check_services.sh` | Yes |
| Scrapers | `run_scraper_only.py` | Yes |
| AI processors | `run_processor.py` | Yes |
| Services | `app.py`, `local_admin.py` | Yes |
| Static API generation | `generate_static_api.py` | Yes |
| Git operations | `git add`, `git commit`, `git push` | Yes |
| Destructive operations | `rm`, `git reset --hard`, `DROP TABLE` | Yes — with explicit warning |

---

## 5. Diagnosis Rules

### General approach
- Start from `system-map.md` to locate the relevant subsystem.
- Read files in that subsystem to understand the issue.
- Do not scan the full codebase speculatively.

### Handling unknowns
`system-map.md` lists 10 explicit unknowns. Claude's policy:

- **Default:** Unknowns remain unknown. Do not investigate proactively.
- **Exception:** If an unknown is **directly blocking** an assigned task, Claude may investigate the unknown area by reading the relevant files.
- When investigating an unknown, Claude must:
  1. State which unknown is being resolved and why it's blocking.
  2. Report findings.
  3. Recommend whether `system-map.md` should be updated (but not update it directly — see Section 7).

### Diagnosis boundaries
- Do not propose fixes during diagnosis unless asked.
- Do not refactor code encountered during diagnosis.
- If diagnosis reveals issues outside the assigned task scope, report them but do not act on them.

---

## 6. File Creation Rules

Claude may create new files, but must **justify and confirm** before doing so.

### Required justification
Before creating any new file, Claude must state:
1. **What** file will be created (path and name)
2. **Why** it cannot be achieved by modifying an existing file
3. **Which subsystem** it belongs to

### Restrictions
- New files must fit within an existing subsystem boundary.
- Do not create new subsystems, modules, or architectural layers without explicit instruction.
- Do not create documentation files unless explicitly requested.
- Test files may be created alongside code changes if the task includes testing.

---

## 7. Frozen Artifacts

The following files must **not** be modified without explicit instruction:

| File | Reason |
|---|---|
| `system-map.md` | Canonical structural map. Frozen. Updates require explicit instruction and must be incremental. |
| `CLAUDE_RULES.md` | This governance file. Changes require explicit instruction. |
| `backend/sources.json` | 87 KB source definitions. High blast radius. |
| `api/*/categories.json` | Canonical data store. Must only be modified through the established pipeline (`generate_static_api.py`). |
| `backend/.env` | Contains API keys and credentials. |

---

## 8. Escalation Protocol

Claude must **stop and ask** when:

1. A task requires modifying files across two or more subsystems.
2. A task requires creating a new subsystem or architectural layer.
3. Diagnosis reveals a problem outside the assigned task scope.
4. An unknown from `system-map.md` must be investigated.
5. The requested change would alter data flow as documented in `system-map.md`.
6. The requested change would affect a frozen artifact.
7. The task is ambiguous — Claude should not guess intent.
8. Execution would trigger network calls to external APIs (Groq, Gemini, X/Twitter).

**When in doubt, ask. Never assume.**

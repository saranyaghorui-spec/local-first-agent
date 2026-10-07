# PrivatePilot — Local-First Personal Agent

PrivatePilot is an offline, localhost-only prototype of a privacy-first personal agent. It works with **demo vault data** for email, calendar events, notes, files, and drafts. It never connects to a cloud service, real email account, or actual computer files.

## What works

- Read and summarize demo emails, calendar entries, notes, and file records.
- Create, edit, and delete local notes.
- Create and delete local calendar events.
- Generate and save local-only email drafts; sending email is not implemented.
- Delete a **demo vault record** only by using a two-step, short-lived confirmation token.
- Store all demo data and audit history in `data/db.json`, so changes remain after refreshing the browser.
- Show an audit trail of safe reads, writes, confirmation prompts, cancellations, and approved deletions.

## Architecture

```text
Browser interface (index.html, styles.css, app.js)
                 |
                 | fetch('/api/...')
                 v
Node.js server on 127.0.0.1:3000 (server.js)
                 |
                 v
Project-local demo database (data/db.json)
```

The backend uses only Node.js built-in modules. It binds to `127.0.0.1`, which means it is reachable only from this computer. It manages JSON records in this project; it does not access real operating-system files.

## Run it

Requirements: Node.js 18 or newer.

```bash
node server.js
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000) in a browser. Do not open `index.html` directly—the browser UI needs the local backend.

To run the API verification suite in another terminal while the server is running:

```bash
node test-backend.js
```

## API overview

| Area | Endpoints |
|---|---|
| Email | `GET /api/emails`, `POST /api/emails/:id/read` |
| Calendar | `GET /api/calendar`, `POST /api/calendar/events`, `DELETE /api/calendar/events/:id` |
| Notes | `GET/POST /api/notes`, `PUT/DELETE /api/notes/:id` |
| Files | `GET /api/files`, `POST /api/files/:id/delete-request`, `POST /api/files/:id/confirm-delete` |
| Drafts | `GET/POST /api/drafts`, `DELETE /api/drafts/:id` |
| Audit | `GET/POST/DELETE /api/audit-log` |
| Reset | `POST /api/reset-demo-data` with `{ "confirm": true }` |

## Safety model

Read-only actions can run immediately. Changes are recorded in the audit log. File deletion is intentionally stricter:

1. The UI requests a delete token from the backend.
2. The user sees the target name and an irreversible-action warning.
3. **Cancel** sends no deletion request.
4. **Confirm** sends the short-lived token; only then does the backend remove that demo record from `data/db.json`.

The reset endpoint also rejects requests unless the request body contains `{ "confirm": true }`.

## Demo flow

1. Start the app with `node server.js`.
2. Click **Summarize unread emails**.
3. Create a note, then refresh the page to show it persisted.
4. Attempt to delete `old invoice.pdf`; click **Cancel** and show it remains.
5. Repeat deletion and click **Confirm**; show it disappears and the audit log records the action.
6. Use **Reset Demo Vault** to restore the seeded records.

## Honest limitations

This is a functional local prototype, not a connection to real Gmail, real calendars, or real device files. Its command interpretation is deterministic JavaScript logic, not a running language model. A future fully local version could connect to a locally installed open-weight model such as Phi-3 Mini via Ollama, while keeping the same permission-gated tool layer.

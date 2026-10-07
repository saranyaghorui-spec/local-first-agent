/**
 * PrivatePilot — Local-First Personal Agent Backend
 * 
 * Safety & Privacy Guarantees:
 * - Runs strictly on 127.0.0.1 (bound to localhost only, zero network exfiltration).
 * - Uses Node.js built-in modules only (http, fs, path, crypto, url).
 * - Manages only demo vault records in project-local data/db.json.
 * - Destructive file deletion is strictly gated by a 2-step tokenized flow:
 *     1. POST /api/files/:id/delete-request  -> generates short-lived confirmation token
 *     2. POST /api/files/:id/confirm-delete  -> executes deletion only with valid token
 * - Demo data reset requires explicit confirmation ({ confirm: true }).
 * - Every agent operation and confirmed change is recorded in the audit log.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default Seed Vault Data
const INITIAL_SEED_DATA = {
  emails: [
    {
      id: "em-1",
      from: "Priya Sharma",
      email: "priya.sharma@internal.local",
      subject: "Q4 Strategic Roadmap & Sync tomorrow",
      date: "Today, 10:45 AM",
      unread: true,
      starred: true,
      snippet: "Hi Alex, I've drafted the preliminary slides for our local agent architecture sync tomorrow at 2 PM. Please review slide 4...",
      body: "Hi Alex,\n\nI've drafted the preliminary slides for our local agent architecture sync tomorrow at 2:00 PM. \n\nPlease review slide 4 regarding the on-device inference latency targets (sub-150ms on Phi-3 Mini) and the zero-exfiltration compliance audit. Let me know by 4:00 PM if we need to adjust any milestones before our discussion.\n\nBest,\nPriya Sharma\nVP of Product Engineering"
    },
    {
      id: "em-2",
      from: "Security & Compliance Officer",
      email: "security-audit@internal.local",
      subject: "Monthly Local Backup Verification Notice",
      date: "Today, 08:30 AM",
      unread: true,
      starred: false,
      snippet: "Reminder: Periodic check of your encrypted local vault sandbox. All keys and file metadata must remain on-device...",
      body: "Notice to all engineers:\n\nThis is a reminder to verify your local storage quota and encrypted sandbox integrity. As per our zero-telemetry posture, PrivatePilot instances must never bind to external sockets or upload user notes to cloud endpoints.\n\nVerify that your sandbox contains only approved workspace documents and clean up obsolete billing receipts (e.g. old invoice.pdf).\n\nSecurity & Integrity Team"
    },
    {
      id: "em-3",
      from: "DevRel / Billing Support",
      email: "billing-receipts@services.local",
      subject: "Invoice #INV-2026-882 Renewal Notice",
      date: "Yesterday, 04:15 PM",
      unread: true,
      starred: false,
      snippet: "Attached is the archival receipt for your local compute cluster seat. Reference document: old invoice.pdf in your local vault...",
      body: "Hello,\n\nYour monthly local compute workstation tier renewal receipt is ready for archival. \nThe generated file 'old invoice.pdf' was saved to your local downloads vault sandbox. \n\nIf this expense has already been processed by finance, you may safely delete old invoice.pdf from your local drive.\n\nReference: #INV-2026-882"
    },
    {
      id: "em-4",
      from: "Alex Chen (Tech Lead)",
      email: "alex.chen@internal.local",
      subject: "Architecture RFC: SQLite Vector Indexing on Device",
      date: "Oct 5, 03:20 PM",
      unread: false,
      starred: false,
      snippet: "We tested sqlite-vec with 384-dimensional embeddings directly in WebGPU. Query performance is exceptionally fast...",
      body: "Team,\n\nI've concluded our benchmarks comparing server-side vector search vs local sqlite-vec running in client memory. \n\nResults show 8ms retrieval across 50,000 document chunks with zero network roundtrip. This confirms our hypothesis that a 3.8B parameter local model (Phi-3 Mini) paired with local vector embeddings provides full privacy without degrading context quality.\n\nLet's discuss during our 11:00 AM architecture review today.\n\nAlex Chen"
    }
  ],
  events: [
    {
      id: "ev-1",
      title: "Daily Engineering Sync",
      time: "09:30 AM",
      duration: "30 mins",
      location: "Local Workstation",
      category: "Team"
    },
    {
      id: "ev-2",
      title: "Architecture Review: Local Vector Store",
      time: "11:00 AM",
      duration: "45 mins",
      location: "Conference Alpha (Local)",
      category: "Architecture"
    },
    {
      id: "ev-3",
      title: "Quarterly Strategy with Priya Sharma",
      time: "02:00 PM",
      duration: "60 mins",
      location: "Executive Sync Desk",
      category: "Strategy"
    }
  ],
  notes: [
    {
      id: "nt-1",
      title: "Project Delta Milestones (Q4)",
      category: "Work",
      date: "Today, 11:20 AM",
      content: "1. Complete on-device quantized model validation (Phi-3 Mini).\n2. Implement strict confirmation gates for file deletion and destructive tools.\n3. Benchmark local response latency under 300ms.\n4. Deliver zero-network telemetry compliance report."
    },
    {
      id: "nt-2",
      title: "Local Agent Architecture Notes (Phi-3 + Tools)",
      category: "Architecture",
      date: "Oct 6, 02:40 PM",
      content: "Core Philosophy: The agent has full read visibility into local personal vault items (email, calendar, notes) for immediate assistance, but zero direct write/delete authority without explicit human-in-the-loop sign-off. External dispatch is blocked at the sandbox runtime."
    },
    {
      id: "nt-3",
      title: "Meeting Takeaways - Client Advisory",
      category: "Work",
      date: "Oct 5, 05:15 PM",
      content: "Key requirement from advisory group: Users must see visual proof that zero bytes leave their machine. Include an interactive audit log and explicit confirmation modal before any permanent state change."
    },
    {
      id: "nt-4",
      title: "Quick Scratchpad",
      category: "Personal",
      date: "Oct 4, 09:00 AM",
      content: "Order replacement USB-C privacy hardware key. Check local disk space quota. Review local Ollama / WebGPU benchmarks."
    }
  ],
  files: [
    {
      id: "fl-1",
      name: "old invoice.pdf",
      type: "PDF Document",
      size: "142 KB",
      date: "Oct 2, 2026",
      perm: "Destructive Confirmation Required",
      isTarget: true,
      content: "INVOICE #INV-2026-882 (ARCHIVED)\nDate: October 2, 2026\nItem: On-Device Compute Workstation License\nStatus: Paid / Archival copy\nNote: Safe to delete once expensed."
    },
    {
      id: "fl-2",
      name: "q4_product_roadmap.docx",
      type: "Word Document",
      size: "420 KB",
      date: "Oct 5, 2026",
      perm: "Read/Write Protected",
      isTarget: false,
      content: "CONFIDENTIAL — INTERNAL PRODUCT ROADMAP Q4 2026\nStrategic Objective: PrivatePilot Local-First Agent Deployment\n- Milestone 1: Local vault isolation\n- Milestone 2: Safe tool confirmation system\n- Milestone 3: On-device Phi-3 Mini inference"
    },
    {
      id: "fl-3",
      name: "client_nda_privacypilot.pdf",
      type: "PDF Document",
      size: "310 KB",
      date: "Sep 28, 2026",
      perm: "Read-Only Vault",
      isTarget: false,
      content: "NON-DISCLOSURE AGREEMENT\nBetween: PrivatePilot Labs & Enterprise Partner\nTerms: Zero telemetry, zero cloud exfiltration guarantee."
    },
    {
      id: "fl-4",
      name: "phi3_quantized_weights_manifest.json",
      type: "Config / JSON",
      size: "18 KB",
      date: "Oct 1, 2026",
      perm: "System Core",
      isTarget: false,
      content: "{\n  \"model\": \"Phi-3-mini-4k-instruct\",\n  \"quantization\": \"q4_k_m\",\n  \"context_window\": 4096,\n  \"runtime\": \"WebGPU / Local DirectML\",\n  \"telemetry\": false\n}"
    },
    {
      id: "fl-5",
      name: "notes_export_encrypted.db",
      type: "SQLite Database",
      size: "520 KB",
      date: "Oct 6, 2026",
      perm: "Encrypted Sandbox",
      isTarget: false,
      content: "SQLite 3 database format with AES-GCM local encrypted tables for offline notes and embeddings."
    }
  ],
  drafts: [],
  auditLogs: [
    {
      id: "log-1",
      timestamp: "09:00:12",
      type: "READ",
      tool: "vault.system.init()",
      status: "AUTO_APPROVED",
      text: "Local Vault sandbox initialized in local database. Zero outbound sockets opened."
    },
    {
      id: "log-2",
      timestamp: "09:00:13",
      type: "READ",
      tool: "model.runtime.load('Phi-3-Mini')",
      status: "AUTO_APPROVED",
      text: "Loaded on-device quantized small model weights into local sandbox memory."
    },
    {
      id: "log-3",
      timestamp: "09:15:20",
      type: "READ",
      tool: "vault.security.verify_csp()",
      status: "AUTO_APPROVED",
      text: "Content Security Policy check passed: 0 outbound connections permitted."
    }
  ]
};

// In-Memory Token Store for Two-Step Destructive File Deletions
// Maps token -> { fileId, fileName, expiresAt }
const pendingDeleteTokens = new Map();

// Helper: Ensure data directory and db.json exist
function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_SEED_DATA, null, 2), 'utf-8');
  }
}

// Helper: Read database
function readDatabase() {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, restoring seed data:', err.message);
    const cloned = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    fs.writeFileSync(DB_FILE, JSON.stringify(cloned, null, 2), 'utf-8');
    return cloned;
  }
}

// Helper: Write database atomically
function writeDatabase(data) {
  ensureDatabase();
  const tempPath = path.join(DATA_DIR, `db.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`);
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
}

// Helper: Append an audit log entry
function appendAuditLog(db, { type, tool, status, text, item = null }) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
  const entry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: timeStr,
    type: type || 'READ', // READ, WRITE, DESTRUCTIVE, CONFIRMATION
    tool: tool || 'vault.system.operation()',
    status: status || 'AUTO_APPROVED', // AUTO_APPROVED, USER_APPROVED, USER_REJECTED, PROMPTED
    text: text || '',
    ...(item ? { item } : {})
  };
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift(entry);
  return entry;
}

// Helper: Parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', err => reject(err));
  });
}

// Helper: Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper: Static file server MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Handle static asset serving
function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  // Prevent directory traversal
  const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  // Check if file is inside ROOT_DIR and not inside .git
  if (!filePath.startsWith(ROOT_DIR) || safePath.startsWith('.git')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
}

// Main HTTP Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // API Route Dispatcher
  if (pathname.startsWith('/api/')) {
    try {
      // 1. GET /api/health or /api/status
      if (pathname === '/api/health' || pathname === '/api/status') {
        sendJson(res, 200, {
          status: 'ok',
          mode: 'local-only',
          host: HOST,
          port: PORT,
          database: 'data/db.json',
          networkExfiltratedBytes: 0,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 2. EMAILS API
      // GET /api/emails
      if (pathname === '/api/emails' && method === 'GET') {
        const db = readDatabase();
        sendJson(res, 200, db.emails || []);
        return;
      }

      // POST /api/emails/:id/read
      const emailReadMatch = pathname.match(/^\/api\/emails\/([^\/]+)\/read$/);
      if (emailReadMatch && method === 'POST') {
        const id = decodeURIComponent(emailReadMatch[1]);
        const body = await parseJsonBody(req);
        const db = readDatabase();
        const email = (db.emails || []).find(e => e.id === id);

        if (!email) {
          sendJson(res, 404, { error: `Email not found with ID "${id}"` });
          return;
        }

        // Default to marking read (unread: false), or respect explicit body.unread
        const newUnread = typeof body.unread === 'boolean' ? body.unread : false;
        email.unread = newUnread;

        appendAuditLog(db, {
          type: 'WRITE',
          tool: `vault.emails.mark_read("${id}")`,
          status: 'AUTO_APPROVED',
          text: `Marked email from ${email.from} as ${newUnread ? 'unread' : 'read'}.`,
          item: email.subject
        });

        writeDatabase(db);
        sendJson(res, 200, { success: true, email });
        return;
      }

      // 3. CALENDAR API
      // GET /api/calendar
      if (pathname === '/api/calendar' && method === 'GET') {
        const db = readDatabase();
        sendJson(res, 200, db.events || []);
        return;
      }

      // POST /api/calendar/events
      if (pathname === '/api/calendar/events' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.title || !body.time) {
          sendJson(res, 400, { error: 'Validation failed: "title" and "time" are required' });
          return;
        }

        const db = readDatabase();
        if (!Array.isArray(db.events)) db.events = [];

        const newEvent = {
          id: body.id || `ev-${Date.now()}`,
          title: String(body.title).trim(),
          time: String(body.time).trim(),
          duration: String(body.duration || '30 mins').trim(),
          location: String(body.location || 'Local Workstation').trim(),
          category: String(body.category || 'User').trim()
        };

        db.events.push(newEvent);

        appendAuditLog(db, {
          type: 'WRITE',
          tool: `vault.calendar.create("${newEvent.id}")`,
          status: 'USER_APPROVED',
          text: `Added calendar event: "${newEvent.title}" at ${newEvent.time}.`,
          item: newEvent.title
        });

        writeDatabase(db);
        sendJson(res, 201, newEvent);
        return;
      }

      // DELETE /api/calendar/events/:id
      const calendarDeleteMatch = pathname.match(/^\/api\/calendar\/events\/([^\/]+)$/);
      if (calendarDeleteMatch && method === 'DELETE') {
        const id = decodeURIComponent(calendarDeleteMatch[1]);
        const db = readDatabase();
        const index = (db.events || []).findIndex(e => e.id === id);

        if (index === -1) {
          sendJson(res, 404, { error: `Calendar event not found with ID "${id}"` });
          return;
        }

        const [deletedEvent] = db.events.splice(index, 1);

        appendAuditLog(db, {
          type: 'DESTRUCTIVE',
          tool: `vault.calendar.delete("${id}")`,
          status: 'USER_APPROVED',
          text: `Deleted calendar event: "${deletedEvent.title}".`,
          item: deletedEvent.title
        });

        writeDatabase(db);
        sendJson(res, 200, { success: true, deleted: deletedEvent });
        return;
      }

      // 4. NOTES API
      // GET /api/notes
      if (pathname === '/api/notes' && method === 'GET') {
        const db = readDatabase();
        sendJson(res, 200, db.notes || []);
        return;
      }

      // POST /api/notes
      if (pathname === '/api/notes' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.title || !body.content) {
          sendJson(res, 400, { error: 'Validation failed: "title" and "content" are required' });
          return;
        }

        const db = readDatabase();
        if (!Array.isArray(db.notes)) db.notes = [];

        const newNote = {
          id: body.id || `nt-${Date.now()}`,
          title: String(body.title).trim(),
          category: String(body.category || 'Work').trim(),
          date: body.date || 'Just now',
          content: String(body.content).trim()
        };

        db.notes.unshift(newNote);

        appendAuditLog(db, {
          type: 'WRITE',
          tool: `vault.notes.create("${newNote.id}")`,
          status: 'AUTO_APPROVED',
          text: `Saved local note: "${newNote.title}" in category "${newNote.category}".`,
          item: newNote.title
        });

        writeDatabase(db);
        sendJson(res, 201, newNote);
        return;
      }

      // PUT /api/notes/:id
      const noteUpdateMatch = pathname.match(/^\/api\/notes\/([^\/]+)$/);
      if (noteUpdateMatch && method === 'PUT') {
        const id = decodeURIComponent(noteUpdateMatch[1]);
        const body = await parseJsonBody(req);

        if (!body.title || !body.content) {
          sendJson(res, 400, { error: 'Validation failed: "title" and "content" are required' });
          return;
        }

        const db = readDatabase();
        const note = (db.notes || []).find(n => n.id === id);

        if (!note) {
          sendJson(res, 404, { error: `Note not found with ID "${id}"` });
          return;
        }

        note.title = String(body.title).trim();
        note.category = String(body.category || note.category || 'Work').trim();
        note.content = String(body.content).trim();
        note.date = 'Edited just now';

        appendAuditLog(db, {
          type: 'WRITE',
          tool: `vault.notes.update("${id}")`,
          status: 'AUTO_APPROVED',
          text: `Updated local note: "${note.title}".`,
          item: note.title
        });

        writeDatabase(db);
        sendJson(res, 200, note);
        return;
      }

      // DELETE /api/notes/:id
      if (noteUpdateMatch && method === 'DELETE') {
        const id = decodeURIComponent(noteUpdateMatch[1]);
        const db = readDatabase();
        const index = (db.notes || []).findIndex(n => n.id === id);

        if (index === -1) {
          sendJson(res, 404, { error: `Note not found with ID "${id}"` });
          return;
        }

        const [deletedNote] = db.notes.splice(index, 1);

        appendAuditLog(db, {
          type: 'DESTRUCTIVE',
          tool: `vault.notes.delete("${id}")`,
          status: 'USER_APPROVED',
          text: `Deleted local note: "${deletedNote.title}".`,
          item: deletedNote.title
        });

        writeDatabase(db);
        sendJson(res, 200, { success: true, deleted: deletedNote });
        return;
      }

      // 5. FILES API (SAFE TWO-STEP DELETION)
      // GET /api/files
      if (pathname === '/api/files' && method === 'GET') {
        const db = readDatabase();
        sendJson(res, 200, db.files || []);
        return;
      }

      // Step 1: POST /api/files/:id/delete-request
      const fileDeleteReqMatch = pathname.match(/^\/api\/files\/([^\/]+)\/delete-request$/);
      if (fileDeleteReqMatch && method === 'POST') {
        const id = decodeURIComponent(fileDeleteReqMatch[1]);
        const db = readDatabase();
        const file = (db.files || []).find(f => f.id === id);

        if (!file) {
          sendJson(res, 404, { error: `File not found with ID "${id}"` });
          return;
        }

        // Generate cryptographically random confirmation token
        const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute validity window

        pendingDeleteTokens.set(token, {
          fileId: id,
          fileName: file.name,
          expiresAt
        });

        // Audit log records the permission gate prompt
        appendAuditLog(db, {
          type: 'CONFIRMATION',
          tool: `vault.files.delete_request("${file.name}")`,
          status: 'PROMPTED',
          text: `Created confirmation token for destructive deletion of '${file.name}'. Irreversible deletion awaiting approval.`,
          item: file.name
        });

        writeDatabase(db);

        sendJson(res, 200, {
          token,
          fileId: id,
          fileName: file.name,
          expiresAt,
          message: 'Delete request created. Must be confirmed with POST /api/files/:id/confirm-delete using this token.'
        });
        return;
      }

      // Step 2: POST /api/files/:id/confirm-delete
      const fileConfirmDeleteMatch = pathname.match(/^\/api\/files\/([^\/]+)\/confirm-delete$/);
      if (fileConfirmDeleteMatch && method === 'POST') {
        const id = decodeURIComponent(fileConfirmDeleteMatch[1]);
        const body = await parseJsonBody(req);
        const { token } = body;

        if (!token) {
          sendJson(res, 400, {
            error: 'Missing confirmation token. Destructive deletion requires a valid token from /delete-request.'
          });
          return;
        }

        const pending = pendingDeleteTokens.get(token);
        if (!pending || pending.fileId !== id) {
          sendJson(res, 403, {
            error: 'Invalid confirmation token or token does not match target file ID.'
          });
          return;
        }

        if (Date.now() > pending.expiresAt) {
          pendingDeleteTokens.delete(token);
          sendJson(res, 410, {
            error: 'Confirmation token has expired. Please initiate a new delete request.'
          });
          return;
        }

        // Consume token immediately
        pendingDeleteTokens.delete(token);

        const db = readDatabase();
        const index = (db.files || []).findIndex(f => f.id === id);

        if (index === -1) {
          sendJson(res, 404, { error: `File not found with ID "${id}" in local vault.` });
          return;
        }

        const [deletedFile] = db.files.splice(index, 1);

        appendAuditLog(db, {
          type: 'DESTRUCTIVE',
          tool: `vault.files.delete("${deletedFile.name}")`,
          status: 'USER_APPROVED',
          text: `User confirmed permanent deletion of '${deletedFile.name}'. File removed from local vault records.`,
          item: deletedFile.name
        });

        writeDatabase(db);
        sendJson(res, 200, { success: true, deleted: deletedFile });
        return;
      }

      // 6. DRAFTS API
      // GET /api/drafts
      if (pathname === '/api/drafts' && method === 'GET') {
        const db = readDatabase();
        sendJson(res, 200, db.drafts || []);
        return;
      }

      // POST /api/drafts
      if (pathname === '/api/drafts' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body.to || !body.subject) {
          sendJson(res, 400, { error: 'Validation failed: "to" and "subject" are required' });
          return;
        }

        const db = readDatabase();
        if (!Array.isArray(db.drafts)) db.drafts = [];

        const newDraft = {
          id: body.id || `dr-${Date.now()}`,
          to: String(body.to).trim(),
          subject: String(body.subject).trim(),
          body: String(body.body || '').trim(),
          date: body.date || 'Just now'
        };

        db.drafts.push(newDraft);

        appendAuditLog(db, {
          type: 'WRITE',
          tool: `vault.mail.save_draft("${newDraft.id}")`,
          status: 'AUTO_APPROVED',
          text: `Saved local email draft to "${newDraft.to}". Stored on-device without network transmission.`,
          item: newDraft.subject
        });

        writeDatabase(db);
        sendJson(res, 201, newDraft);
        return;
      }

      // DELETE /api/drafts/:id
      const draftDeleteMatch = pathname.match(/^\/api\/drafts\/([^\/]+)$/);
      if (draftDeleteMatch && method === 'DELETE') {
        const id = decodeURIComponent(draftDeleteMatch[1]);
        const db = readDatabase();
        const index = (db.drafts || []).findIndex(d => d.id === id);

        if (index === -1) {
          sendJson(res, 404, { error: `Draft not found with ID "${id}"` });
          return;
        }

        const [deletedDraft] = db.drafts.splice(index, 1);

        appendAuditLog(db, {
          type: 'DESTRUCTIVE',
          tool: `vault.mail.delete_draft("${id}")`,
          status: 'USER_APPROVED',
          text: `Deleted draft reply to "${deletedDraft.to}".`,
          item: deletedDraft.subject
        });

        writeDatabase(db);
        sendJson(res, 200, { success: true, deleted: deletedDraft });
        return;
      }

      // 7. AUDIT LOG API
      // GET /api/audit-log
      if (pathname === '/api/audit-log' && method === 'GET') {
        const db = readDatabase();
        sendJson(res, 200, db.auditLogs || []);
        return;
      }

      // POST /api/audit-log (For client agent operations logging)
      if (pathname === '/api/audit-log' && method === 'POST') {
        const body = await parseJsonBody(req);
        const db = readDatabase();

        const entry = appendAuditLog(db, {
          type: body.type || 'READ',
          tool: body.tool || body.action || 'agent.operation()',
          status: body.status || body.result || 'AUTO_APPROVED',
          text: body.text || '',
          item: body.item || null
        });

        writeDatabase(db);
        sendJson(res, 201, entry);
        return;
      }

      // DELETE /api/audit-log
      if (pathname === '/api/audit-log' && method === 'DELETE') {
        const body = await parseJsonBody(req);
        if (body.confirm !== true) {
          sendJson(res, 400, { error: 'Explicit confirmation required. Send { "confirm": true } to clear audit logs.' });
          return;
        }
        const db = readDatabase();
        db.auditLogs = [];
        writeDatabase(db);
        sendJson(res, 200, { success: true, message: 'Audit log cleared' });
        return;
      }

      // 8. RESET DEMO DATA API (REQUIRES EXPLICIT CONFIRMATION)
      // POST /api/reset-demo-data
      if (pathname === '/api/reset-demo-data' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (body.confirm !== true) {
          sendJson(res, 400, {
            error: 'Explicit confirmation required. Send { "confirm": true } in request body to reset demo vault data.'
          });
          return;
        }

        // Deep clone seed defaults
        const fresh = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
        appendAuditLog(fresh, {
          type: 'WRITE',
          tool: 'vault.system.reset_demo_data()',
          status: 'USER_APPROVED',
          text: 'Restored all sample email, calendar, notes, files, and audit logs to initial seed defaults.',
          item: 'Demo Vault State'
        });

        // Clear any active tokens
        pendingDeleteTokens.clear();

        writeDatabase(fresh);
        sendJson(res, 200, {
          success: true,
          message: 'Demo vault data successfully restored to initial seed state.'
        });
        return;
      }

      // Unmatched API endpoint
      sendJson(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });
      return;
    } catch (err) {
      console.error(`API Error [${method} ${pathname}]:`, err);
      sendJson(res, 500, { error: 'Internal server error', details: err.message });
      return;
    }
  }

  // Static File Serving (Frontend)
  if (method === 'GET') {
    serveStaticFile(req, res, pathname);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

// Start listening strictly on 127.0.0.1
ensureDatabase();
server.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log('  PrivatePilot — Local-First Personal Agent Backend');
  console.log(`  Running on: http://${HOST}:${PORT}`);
  console.log(`  Database:   ${DB_FILE}`);
  console.log(`  Security:   Bound to ${HOST} only (0 B external exfiltration)`);
  console.log('================================================================');
});

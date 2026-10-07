/**
 * PrivatePilot — Local-First Personal Agent
 * Core Architecture & UI Controller
 * 
 * Safe Tool-Use Policy:
 * - Read-only actions (email scanning, calendar listing, note search) run immediately.
 * - Destructive or state-altering actions (file deletion, event creation) require explicit confirmation.
 * - External dispatch is disabled by policy (replies are stored as local drafts).
 * - All data is stored exclusively in client-side localStorage.
 */

// ==========================================
// 1. DEFAULT SEED DATA
// ==========================================
const SEED_DATA = {
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
      body: `Hi Alex,

I've drafted the preliminary slides for our local agent architecture sync tomorrow at 2:00 PM. 

Please review slide 4 regarding the on-device inference latency targets (sub-150ms on Phi-3 Mini) and the zero-exfiltration compliance audit. Let me know by 4:00 PM if we need to adjust any milestones before our discussion.

Best,
Priya Sharma
VP of Product Engineering`
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
      body: `Notice to all engineers:

This is a reminder to verify your local storage quota and encrypted sandbox integrity. As per our zero-telemetry posture, PrivatePilot instances must never bind to external sockets or upload user notes to cloud endpoints.

Verify that your sandbox contains only approved workspace documents and clean up obsolete billing receipts (e.g. old invoice.pdf).

Security & Integrity Team`
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
      body: `Hello,

Your monthly local compute workstation tier renewal receipt is ready for archival. 
The generated file 'old invoice.pdf' was saved to your local downloads vault sandbox. 

If this expense has already been processed by finance, you may safely delete old invoice.pdf from your local drive.

Reference: #INV-2026-882`
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
      body: `Team,

I've concluded our benchmarks comparing server-side vector search vs local sqlite-vec running in client memory. 

Results show 8ms retrieval across 50,000 document chunks with zero network roundtrip. This confirms our hypothesis that a 3.8B parameter local model (Phi-3 Mini) paired with local vector embeddings provides full privacy without degrading context quality.

Let's discuss during our 11:00 AM architecture review today.

Alex Chen`
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

  auditLogs: [
    {
      id: "log-1",
      timestamp: "09:00:12",
      type: "READ",
      tool: "vault.system.init()",
      status: "AUTO_APPROVED",
      text: "Local Vault sandbox initialized in browser storage. Zero outbound sockets opened."
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
  ],

  drafts: []
};

// ==========================================
// 2. STATE & STORAGE MANAGEMENT
// ==========================================
class VaultStorage {
  static STORAGE_KEY = "privatepilot_vault_data_v1";

  static load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Could not read localStorage, falling back to seed data", e);
    }
    // Deep clone default seed data
    const initial = JSON.parse(JSON.stringify(SEED_DATA));
    this.save(initial);
    return initial;
  }

  static save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }

  static reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.load();
  }
}

// Global Application State
let appState = VaultStorage.load();

// Selected email for reading view
let selectedEmailId = appState.emails[0]?.id || null;
let currentEmailFilter = "all";
let currentNotesFilter = "all";

// Pending Confirmation Callback Resolver
let pendingDestructiveAction = null;

// ==========================================
// 3. AUDIT LOGGING SYSTEM
// ==========================================
function logAuditEvent(type, tool, status, text) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

  const entry = {
    id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    timestamp: timeStr,
    type: type, // 'READ', 'WRITE', 'DESTRUCTIVE', 'CONFIRMATION'
    tool: tool,
    status: status, // 'AUTO_APPROVED', 'USER_APPROVED', 'USER_REJECTED', 'PROMPTED'
    text: text
  };

  appState.auditLogs.unshift(entry);
  VaultStorage.save(appState);

  renderAuditWidgets();
  return entry;
}

// ==========================================
// 4. TOAST NOTIFICATION UTILITY
// ==========================================
function showToast(message, type = "info", duration = 3500) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === "danger") {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
  } else if (type === "warning") {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
  } else {
    iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
  }

  toast.innerHTML = `
    <span style="display:flex; flex-shrink:0;">${iconSvg}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// ==========================================
// 5. VIEW & BADGE SYNCHRONIZATION
// ==========================================
function updateBadgesAndCounters() {
  const unreadCount = appState.emails.filter(e => e.unread).length;
  const eventsCount = appState.events.length;
  const notesCount = appState.notes.length;
  const filesCount = appState.files.length;

  // Sidebar badges
  const emailBadge = document.getElementById("sidebar-email-badge");
  if (emailBadge) {
    emailBadge.textContent = unreadCount;
    emailBadge.style.display = unreadCount > 0 ? "inline-block" : "none";
  }

  const calBadge = document.getElementById("sidebar-cal-badge");
  if (calBadge) calBadge.textContent = eventsCount;

  const notesBadge = document.getElementById("sidebar-notes-badge");
  if (notesBadge) notesBadge.textContent = notesCount;

  const filesBadge = document.getElementById("sidebar-files-badge");
  if (filesBadge) filesBadge.textContent = filesCount;

  // Dashboard cards
  const dashEmailCount = document.getElementById("dash-email-count");
  if (dashEmailCount) dashEmailCount.textContent = appState.emails.length;

  const dashUnreadBadge = document.getElementById("dash-unread-badge");
  if (dashUnreadBadge) dashUnreadBadge.textContent = `${unreadCount} unread`;

  const dashCalCount = document.getElementById("dash-cal-count");
  if (dashCalCount) dashCalCount.textContent = eventsCount;

  const dashNotesCount = document.getElementById("dash-notes-count");
  if (dashNotesCount) dashNotesCount.textContent = notesCount;

  const dashFilesCount = document.getElementById("dash-files-count");
  if (dashFilesCount) dashFilesCount.textContent = filesCount;

  // Next event subtitle
  const dashCalSub = document.getElementById("dash-cal-sub");
  if (dashCalSub) {
    const nextEv = appState.events[0];
    dashCalSub.textContent = nextEv ? `Next: ${nextEv.time} ${nextEv.title}` : "No more events today";
  }

  // Files quota calculation
  const filesQuotaText = document.getElementById("files-quota-text");
  if (filesQuotaText) {
    const totalKb = appState.files.reduce((acc, f) => {
      const num = parseInt(f.size) || 50;
      return acc + num;
    }, 0);
    const mb = (totalKb / 1024).toFixed(2);
    filesQuotaText.textContent = `${mb} MB / 50 MB (${((mb / 50) * 100).toFixed(1)}%)`;
  }
}

// ==========================================
// 6. RENDERERS FOR APPLICATION PAGES
// ==========================================

// --- Email Page Rendering ---
function renderEmailList() {
  const container = document.getElementById("email-items-container");
  if (!container) return;

  let filtered = appState.emails;
  if (currentEmailFilter === "unread") {
    filtered = appState.emails.filter(e => e.unread);
  } else if (currentEmailFilter === "starred") {
    filtered = appState.emails.filter(e => e.starred);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 32px 16px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
        No emails found in this category.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(mail => `
    <div class="email-item ${mail.unread ? 'unread' : ''} ${mail.id === selectedEmailId ? 'active' : ''}" data-email-id="${mail.id}">
      <div class="email-item-header">
        <span class="email-from">${escapeHtml(mail.from)}</span>
        <span class="email-date">${escapeHtml(mail.date)}</span>
      </div>
      <div class="email-subject">${escapeHtml(mail.subject)}</div>
      <div class="email-snippet">${escapeHtml(mail.snippet)}</div>
    </div>
  `).join('');

  // Attach click listener
  container.querySelectorAll(".email-item").forEach(item => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-email-id");
      selectedEmailId = id;
      // Mark as read when clicked
      const email = appState.emails.find(e => e.id === id);
      if (email && email.unread) {
        email.unread = false;
        VaultStorage.save(appState);
        updateBadgesAndCounters();
        logAuditEvent("WRITE", `vault.emails.mark_read("${id}")`, "AUTO_APPROVED", `Marked email from ${email.from} as read.`);
      }
      renderEmailList();
      renderEmailDetail();
    });
  });
}

function renderEmailDetail() {
  const container = document.getElementById("email-detail-container");
  if (!container) return;

  const email = appState.emails.find(e => e.id === selectedEmailId) || appState.emails[0];
  if (!email) {
    container.innerHTML = `<div style="color: var(--text-dim); text-align: center; margin-top: 40px;">Select an email to view.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="email-reading-header">
      <h2 class="email-reading-title">${escapeHtml(email.subject)}</h2>
      <div class="email-meta-details">
        <div class="sender-profile">
          <div class="sender-avatar">${escapeHtml(email.from.charAt(0))}</div>
          <div>
            <div class="sender-name">${escapeHtml(email.from)}</div>
            <div class="sender-email-addr">${escapeHtml(email.email)} • ${escapeHtml(email.date)}</div>
          </div>
        </div>
        <div class="email-action-bar">
          <button class="btn btn-outline-sm" id="btn-toggle-read-status">
            ${email.unread ? 'Mark as Read' : 'Mark as Unread'}
          </button>
          <button class="btn btn-primary" id="btn-reply-email-pane">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Draft Reply with Phi-3
          </button>
        </div>
      </div>
    </div>

    <div class="email-body-content">${escapeHtml(email.body)}</div>

    <div class="email-footer-sandbox-note">
      <span>🔒 Local Vault Sandbox • Zero external routing</span>
      <span>Sender verified in local contacts</span>
    </div>
  `;

  // Attach inner buttons
  const btnToggleRead = document.getElementById("btn-toggle-read-status");
  if (btnToggleRead) {
    btnToggleRead.addEventListener("click", () => {
      email.unread = !email.unread;
      VaultStorage.save(appState);
      updateBadgesAndCounters();
      renderEmailList();
      renderEmailDetail();
      showToast(email.unread ? "Marked as unread" : "Marked as read", "info");
    });
  }

  const btnReply = document.getElementById("btn-reply-email-pane");
  if (btnReply) {
    btnReply.addEventListener("click", () => {
      openDraftModalForEmail(email);
    });
  }
}

// --- Calendar Page Rendering ---
function renderCalendarTimeline() {
  const container = document.getElementById("calendar-events-container");
  if (!container) return;

  if (appState.events.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: var(--text-dim); font-size: 0.9rem;">
        No events scheduled for today. Click "Add Local Event" to schedule.
      </div>
    `;
    return;
  }

  container.innerHTML = appState.events.map(ev => `
    <div class="timeline-event-card">
      <div class="event-time-col">
        <span class="event-time">${escapeHtml(ev.time)}</span>
        <span class="event-duration">${escapeHtml(ev.duration || '30 mins')}</span>
      </div>
      <div class="event-main-col">
        <h4 class="event-title">${escapeHtml(ev.title)}</h4>
        <div class="event-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${escapeHtml(ev.location || 'Local Workspace')}</span>
        </div>
      </div>
      <div class="event-actions-col">
        <button class="btn btn-outline-xs btn-delete-event" data-event-id="${ev.id}" title="Delete event (Destructive)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Remove
        </button>
      </div>
    </div>
  `).join('');

  // Event delete buttons trigger confirmation modal
  container.querySelectorAll(".btn-delete-event").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-event-id");
      const ev = appState.events.find(item => item.id === id);
      if (!ev) return;

      openDestructiveConfirmationModal({
        title: "Confirm Event Removal",
        filename: `Calendar Event: "${ev.title}" (${ev.time})`,
        toolSignature: `vault.calendar.delete("${ev.id}")`,
        onConfirm: () => {
          appState.events = appState.events.filter(item => item.id !== id);
          VaultStorage.save(appState);
          updateBadgesAndCounters();
          renderCalendarTimeline();
          logAuditEvent("DESTRUCTIVE", `vault.calendar.delete("${id}")`, "USER_APPROVED", `Deleted calendar event: "${ev.title}".`);
          showToast(`Removed event: "${ev.title}"`, "success");
        },
        onCancel: () => {
          logAuditEvent("CONFIRMATION", `vault.calendar.delete("${id}")`, "USER_REJECTED", `User cancelled removal of event "${ev.title}".`);
        }
      });
    });
  });
}

// --- Notes Page Rendering ---
function renderNotesGrid() {
  const container = document.getElementById("notes-grid-container");
  if (!container) return;

  const searchVal = (document.getElementById("notes-search-input")?.value || "").toLowerCase().trim();

  let filtered = appState.notes;
  if (currentNotesFilter !== "all") {
    filtered = filtered.filter(n => n.category.toLowerCase() === currentNotesFilter.toLowerCase());
  }

  if (searchVal) {
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(searchVal) ||
      n.content.toLowerCase().includes(searchVal) ||
      n.category.toLowerCase().includes(searchVal)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-dim); font-size: 0.9rem;">
        No notes found matching your criteria.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(note => `
    <div class="note-card" data-note-id="${note.id}">
      <div class="note-card-header">
        <span class="note-cat-tag">${escapeHtml(note.category)}</span>
        <span class="note-date">${escapeHtml(note.date)}</span>
      </div>
      <h3 class="note-title">${escapeHtml(note.title)}</h3>
      <div class="note-preview">${escapeHtml(note.content)}</div>
      <div class="note-card-actions">
        <button class="btn btn-outline-xs btn-edit-note" data-note-id="${note.id}">Edit</button>
        <button class="btn btn-outline-xs btn-delete-note" data-note-id="${note.id}" style="color: #f87171;">Delete</button>
      </div>
    </div>
  `).join('');

  // Attach card edit / delete listeners
  container.querySelectorAll(".btn-edit-note").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-note-id");
      const note = appState.notes.find(n => n.id === id);
      if (note) openNoteEditorModal(note);
    });
  });

  container.querySelectorAll(".btn-delete-note").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-note-id");
      const note = appState.notes.find(n => n.id === id);
      if (!note) return;

      openDestructiveConfirmationModal({
        title: "Confirm Note Deletion",
        filename: `Note: "${note.title}"`,
        toolSignature: `vault.notes.delete("${note.id}")`,
        onConfirm: () => {
          appState.notes = appState.notes.filter(n => n.id !== id);
          VaultStorage.save(appState);
          updateBadgesAndCounters();
          renderNotesGrid();
          logAuditEvent("DESTRUCTIVE", `vault.notes.delete("${id}")`, "USER_APPROVED", `Deleted local note: "${note.title}".`);
          showToast(`Deleted note: "${note.title}"`, "success");
        },
        onCancel: () => {
          logAuditEvent("CONFIRMATION", `vault.notes.delete("${id}")`, "USER_REJECTED", `User cancelled deletion of note "${note.title}".`);
        }
      });
    });
  });

  // Clicking anywhere on card opens edit
  container.querySelectorAll(".note-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const id = card.getAttribute("data-note-id");
      const note = appState.notes.find(n => n.id === id);
      if (note) openNoteEditorModal(note);
    });
  });
}

// --- Files Page Rendering ---
function renderFilesTable() {
  const tbody = document.getElementById("files-table-body");
  if (!tbody) return;

  if (appState.files.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 36px; color: var(--text-dim);">
          No files currently stored in local vault.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = appState.files.map(file => `
    <tr>
      <td>
        <div class="file-name-cell ${file.name === 'old invoice.pdf' ? 'target-danger-file' : ''}">
          <span class="file-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </span>
          <span>${escapeHtml(file.name)}</span>
        </div>
      </td>
      <td>${escapeHtml(file.type)}</td>
      <td style="font-family: var(--font-mono);">${escapeHtml(file.size)}</td>
      <td>${escapeHtml(file.date)}</td>
      <td>
        <span class="perm-pill ${file.isTarget ? 'strict' : 'normal'}">
          ${escapeHtml(file.perm)}
        </span>
      </td>
      <td style="text-align: right;">
        <div style="display: inline-flex; gap: 8px;">
          <button class="btn btn-outline-xs btn-preview-file" data-file-id="${file.id}">Preview</button>
          <button class="btn btn-outline-xs btn-delete-file-row" data-file-id="${file.id}" style="color: #f87171;" title="Delete file (Confirmation required)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach preview listeners
  tbody.querySelectorAll(".btn-preview-file").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-file-id");
      const file = appState.files.find(f => f.id === id);
      if (file) openFilePreviewModal(file);
    });
  });

  // Attach delete buttons with safety modal
  tbody.querySelectorAll(".btn-delete-file-row").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-file-id");
      const file = appState.files.find(f => f.id === id);
      if (file) triggerFileDeletionSafetyFlow(file);
    });
  });
}

// --- Audit Widgets Rendering ---
function renderAuditWidgets() {
  // 1. Dashboard Mini Feed (Last 4)
  const dashContainer = document.getElementById("dash-audit-list");
  if (dashContainer) {
    const recents = appState.auditLogs.slice(0, 5);
    if (recents.length === 0) {
      dashContainer.innerHTML = `<div style="color: var(--text-dim); font-size: 0.75rem; padding: 10px;">No audit events yet.</div>`;
    } else {
      dashContainer.innerHTML = recents.map(log => `
        <div class="audit-mini-item type-${log.type}">
          <div class="mini-item-meta">
            <span class="mini-time">${escapeHtml(log.timestamp)}</span>
            <span class="mini-tag ${getAuditTagClass(log.type)}">${log.type}</span>
          </div>
          <div class="mini-desc">${escapeHtml(log.text)}</div>
        </div>
      `).join('');
    }
  }

  // 2. Full Audit Log Tab
  const fullContainer = document.getElementById("full-audit-container");
  if (fullContainer) {
    const filterSelect = document.getElementById("audit-filter-select");
    const filterVal = filterSelect ? filterSelect.value : "all";

    let filtered = appState.auditLogs;
    if (filterVal !== "all") {
      filtered = filtered.filter(l => l.type === filterVal);
    }

    if (filtered.length === 0) {
      fullContainer.innerHTML = `
        <div style="text-align: center; padding: 36px; color: var(--text-dim); font-size: 0.85rem;">
          No audit entries matching filter "${escapeHtml(filterVal)}".
        </div>
      `;
    } else {
      fullContainer.innerHTML = filtered.map(log => `
        <div class="audit-entry-card">
          <span class="audit-type-badge ${log.type}">${log.type}</span>
          <div class="audit-details-col">
            <div class="audit-time-row">
              <span class="audit-time-str">${escapeHtml(log.timestamp)}</span>
              <span class="audit-rule-status">${escapeHtml(log.status)}</span>
            </div>
            <div class="audit-main-text">${escapeHtml(log.text)}</div>
            ${log.tool ? `<div class="audit-tool-code"><code>${escapeHtml(log.tool)}</code></div>` : ''}
          </div>
        </div>
      `).join('');
    }
  }
}

function getAuditTagClass(type) {
  if (type === "READ") return "read";
  if (type === "WRITE") return "write";
  if (type === "DESTRUCTIVE") return "destructive";
  return "prompt";
}

// ==========================================
// 7. SAFE TOOL DESTRUCTION CONFIRMATION MODAL
// ==========================================
function openDestructiveConfirmationModal({ title, filename, toolSignature, onConfirm, onCancel }) {
  const modal = document.getElementById("modal-confirm-delete");
  const modalTitle = document.getElementById("modal-delete-title");
  const targetEl = document.getElementById("delete-target-filename");
  const targetBold = document.getElementById("delete-target-name-bold");

  if (!modal) return;

  if (modalTitle) modalTitle.textContent = title || "Confirm Destructive Action";
  if (targetEl) targetEl.textContent = filename || "selected item";
  if (targetBold) targetBold.textContent = filename || "selected item";

  logAuditEvent("CONFIRMATION", toolSignature || "vault.destructive_op()", "PROMPTED", `Asked confirmation before executing destructive action on "${filename}".`);

  pendingDestructiveAction = {
    onConfirm: () => {
      if (typeof onConfirm === "function") onConfirm();
      closeModal("modal-confirm-delete");
    },
    onCancel: () => {
      if (typeof onCancel === "function") onCancel();
      closeModal("modal-confirm-delete");
    }
  };

  openModal("modal-confirm-delete");
}

function triggerFileDeletionSafetyFlow(file) {
  openDestructiveConfirmationModal({
    title: "Confirm Destructive File Deletion",
    filename: file.name,
    toolSignature: `vault.files.delete("${file.name}")`,
    onConfirm: () => {
      // Execute deletion
      appState.files = appState.files.filter(f => f.id !== file.id);
      VaultStorage.save(appState);
      updateBadgesAndCounters();
      renderFilesTable();

      logAuditEvent(
        "DESTRUCTIVE",
        `vault.files.delete("${file.name}")`,
        "USER_APPROVED",
        `User confirmed permanent deletion of '${file.name}'. File removed from local storage.`
      );

      appendAgentMessage(`
        <p>✅ <strong>Destructive Action Completed:</strong></p>
        <p>File <code>${escapeHtml(file.name)}</code> was permanently purged from the local sandbox vault as requested.</p>
        <div class="tool-callout">
          <div class="tool-callout-header">
            <span>Audit Entry</span>
            <span class="tool-status-tag status-destructive">DESTRUCTIVE CONFIRMED</span>
          </div>
          <span class="tool-signature danger">vault.files.delete("${escapeHtml(file.name)}") &rarr; SUCCESS (0 B REMAINING)</span>
        </div>
      `);

      showToast(`Deleted "${file.name}"`, "danger");
    },
    onCancel: () => {
      logAuditEvent(
        "CONFIRMATION",
        `vault.files.delete("${file.name}")`,
        "USER_REJECTED",
        `User refused permission to delete '${file.name}'. File remains untouched.`
      );

      appendAgentMessage(`
        <p>🛑 <strong>Action Aborted:</strong> You declined permission to delete <code>${escapeHtml(file.name)}</code>. No changes were made to your local files.</p>
      `);

      showToast(`Cancelled deletion of "${file.name}"`, "info");
    }
  });
}

// ==========================================
// 8. DRAFT REPLY MODAL (LOCAL ONLY)
// ==========================================
function openDraftModalForEmail(email) {
  const modal = document.getElementById("modal-draft-reply");
  const draftTo = document.getElementById("draft-to");
  const draftSubject = document.getElementById("draft-subject");
  const draftBody = document.getElementById("draft-body");

  if (!modal) return;

  if (draftTo) draftTo.value = `${email.from} <${email.email}>`;
  if (draftSubject) draftSubject.value = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;

  // Smart local draft generation based on email content
  let proposedReply = "";
  if (email.from.includes("Priya")) {
    proposedReply = `Hi Priya,\n\nThanks for following up on the Q4 roadmap. I have reviewed the preliminary milestones and confirmed that all local-first agent deliverables align with our target timeline.\n\nI will have the updated architecture diagram ready for our sync at 2:00 PM today. Let me know if you need any additional prep points before we meet.\n\nBest regards,\nAlex`;
  } else if (email.from.includes("Security")) {
    proposedReply = `Hi Compliance Team,\n\nI have verified our local vault configuration. Zero network telemetry is enabled, and all on-device sandbox quotas have been verified. Obsolete invoice artifacts have been queued for deletion.\n\nThanks,\nAlex`;
  } else {
    proposedReply = `Hello,\n\nThank you for the notification. I have saved this item to my local vault records and verified all details on-device.\n\nBest,\nAlex`;
  }

  if (draftBody) draftBody.value = proposedReply;

  logAuditEvent("READ", `vault.mail.generate_draft("${email.id}")`, "AUTO_APPROVED", `Generated safe local draft reply for ${email.from}. External dispatch disabled.`);

  openModal("modal-draft-reply");
}

function handleSaveDraft() {
  const to = document.getElementById("draft-to")?.value || "Unknown";
  const subject = document.getElementById("draft-subject")?.value || "Draft";
  const body = document.getElementById("draft-body")?.value || "";

  const newDraft = {
    id: "dr-" + Date.now(),
    to: to,
    subject: subject,
    body: body,
    date: "Just now"
  };

  appState.drafts.push(newDraft);
  VaultStorage.save(appState);

  logAuditEvent("WRITE", `vault.mail.save_draft("${newDraft.id}")`, "AUTO_APPROVED", `Saved local email draft to "${to}". Stored on-device without transmission.`);

  closeModal("modal-draft-reply");
  showToast("Draft saved safely to local vault", "success");

  appendAgentMessage(`
    <p>📝 <strong>Local Draft Saved:</strong></p>
    <p>Your response to <strong>${escapeHtml(to)}</strong> has been saved in your browser's local drafts vault.</p>
    <div class="tool-callout">
      <div class="tool-callout-header">
        <span>Tool Output</span>
        <span class="tool-status-tag status-immediate">LOCAL VAULT SAVED</span>
      </div>
      <span class="tool-signature">vault.mail.save_draft(id="${newDraft.id}") &rarr; OK (0 Bytes Exfiltrated)</span>
    </div>
  `);
}

function handleDiscardDraft() {
  logAuditEvent("CONFIRMATION", "vault.mail.discard_draft()", "USER_APPROVED", "User discarded local email draft.");
  closeModal("modal-draft-reply");
  showToast("Draft discarded", "info");
}

// ==========================================
// 9. NOTE EDITOR MODAL
// ==========================================
function openNoteEditorModal(note = null) {
  const modal = document.getElementById("modal-note-editor");
  const modalTitle = document.getElementById("modal-note-title");
  const idInput = document.getElementById("note-edit-id");
  const titleInput = document.getElementById("note-title-input");
  const catInput = document.getElementById("note-category-select");
  const contentInput = document.getElementById("note-content-input");

  if (!modal) return;

  if (note) {
    if (modalTitle) modalTitle.textContent = "Edit Local Note";
    if (idInput) idInput.value = note.id;
    if (titleInput) titleInput.value = note.title;
    if (catInput) catInput.value = note.category;
    if (contentInput) contentInput.value = note.content;
  } else {
    if (modalTitle) modalTitle.textContent = "Create New Local Note";
    if (idInput) idInput.value = "";
    if (titleInput) titleInput.value = "";
    if (catInput) catInput.value = "Work";
    if (contentInput) contentInput.value = "";
  }

  openModal("modal-note-editor");
}

function handleSaveNote(e) {
  if (e) e.preventDefault();

  const id = document.getElementById("note-edit-id")?.value;
  const title = document.getElementById("note-title-input")?.value.trim();
  const category = document.getElementById("note-category-select")?.value || "Work";
  const content = document.getElementById("note-content-input")?.value.trim();

  if (!title || !content) {
    showToast("Please provide both a title and content", "warning");
    return;
  }

  if (id) {
    // Edit existing
    const existing = appState.notes.find(n => n.id === id);
    if (existing) {
      existing.title = title;
      existing.category = category;
      existing.content = content;
      existing.date = "Edited just now";
      logAuditEvent("WRITE", `vault.notes.update("${id}")`, "AUTO_APPROVED", `Updated local note: "${title}".`);
    }
  } else {
    // Create new
    const newNote = {
      id: "nt-" + Date.now(),
      title: title,
      category: category,
      date: "Just now",
      content: content
    };
    appState.notes.unshift(newNote);
    logAuditEvent("WRITE", `vault.notes.create("${newNote.id}")`, "AUTO_APPROVED", `Saved local note: "${title}".`);
  }

  VaultStorage.save(appState);
  updateBadgesAndCounters();
  renderNotesGrid();
  closeModal("modal-note-editor");
  showToast("Note saved to local vault", "success");
}

// ==========================================
// 10. CALENDAR EVENT MODAL (WITH CONFIRMATION)
// ==========================================
function openAddEventModal() {
  const titleInput = document.getElementById("event-title-input");
  const timeInput = document.getElementById("event-time-input");
  if (titleInput) titleInput.value = "";
  if (timeInput) timeInput.value = "03:30 PM";
  openModal("modal-add-event");
}

function handleSaveCalendarEvent(e) {
  if (e) e.preventDefault();

  const title = document.getElementById("event-title-input")?.value.trim();
  const time = document.getElementById("event-time-input")?.value.trim();
  const duration = document.getElementById("event-duration-input")?.value.trim() || "30 mins";
  const location = document.getElementById("event-location-input")?.value.trim() || "Local Workstation";

  if (!title || !time) {
    showToast("Please fill in event title and time", "warning");
    return;
  }

  const newEvent = {
    id: "ev-" + Date.now(),
    title: title,
    time: time,
    duration: duration,
    location: location,
    category: "User"
  };

  appState.events.push(newEvent);
  VaultStorage.save(appState);
  updateBadgesAndCounters();
  renderCalendarTimeline();

  logAuditEvent("WRITE", `vault.calendar.create("${newEvent.id}")`, "USER_APPROVED", `User confirmed and added calendar event: "${title}" at ${time}.`);

  closeModal("modal-add-event");
  showToast(`Event added: "${title}"`, "success");

  appendAgentMessage(`
    <p>📅 <strong>Calendar Updated:</strong></p>
    <p>Added <strong>${escapeHtml(title)}</strong> at <strong>${escapeHtml(time)}</strong> to your local on-device schedule.</p>
    <div class="tool-callout">
      <div class="tool-callout-header">
        <span>Tool Execution</span>
        <span class="tool-status-tag status-immediate">COMMITTED</span>
      </div>
      <span class="tool-signature">vault.calendar.create(time="${escapeHtml(time)}", title="${escapeHtml(title)}")</span>
    </div>
  `);
}

// ==========================================
// 11. FILE PREVIEW MODAL
// ==========================================
function openFilePreviewModal(file) {
  const modal = document.getElementById("modal-file-preview");
  const title = document.getElementById("modal-preview-title");
  const sub = document.getElementById("modal-preview-sub");
  const body = document.getElementById("modal-preview-body");
  const deleteBtn = document.getElementById("modal-preview-btn-delete");

  if (!modal) return;

  if (title) title.textContent = file.name;
  if (sub) sub.textContent = `${file.type} • ${file.size} • Stored on-device`;
  if (body) body.textContent = file.content;

  logAuditEvent("READ", `vault.files.preview("${file.name}")`, "AUTO_APPROVED", `Inspected file contents of '${file.name}' in sandbox preview.`);

  if (deleteBtn) {
    deleteBtn.onclick = () => {
      closeModal("modal-file-preview");
      triggerFileDeletionSafetyFlow(file);
    };
  }

  openModal("modal-file-preview");
}

// Modal Helper Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// ==========================================
// 12. CHAT & COMMAND EXECUTION ENGINE
// ==========================================

function appendUserMessage(text) {
  const chatStream = document.getElementById("chat-stream");
  if (!chatStream) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const msg = document.createElement("div");
  msg.className = "chat-message message-user";
  msg.innerHTML = `
    <div class="msg-avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>
    <div class="msg-content">
      <div class="msg-meta">
        <span class="msg-author">You</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg-body">
        <p>${escapeHtml(text)}</p>
      </div>
    </div>
  `;

  chatStream.appendChild(msg);
  chatStream.scrollTop = chatStream.scrollHeight;
}

function appendAgentMessage(htmlContent) {
  const chatStream = document.getElementById("chat-stream");
  if (!chatStream) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const msg = document.createElement("div");
  msg.className = "chat-message message-agent";
  msg.innerHTML = `
    <div class="msg-avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><rect width="18" height="12" x="3" y="10" rx="4"/></svg>
    </div>
    <div class="msg-content">
      <div class="msg-meta">
        <span class="msg-author">PrivatePilot (Phi-3 Mini Local)</span>
        <span class="msg-time">${timeStr}</span>
        <span class="msg-safety-tag">On-Device Sandbox</span>
      </div>
      <div class="msg-body">
        ${htmlContent}
      </div>
    </div>
  `;

  chatStream.appendChild(msg);
  chatStream.scrollTop = chatStream.scrollHeight;
}

function showThinkingBubble() {
  const chatStream = document.getElementById("chat-stream");
  if (!chatStream) return null;

  const thinking = document.createElement("div");
  thinking.className = "chat-message message-agent";
  thinking.id = "agent-thinking-indicator";
  thinking.innerHTML = `
    <div class="msg-avatar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><rect width="18" height="12" x="3" y="10" rx="4"/></svg>
    </div>
    <div class="thinking-bubble">
      <span class="pulse-spinner"></span>
      <span>On-device inference (Phi-3 Mini) running locally...</span>
    </div>
  `;
  chatStream.appendChild(thinking);
  chatStream.scrollTop = chatStream.scrollHeight;
  return thinking;
}

function removeThinkingBubble() {
  const indicator = document.getElementById("agent-thinking-indicator");
  if (indicator) indicator.remove();
}

/**
 * Main Command Interpreter
 * Recognizes the 5 required suggested prompts as well as arbitrary user commands
 */
function processAgentCommand(rawInput) {
  const input = rawInput.trim();
  if (!input) return;

  appendUserMessage(input);

  const thinkingEl = showThinkingBubble();

  // Simulate local model processing delay (300ms)
  setTimeout(() => {
    removeThinkingBubble();
    dispatchCommand(input);
  }, 320);
}

function dispatchCommand(cmd) {
  const lower = cmd.toLowerCase();

  // 1. "Summarize unread emails"
  if (lower.includes("summarize") && lower.includes("email")) {
    handleSummarizeEmailsCommand();
    return;
  }

  // 2. "What is on my calendar today?" or "calendar"
  if (lower.includes("calendar") || lower.includes("schedule") || lower.includes("agenda")) {
    handleCalendarQueryCommand();
    return;
  }

  // 3. "Create a note: submit project by 3:30 PM"
  if (lower.startsWith("create a note:") || lower.startsWith("create note:") || lower.includes("submit project by 3:30 pm")) {
    handleCreateNoteCommand(cmd);
    return;
  }

  // 4. "Delete old invoice.pdf"
  if (lower.includes("delete") && lower.includes("invoice")) {
    handleDeleteInvoiceCommand();
    return;
  }

  // 5. "Draft a reply to Priya"
  if (lower.includes("draft") && (lower.includes("priya") || lower.includes("reply"))) {
    handleDraftReplyToPriyaCommand();
    return;
  }

  // Generic / Fallback local agent capabilities
  handleGenericCommand(cmd);
}

// --- Specific Command Implementations ---

// Action 1: Summarize unread emails
function handleSummarizeEmailsCommand() {
  const unreadMails = appState.emails.filter(e => e.unread);

  logAuditEvent("READ", "vault.emails.get_unread()", "AUTO_APPROVED", `Read ${unreadMails.length} local unread emails. Read-only operation executed immediately.`);

  if (unreadMails.length === 0) {
    appendAgentMessage(`
      <p>📬 <strong>Email Summary:</strong> You have no unread emails in your local vault.</p>
      <p>All items have been reviewed.</p>
    `);
    return;
  }

  let summaryBullets = unreadMails.map(m => {
    let actionable = "";
    if (m.from.includes("Priya")) {
      actionable = "<strong>Action required:</strong> Review slide 4 latency targets before 4 PM sync.";
    } else if (m.from.includes("Security")) {
      actionable = "<strong>Action required:</strong> Routine audit recommendation; suggests purging old invoice files.";
    } else if (m.from.includes("Billing")) {
      actionable = "<strong>Notice:</strong> Renewal receipt processed. Mentions <code>old invoice.pdf</code> is ready to delete.";
    }
    return `<li><strong>${escapeHtml(m.from)}</strong> — <em>${escapeHtml(m.subject)}</em><br><span style="font-size: 0.8rem; color: var(--text-secondary);">${actionable}</span></li>`;
  }).join('');

  appendAgentMessage(`
    <p>📬 <strong>Inbox Summary (3 Unread Local Emails):</strong></p>
    <ul class="clean-bullet-list">
      ${summaryBullets}
    </ul>
    <div class="tool-callout">
      <div class="tool-callout-header">
        <span>Tool Signature</span>
        <span class="tool-status-tag status-immediate">READ-ONLY (SAFE)</span>
      </div>
      <span class="tool-signature">vault.emails.read(status="unread") &rarr; 3 items parsed</span>
    </div>
    <p>💡 <em>Quick actions:</em> You can click <strong>"Draft a reply to Priya"</strong> or <strong>"Delete old invoice.pdf"</strong> above.</p>
  `);
}

// Action 2: What is on my calendar today?
function handleCalendarQueryCommand() {
  logAuditEvent("READ", "vault.calendar.get_today()", "AUTO_APPROVED", `Listed ${appState.events.length} local calendar events for today.`);

  if (appState.events.length === 0) {
    appendAgentMessage(`
      <p>📅 <strong>Schedule for Today:</strong> Your calendar is completely free. No events scheduled.</p>
    `);
    return;
  }

  const eventList = appState.events.map(ev => `
    <li><strong style="color: var(--accent-blue);">${escapeHtml(ev.time)}</strong>: ${escapeHtml(ev.title)} <span style="color: var(--text-dim); font-size: 0.78rem;">(${escapeHtml(ev.location)})</span></li>
  `).join('');

  appendAgentMessage(`
    <p>📅 <strong>Today's On-Device Schedule (Wednesday, Oct 7):</strong></p>
    <ul class="clean-bullet-list">
      ${eventList}
    </ul>
    <div class="tool-callout">
      <div class="tool-callout-header">
        <span>Tool Signature</span>
        <span class="tool-status-tag status-immediate">READ-ONLY (SAFE)</span>
      </div>
      <span class="tool-signature">vault.calendar.list(date="today") &rarr; ${appState.events.length} events returned</span>
    </div>
    <p>Your next commitment is at <strong>${escapeHtml(appState.events[0]?.time || '')}</strong>.</p>
  `);
}

// Action 3: Create a note: submit project by 3:30 PM
function handleCreateNoteCommand(cmd) {
  let noteTitle = "Submit project by 3:30 PM";
  if (cmd.includes(":")) {
    noteTitle = cmd.substring(cmd.indexOf(":") + 1).trim();
  }

  const newNote = {
    id: "nt-" + Date.now(),
    title: noteTitle,
    category: "Tasks",
    date: "Just now",
    content: `Action item recorded by PrivatePilot agent:\nDeadline: 3:30 PM today.\nTask: ${noteTitle}\nStored in on-device encrypted vault.`
  };

  appState.notes.unshift(newNote);
  VaultStorage.save(appState);
  updateBadgesAndCounters();
  renderNotesGrid();

  logAuditEvent("WRITE", `vault.notes.create("${newNote.id}")`, "AUTO_APPROVED", `Saved local note: '${noteTitle}' in category 'Tasks'.`);

  showToast(`Created note: "${noteTitle}"`, "success");

  appendAgentMessage(`
    <p>📝 <strong>Local Note Created:</strong></p>
    <p>I have recorded the note in your personal tasks vault:</p>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 10px 14px; margin: 8px 0;">
      <div style="font-weight: 700; color: #ffffff;">${escapeHtml(newNote.title)}</div>
      <div style="font-size: 0.75rem; color: var(--accent-amber); margin-top: 2px;">Category: Tasks • Saved to localStorage</div>
    </div>
    <div class="tool-callout">
      <div class="tool-callout-header">
        <span>Tool Signature</span>
        <span class="tool-status-tag status-immediate">LOCAL WRITE COMMITTED</span>
      </div>
      <span class="tool-signature">vault.notes.create({ title: "${escapeHtml(newNote.title)}", category: "Tasks" })</span>
    </div>
  `);
}

// Action 4: Delete old invoice.pdf
function handleDeleteInvoiceCommand() {
  const targetFile = appState.files.find(f => f.name.toLowerCase().includes("invoice"));

  if (!targetFile) {
    appendAgentMessage(`
      <p>⚠️ <strong>File Not Found:</strong> <code>old invoice.pdf</code> was already deleted or is not present in the local vault.</p>
    `);
    return;
  }

  appendAgentMessage(`
    <p>⚠️ <strong>Permission Gate Triggered:</strong></p>
    <p>You requested to delete <code>${escapeHtml(targetFile.name)}</code>. Under PrivatePilot safety policies, file deletion is a <strong>destructive action</strong> that cannot be executed silently.</p>
    <p>Opening authorization modal for your confirmation...</p>
    <div class="tool-callout">
      <div class="tool-callout-header">
        <span>Policy Check</span>
        <span class="tool-status-tag status-prompted">CONFIRMATION REQUIRED</span>
      </div>
      <span class="tool-signature danger">vault.files.delete("${escapeHtml(targetFile.name)}") &rarr; PAUSED AWAITING APPROVAL</span>
    </div>
  `);

  // Launch the required confirmation modal
  triggerFileDeletionSafetyFlow(targetFile);
}

// Action 5: Draft a reply to Priya
function handleDraftReplyToPriyaCommand() {
  const priyaEmail = appState.emails.find(e => e.from.includes("Priya")) || appState.emails[0];

  appendAgentMessage(`
    <p>✍️ <strong>Drafting Local Response:</strong></p>
    <p>I have prepared a draft reply to <strong>Priya Sharma</strong> based on her email regarding the Q4 Strategic Roadmap.</p>
    <p><strong>Reminder:</strong> As a strict local-first agent, <em>I will never transmit this email externally</em>. The draft modal allows you to inspect and save the draft locally in your vault.</p>
  `);

  openDraftModalForEmail(priyaEmail);
}

// Generic Assistant Handler
function handleGenericCommand(cmd) {
  const lower = cmd.toLowerCase();

  if (lower.includes("privacy") || lower.includes("policy") || lower.includes("audit")) {
    appendAgentMessage(`
      <p>🛡️ <strong>PrivatePilot Security Architecture:</strong></p>
      <ul class="clean-bullet-list">
        <li><strong>Zero Exfiltration:</strong> 0 network requests are made. All operations run in client-side memory.</li>
        <li><strong>On-Device Model:</strong> Simulating quantized Phi-3 Mini running locally.</li>
        <li><strong>Tool Confirmation:</strong> Read-only operations proceed immediately; file deletions and external transmissions are gated by human confirmation.</li>
      </ul>
      <p>Inspect the full event log under the <strong>Privacy & Audit</strong> tab.</p>
    `);
  } else if (lower.includes("help") || lower.includes("who are you") || lower.includes("what can you do")) {
    appendAgentMessage(`
      <p>I am <strong>PrivatePilot</strong>, your on-device personal agent powered by an open-weight small model architecture.</p>
      <p>Try these safe tool demonstrations:</p>
      <ul class="clean-bullet-list">
        <li><strong>"Summarize unread emails"</strong> (Read-only tool)</li>
        <li><strong>"What is on my calendar today?"</strong> (Read-only tool)</li>
        <li><strong>"Create a note: submit project by 3:30 PM"</strong> (Local write tool)</li>
        <li><strong>"Delete old invoice.pdf"</strong> (Destructive tool &rarr; Confirmation required)</li>
        <li><strong>"Draft a reply to Priya"</strong> (Local draft modal &rarr; No network transmission)</li>
      </ul>
    `);
  } else if (lower.includes("clear") && lower.includes("chat")) {
    clearChatStream();
  } else {
    appendAgentMessage(`
      <p>Understood. Executing local reasoning on prompt: <em>"${escapeHtml(cmd)}"</em></p>
      <p>As an on-device personal agent, I've scanned your local workspace context. If you'd like me to query your emails, inspect your schedule, create a note, or manage vault files, choose one of the suggested actions above or specify a target task.</p>
    `);
  }
}

function clearChatStream() {
  const chatStream = document.getElementById("chat-stream");
  if (!chatStream) return;

  chatStream.innerHTML = `
    <div class="chat-message message-agent">
      <div class="msg-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><rect width="18" height="12" x="3" y="10" rx="4"/></svg>
      </div>
      <div class="msg-content">
        <div class="msg-meta">
          <span class="msg-author">PrivatePilot (Phi-3 Mini Local)</span>
          <span class="msg-time">Just now</span>
          <span class="msg-safety-tag">On-Device Sandbox</span>
        </div>
        <div class="msg-body">
          <p>Conversation stream cleared. PrivatePilot is ready for on-device commands.</p>
        </div>
      </div>
    </div>
  `;
  showToast("Chat cleared", "info");
}

// Utility: HTML escaping
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// 13. NAVIGATION ROUTER
// ==========================================
function switchTab(tabId) {
  // Update sidebar active buttons
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });

  // Update tab panes
  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === `tab-${tabId}`);
  });

  // Update header title based on active tab
  const titleEl = document.getElementById("page-title");
  const subEl = document.getElementById("page-tagline");

  const tabTitles = {
    dashboard: { title: "Personal Agent Hub", sub: "On-Device Privacy Engine" },
    email: { title: "Local Email Vault", sub: "4 Simulated Seed Messages • No Cloud Sync" },
    calendar: { title: "Local Calendar Timetable", sub: "Today's Agenda • Safe Write Gating" },
    notes: { title: "Encrypted Local Notes", sub: "Browser-Only Storage • Full CRUD" },
    files: { title: "Mock Vault Files", sub: "Sandbox Directory • Irreversible Delete Gating" },
    privacy: { title: "Privacy & Tool Audit", sub: "Zero Telemetry • Complete Action Transparency" }
  };

  if (tabTitles[tabId]) {
    if (titleEl) titleEl.textContent = tabTitles[tabId].title;
    if (subEl) subEl.textContent = tabTitles[tabId].sub;
  }

  // Refresh tab specific rendering
  if (tabId === "email") {
    renderEmailList();
    renderEmailDetail();
  } else if (tabId === "calendar") {
    renderCalendarTimeline();
  } else if (tabId === "notes") {
    renderNotesGrid();
  } else if (tabId === "files") {
    renderFilesTable();
  } else if (tabId === "privacy") {
    renderAuditWidgets();
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("mobile-open");

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 14. EVENT LISTENERS INITIALIZATION
// ==========================================
function initializeApp() {
  // 1. Navigation clicks
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // 2. Dashboard card jumps
  document.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", () => {
      const targetTab = el.getAttribute("data-goto");
      switchTab(targetTab);
    });
  });

  // 3. Command form submit
  const commandForm = document.getElementById("command-form");
  const commandInput = document.getElementById("command-input");
  if (commandForm && commandInput) {
    commandForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = commandInput.value;
      commandInput.value = "";
      processAgentCommand(val);
    });
  }

  // 4. Suggested command chip buttons
  document.querySelectorAll(".command-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const cmd = chip.getAttribute("data-cmd");
      if (cmd) processAgentCommand(cmd);
    });
  });

  // 5. Clear chat button
  const btnClearChat = document.getElementById("btn-clear-chat");
  if (btnClearChat) {
    btnClearChat.addEventListener("click", clearChatStream);
  }

  // 6. Reset Vault button
  const btnResetVault = document.getElementById("btn-reset-vault");
  if (btnResetVault) {
    btnResetVault.addEventListener("click", () => {
      if (confirm("Reset demo vault to initial state? This resets email, calendar, notes, files, and audit logs to original defaults.")) {
        appState = VaultStorage.reset();
        updateBadgesAndCounters();
        renderEmailList();
        renderEmailDetail();
        renderCalendarTimeline();
        renderNotesGrid();
        renderFilesTable();
        renderAuditWidgets();
        showToast("Demo local vault restored to default", "success");
        appendAgentMessage(`<p>🔄 <strong>Vault Reset:</strong> All sample email, calendar, notes, and files have been restored to their initial seeded demo state.</p>`);
      }
    });
  }

  // 7. Email tab actions
  const btnSumEmails = document.getElementById("btn-summarize-emails-action");
  if (btnSumEmails) {
    btnSumEmails.addEventListener("click", () => {
      switchTab("dashboard");
      processAgentCommand("Summarize unread emails");
    });
  }

  const btnQuickDraft = document.getElementById("btn-quick-draft-action");
  if (btnQuickDraft) {
    btnQuickDraft.addEventListener("click", () => {
      const priya = appState.emails.find(e => e.from.includes("Priya")) || appState.emails[0];
      openDraftModalForEmail(priya);
    });
  }

  document.querySelectorAll("[data-email-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-email-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentEmailFilter = btn.getAttribute("data-email-filter");
      renderEmailList();
    });
  });

  // 8. Calendar tab actions
  const btnAddEvModal = document.getElementById("btn-add-event-modal");
  if (btnAddEvModal) btnAddEvModal.addEventListener("click", openAddEventModal);

  const btnAskCalAgent = document.getElementById("btn-ask-cal-agent");
  if (btnAskCalAgent) {
    btnAskCalAgent.addEventListener("click", () => {
      switchTab("dashboard");
      processAgentCommand("What is on my calendar today?");
    });
  }

  const btnShortcutReview = document.getElementById("btn-shortcut-add-review");
  if (btnShortcutReview) {
    btnShortcutReview.addEventListener("click", () => {
      const titleInput = document.getElementById("event-title-input");
      const timeInput = document.getElementById("event-time-input");
      if (titleInput) titleInput.value = "1-on-1 Prep";
      if (timeInput) timeInput.value = "01:15 PM";
      openModal("modal-add-event");
    });
  }

  const formAddEvent = document.getElementById("add-event-form");
  if (formAddEvent) {
    formAddEvent.addEventListener("submit", handleSaveCalendarEvent);
  }
  const btnSaveEventModal = document.getElementById("modal-event-btn-save");
  if (btnSaveEventModal) {
    btnSaveEventModal.addEventListener("click", handleSaveCalendarEvent);
  }
  const btnCancelEventModal = document.getElementById("modal-event-btn-cancel");
  if (btnCancelEventModal) {
    btnCancelEventModal.addEventListener("click", () => closeModal("modal-add-event"));
  }
  const btnCloseEventX = document.getElementById("modal-event-close");
  if (btnCloseEventX) {
    btnCloseEventX.addEventListener("click", () => closeModal("modal-add-event"));
  }

  // 9. Notes tab actions
  const btnCreateNote = document.getElementById("btn-create-note-modal");
  if (btnCreateNote) btnCreateNote.addEventListener("click", () => openNoteEditorModal());

  const notesSearchInput = document.getElementById("notes-search-input");
  if (notesSearchInput) {
    notesSearchInput.addEventListener("input", renderNotesGrid);
  }

  document.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-cat]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentNotesFilter = btn.getAttribute("data-cat");
      renderNotesGrid();
    });
  });

  const formNoteEditor = document.getElementById("note-editor-form");
  if (formNoteEditor) {
    formNoteEditor.addEventListener("submit", handleSaveNote);
  }
  const btnSaveNoteModal = document.getElementById("modal-note-btn-save");
  if (btnSaveNoteModal) {
    btnSaveNoteModal.addEventListener("click", handleSaveNote);
  }
  const btnCancelNoteModal = document.getElementById("modal-note-btn-cancel");
  if (btnCancelNoteModal) {
    btnCancelNoteModal.addEventListener("click", () => closeModal("modal-note-editor"));
  }
  const btnCloseNoteX = document.getElementById("modal-note-close");
  if (btnCloseNoteX) {
    btnCloseNoteX.addEventListener("click", () => closeModal("modal-note-editor"));
  }

  // 10. Files tab actions
  const btnTriggerDeleteInvoice = document.getElementById("btn-trigger-delete-invoice");
  if (btnTriggerDeleteInvoice) {
    btnTriggerDeleteInvoice.addEventListener("click", handleDeleteInvoiceCommand);
  }

  const btnPreviewClose = document.getElementById("modal-preview-btn-close");
  if (btnPreviewClose) btnPreviewClose.addEventListener("click", () => closeModal("modal-file-preview"));
  const btnPreviewX = document.getElementById("modal-preview-close");
  if (btnPreviewX) btnPreviewX.addEventListener("click", () => closeModal("modal-file-preview"));

  // 11. Destructive Confirmation Modal Listeners
  const btnConfirmDelete = document.getElementById("modal-delete-btn-confirm");
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener("click", () => {
      if (pendingDestructiveAction && pendingDestructiveAction.onConfirm) {
        pendingDestructiveAction.onConfirm();
      }
    });
  }

  const btnCancelDelete = document.getElementById("modal-delete-btn-cancel");
  if (btnCancelDelete) {
    btnCancelDelete.addEventListener("click", () => {
      if (pendingDestructiveAction && pendingDestructiveAction.onCancel) {
        pendingDestructiveAction.onCancel();
      }
    });
  }

  const btnCloseDeleteX = document.getElementById("modal-delete-close");
  if (btnCloseDeleteX) {
    btnCloseDeleteX.addEventListener("click", () => {
      if (pendingDestructiveAction && pendingDestructiveAction.onCancel) {
        pendingDestructiveAction.onCancel();
      }
    });
  }

  // 12. Draft Reply Modal Listeners
  const btnSaveDraft = document.getElementById("modal-draft-btn-save");
  if (btnSaveDraft) btnSaveDraft.addEventListener("click", handleSaveDraft);

  const btnDiscardDraft = document.getElementById("modal-draft-btn-discard");
  if (btnDiscardDraft) btnDiscardDraft.addEventListener("click", handleDiscardDraft);

  const btnCloseDraftX = document.getElementById("modal-draft-close");
  if (btnCloseDraftX) btnCloseDraftX.addEventListener("click", handleDiscardDraft);

  // 13. Privacy / Audit tab controls
  const auditFilterSelect = document.getElementById("audit-filter-select");
  if (auditFilterSelect) {
    auditFilterSelect.addEventListener("change", renderAuditWidgets);
  }

  const btnClearAudit = document.getElementById("btn-clear-audit");
  if (btnClearAudit) {
    btnClearAudit.addEventListener("click", () => {
      if (confirm("Clear local audit history?")) {
        appState.auditLogs = [];
        VaultStorage.save(appState);
        renderAuditWidgets();
        showToast("Audit trail cleared", "info");
      }
    });
  }

  const btnExportAudit = document.getElementById("btn-export-audit");
  if (btnExportAudit) {
    btnExportAudit.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.auditLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `privatepilot_audit_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Exported audit JSON log", "success");
    });
  }

  // 14. Mobile menu toggle
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("mobile-open");
    });
  }

  // 15. Backdrop click to close modals
  document.querySelectorAll(".modal-backdrop").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        if (modal.id === "modal-confirm-delete") {
          if (pendingDestructiveAction && pendingDestructiveAction.onCancel) {
            pendingDestructiveAction.onCancel();
          }
        } else {
          closeModal(modal.id);
        }
      }
    });
  });

  // 16. Escape key closes modals safely
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeModal = document.querySelector(".modal-backdrop.active");
      if (activeModal) {
        if (activeModal.id === "modal-confirm-delete") {
          if (pendingDestructiveAction && pendingDestructiveAction.onCancel) {
            pendingDestructiveAction.onCancel();
          }
        } else {
          closeModal(activeModal.id);
        }
      }
    }
  });

  // Initial UI Render
  updateBadgesAndCounters();
  renderEmailList();
  renderEmailDetail();
  renderCalendarTimeline();
  renderNotesGrid();
  renderFilesTable();
  renderAuditWidgets();
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);

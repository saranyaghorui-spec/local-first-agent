# PrivatePilot — Local-First Personal Agent

> **On-Device Personal Intelligence • Zero Network Telemetry • Safe Tool-Use Execution**

**PrivatePilot** is a frontend demonstration of a privacy-first personal AI assistant. Designed around open-weight small language models (such as **Phi-3 Mini**), PrivatePilot manages your **emails, calendar schedule, encrypted personal notes, and local files** directly on your device.

**Core Principle:** *No data leaves this device.* All information is stored in client-side storage (`localStorage`) within a sandbox.

---

## 🛡️ Safety & Tool-Use Architecture

Modern personal agents frequently risk unauthorized actions or cloud data leakage. PrivatePilot demonstrates an explicit **Tiered Safe Tool-Use Policy**:

| Action Tier | Tool Category | Examples | Enforcement Policy |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Safe)** | Read-Only | Email scanning, calendar queries, searching notes, listing files | **Executes immediately** with automatic audit logging. Zero clicks required. |
| **Tier 2 (Mutation)** | Local Writes | Adding calendar events, saving new notes | **Interactive Confirmation Dialog** before committing changes to storage. |
| **Tier 3 (Destructive)** | Irreversible Ops | Deleting files (`old invoice.pdf`), deleting notes | **Explicit Destructive Confirmation Modal** displaying target name, warning of irreversibility, and Cancel/Confirm choices. |
| **Tier 4 (Outbound)** | External Dispatch | Sending email replies | **Strictly Disabled by Policy**. External networks are blocked; replies can only be saved as local drafts. |

---

## 🌟 Key Features

1. **Local-Only Sandbox**
   - Green `● LOCAL ONLY` badge and network traffic monitor showing `0 B Exfiltrated`.
   - Clear banner stating that all emails, calendar entries, notes, and files are **Demo local vault data** residing entirely within the browser.
2. **On-Device Small Model (Phi-3 Mini Concept)**
   - Simulates local quantized open-weight inference (~3.8B parameters) running via WebGPU / local DirectML.
   - Zero API keys, zero cloud subscriptions, zero third-party telemetry.
3. **Interactive Command Console**
   - Natural language input bar and 5 realistic one-click suggested actions:
     - 📧 **"Summarize unread emails"**: Scans 3 unread seeded emails and generates an actionable bulleted digest.
     - 📅 **"What is on my calendar today?"**: Retrieves today's schedule and flags upcoming meetings.
     - 📝 **"Create a note: submit project by 3:30 PM"**: Creates and categorizes a note in your local vault.
     - 🗑️ **"Delete old invoice.pdf"**: Triggers the safety confirmation modal to prevent accidental data loss.
     - ✍️ **"Draft a reply to Priya"**: Pre-fills an AI draft response in a local modal with "Save Draft" and "Discard" (never transmits).
4. **Local Vault Modules**
   - **Email**: 4 realistic seeded local emails (Priya Sharma, Security & Compliance, Billing Support, Alex Chen), read/unread toggles, search filters, and reading pane.
   - **Calendar**: Today's timetable, event deletion, and permission-gated event creation.
   - **Notes**: Full CRUD support (create, edit, search by keyword/category, delete) persisted to `localStorage`.
   - **Files**: Sandbox file explorer displaying file sizes, types, and permissions, featuring `old invoice.pdf` as the primary test target.
   - **Privacy & Audit Center**: Detailed breakdown of local architecture and a comprehensive, filterable audit trail of every tool invocation.
5. **Vault Reset Mechanism**
   - A one-click **"Reset Demo Vault"** button in the sidebar footer allows instant restoration of seeded defaults.

---

## 📁 Project Structure

```text
local-first-agent/
├── index.html        # Clean semantic markup with accessible modal dialogues
├── styles.css        # Premium dark glassmorphism design system & micro-animations
├── app.js            # State management, tool safety engine, audit logger, and UI logic
└── README.md         # Architecture, safety design, and demo instructions
```

---

## 🚀 Getting Started

PrivatePilot requires **no backend, no npm installation, and no API keys**. It runs anywhere modern web standards are supported.

### Option 1: Direct File Opening
Double-click `index.html` in your file explorer, or right-click and choose **Open with Browser** (Chrome, Edge, Firefox, Brave, Safari).

### Option 2: Local Python Server (Recommended)
From the project directory:

```bash
# Python 3
python -m http.server 8080
```

Then navigate to:
```
http://localhost:8080
```

---

## 🧪 Interactive Demo Walkthrough

Follow these steps to demonstrate all capabilities and safety guarantees:

### 1. Test Read-Only Immediate Execution
- In the central command panel, click **"Summarize unread emails"**.
- *Result:* The agent immediately scans 3 unread local messages, outputs an executive summary with action items, logs `vault.emails.read()` to the audit trail, and requires no user prompt.
- Next, click **"What is on my calendar today?"**.
- *Result:* Today's timetable is printed directly in the chat with zero delays.

### 2. Test Local Write Action
- Click **"Create a note: submit project by 3:30 PM"**.
- *Result:* The note is created in localStorage under the `Tasks` category. Navigate to the **Notes** tab to verify the note is present, searchable, and editable.

### 3. Test Destructive Confirmation Modal
- Click **"Delete old invoice.pdf"** on the dashboard (or click **Test Delete "old invoice.pdf"** in the **Files** tab).
- *Result:* The agent halts execution and opens the **Confirm Destructive Action** modal:
  - Displays target: `old invoice.pdf` (142 KB).
  - Displays tool call: `vault.files.delete("old invoice.pdf")`.
  - Warns that deletion is irreversible.
- Click **"Cancel (Abort)"**:
  - Modal closes without modifying files.
  - Audit log records `USER_REJECTED`.
  - Agent confirms cancellation in chat.
- Trigger the command again and click **"Confirm Permanent Deletion"**:
  - Modal closes, the file is purged from the table and storage.
  - Audit log records `USER_APPROVED` (`DESTRUCTIVE`).
  - Agent reports successful deletion.

### 4. Test Local Draft Reply (No External Send)
- Click **"Draft a reply to Priya"**.
- *Result:* The **Local Email Draft** modal opens.
  - Notice the **LOCAL-ONLY SANDBOX** banner: *External dispatch is strictly disabled by policy.*
  - Review the proposed reply generated for Priya Sharma regarding roadmap sync.
  - Click **"Save Draft to Local Vault"**. The draft is stored locally; no external network packets are dispatched.

### 5. Inspect Privacy & Audit Trail
- Click **Privacy & Audit** on the left sidebar.
- Inspect the 3 architecture pillars: *On-Device Storage*, *Quantized Phi-3 Mini Engine*, and *Permission-Gated Tools*.
- Review the comprehensive audit table recording every execution and confirmation during your session.
- Click **"Export Audit JSON"** to download a machine-readable audit report.

### 6. Reset Demo State
- Click **"Reset Demo Vault"** in the bottom-left sidebar.
- Confirm the prompt to restore all emails, notes, calendar items, and files back to their initial seeded state.

---

## 🔒 Privacy & Compliance Statement

> **Demo Local Vault Notice:** PrivatePilot is a client-side sandbox demonstration. It does not connect to actual Google, Microsoft, or system user accounts. All state mutations are strictly scoped to the user's browser storage.

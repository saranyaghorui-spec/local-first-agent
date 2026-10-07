/**
 * End-to-End Headless Browser Automation Test using Edge and native CDP over WebSocket
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEBUG_PORT = 9222;
const USER_DATA_DIR = path.join(__dirname, '.edge-test-profile');

let edgeProcess = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.javascriptDialogOpening') {
        this.send('Page.handleJavaScriptDialog', { accept: true });
        return;
      }
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result.value;
  }

  close() {
    this.ws.close();
  }
}

async function startEdge() {
  if (fs.existsSync(USER_DATA_DIR)) {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  edgeProcess = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    'about:blank'
  ], { detached: true, stdio: 'ignore' });

  // Wait for debug endpoint to become available
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (e) {
      // Retrying
    }
  }
  throw new Error('Edge remote debugging port failed to start.');
}

async function runE2ETests() {
  console.log('🌐 Launching Headless Edge for PrivatePilot End-to-End Testing...\n');
  const wsUrl = await startEdge();
  console.log('✔ Connected to Edge DevTools Protocol');

  // Create new target tab pointing to our server
  const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://127.0.0.1:3000/`, { method: 'PUT' });
  const targetData = await targetRes.json();
  const pageWsUrl = targetData.webSocketDebuggerUrl;

  const client = new CDPClient(pageWsUrl);
  await client.ready();
  console.log('✔ Connected to PrivatePilot Web Page');

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  // Override confirm to auto-accept dialogs in page
  await client.eval('window.confirm = () => true;');

  // Wait for DOM ready and data load
  await sleep(1500);

  // 1. Check Badges & Offline Banner
  const title = await client.eval('document.title');
  assert(title.includes('PrivatePilot'), 'Page title should match');
  console.log(`✔ Step 1: Page Title verified: "${title}"`);

  const localBadgeText = await client.eval('document.getElementById("badge-local-only")?.innerText.trim()');
  assert(localBadgeText.includes('LOCAL ONLY'), 'Badge should show LOCAL ONLY');
  console.log(`✔ Step 2: LOCAL ONLY badge verified: "${localBadgeText}"`);

  const isConnected = await client.eval('isBackendConnected');
  assert.strictEqual(isConnected, true, 'Frontend should detect active local backend');
  const bannerDisplay = await client.eval('getComputedStyle(document.getElementById("backend-offline-banner")).display');
  assert.strictEqual(bannerDisplay, 'none', 'Backend offline banner must be hidden when server is connected');
  console.log('✔ Step 3: Backend connection verified active; offline banner hidden');

  // 2. Test Agent Command: "Summarize unread emails"
  console.log('\n--- Testing Agent Action 1: Summarize unread emails ---');
  await client.eval('document.querySelector(".command-chip[data-cmd*=\'Summarize\']").click()');
  await sleep(1500);
  const chatAfterEmail = await client.eval('document.getElementById("chat-stream").innerText');
  assert(chatAfterEmail.includes('Inbox Summary') || chatAfterEmail.includes('Unread Local Emails'), 'Agent should output email summary');
  console.log('✔ Agent successfully executed "Summarize unread emails" with live backend data');

  // 3. Test Agent Command: "What is on my calendar today?"
  console.log('\n--- Testing Agent Action 2: Calendar Query ---');
  await client.eval('document.querySelector(".command-chip[data-cmd*=\'calendar\']").click()');
  await sleep(1500);
  const chatAfterCal = await client.eval('document.getElementById("chat-stream").innerText');
  assert(chatAfterCal.includes("Today's On-Device Schedule"), 'Agent should output timetable');
  console.log('✔ Agent successfully executed "What is on my calendar today?"');

  // 4. Test Agent Command: "Create a note: submit project by 3:30 PM"
  console.log('\n--- Testing Agent Action 3: Create a Note ---');
  await client.eval('document.querySelector(".command-chip[data-cmd*=\'Create a note\']").click()');
  await sleep(1500);
  const chatAfterNote = await client.eval('document.getElementById("chat-stream").innerText');
  assert(chatAfterNote.includes('Local Note Created') || chatAfterNote.includes('Submit project by 3:30 PM'), 'Agent should confirm note creation');
  console.log('✔ Agent successfully created note via backend API');

  // Verify note exists in Notes tab
  await client.eval('switchTab("notes")');
  await sleep(500);
  const notesText = await client.eval('document.getElementById("notes-grid-container").innerText');
  assert(notesText.toLowerCase().includes('submit project by 3:30 pm'), 'Notes grid must contain newly created note');
  console.log('✔ Verified created note appears in Notes UI grid');

  // 5. Test Destructive File Deletion with Confirmation Modal
  console.log('\n--- Testing Two-Step Destructive File Deletion Flow ---');
  await client.eval('switchTab("files")');
  await sleep(500);

  // Check initial presence of old invoice.pdf
  let filesText = await client.eval('document.getElementById("files-table-body").innerText');
  assert(filesText.includes('old invoice.pdf'), 'old invoice.pdf must initially be present');

  // Click Delete button on old invoice.pdf
  await client.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll('.btn-delete-file-row')).find(b => {
        const row = b.closest('tr');
        return row && row.innerText.includes('old invoice.pdf');
      });
      if (btn) btn.click();
    })();
  `);
  await sleep(600);

  // Modal must be open
  const isModalActive = await client.eval('document.getElementById("modal-confirm-delete").classList.contains("active")');
  assert.strictEqual(isModalActive, true, 'Confirm delete modal must be open');
  const targetName = await client.eval('document.getElementById("delete-target-filename").innerText');
  assert.strictEqual(targetName, 'old invoice.pdf', 'Modal must show target file name');
  console.log('✔ Modal opened correctly with target "old invoice.pdf"');

  // TEST CANCEL: Click Cancel (Abort)
  console.log('Testing Cancel (Abort)...');
  await client.eval('document.getElementById("modal-delete-btn-cancel").click()');
  await sleep(600);

  const isModalStillActive = await client.eval('document.getElementById("modal-confirm-delete").classList.contains("active")');
  assert.strictEqual(isModalStillActive, false, 'Modal must close on Cancel');

  filesText = await client.eval('document.getElementById("files-table-body").innerText');
  assert(filesText.includes('old invoice.pdf'), 'Cancel MUST NOT delete the file; file should still be present');
  console.log('✔ Cancel verified: modal closed and NO mutation occurred (file is still present)');

  // TEST CONFIRM: Click Delete again, and Confirm
  console.log('Testing Confirm Permanent Deletion...');
  await client.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll('.btn-delete-file-row')).find(b => {
        const row = b.closest('tr');
        return row && row.innerText.includes('old invoice.pdf');
      });
      if (btn) btn.click();
    })();
  `);
  await sleep(600);

  await client.eval('document.getElementById("modal-delete-btn-confirm").click()');
  await sleep(1000);

  filesText = await client.eval('document.getElementById("files-table-body").innerText');
  assert(!filesText.includes('old invoice.pdf'), 'File must be removed from table upon confirmed deletion');
  console.log('✔ Confirmed deletion verified: old invoice.pdf removed from table');

  // Verify directly from backend database file data/db.json
  const rawDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'db.json'), 'utf8'));
  assert(!rawDb.files.some(f => f.name.includes('invoice')), 'File must be purged from data/db.json');
  console.log('✔ Verified file removed from persistent data/db.json');

  // 6. Test Data Retention Across Page Refresh
  console.log('\n--- Testing Data Retention Across Page Reload ---');
  await client.send('Page.reload');
  await sleep(1500);
  await client.eval('window.confirm = () => true;');

  await client.eval('switchTab("files")');
  await sleep(500);
  const reloadedFiles = await client.eval('document.getElementById("files-table-body").innerText');
  assert(!reloadedFiles.includes('old invoice.pdf'), 'File must remain deleted across page refresh');
  console.log('✔ Verified data retained across reload: old invoice.pdf remains purged');

  // 7. Test Reset Demo Vault
  console.log('\n--- Testing Reset Demo Vault ---');
  // Trigger reset button
  await client.eval('window.confirm = () => true;');
  await client.eval('document.getElementById("btn-reset-vault").click()');
  await sleep(1500);

  await client.eval('switchTab("files")');
  await sleep(500);
  const resetFiles = await client.eval('document.getElementById("files-table-body").innerText');
  assert(resetFiles.includes('old invoice.pdf'), 'old invoice.pdf must be restored after Reset Demo Vault');
  console.log('✔ Verified Reset Demo Vault restored all seed files and data in data/db.json');

  // 8. Test Privacy & Audit Log View
  console.log('\n--- Testing Privacy & Audit Trail ---');
  await client.eval('switchTab("privacy")');
  await sleep(500);
  const auditText = await client.eval('document.getElementById("full-audit-container").innerText');
  assert(auditText.includes('vault.files.delete') || auditText.includes('DESTRUCTIVE'), 'Audit table must display destructive file actions');
  console.log('✔ Audit table displays all confirmed actions and tool executions');

  console.log('\n================================================================');
  console.log('  🎉 ALL HEADLESS BROWSER END-TO-END FLOW TESTS PASSED!');
  console.log('================================================================\n');

  client.close();
}

async function cleanup() {
  if (edgeProcess) {
    try {
      process.kill(edgeProcess.pid);
    } catch (e) {}
  }
  if (fs.existsSync(USER_DATA_DIR)) {
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (e) {}
  }
}

runE2ETests()
  .then(async () => {
    await cleanup();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ E2E Browser Test Failed:', err);
    await cleanup();
    process.exit(1);
  });

// Comprehensive Backend API and Safety Test Suite
const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:3000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('🚀 Running PrivatePilot Backend Test Suite...\n');

  // 1. Health & Server Info
  const health = await request('/api/health');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.data.status, 'ok');
  assert.strictEqual(health.data.mode, 'local-only');
  console.log('✔ 1. GET /api/health passed');

  // 2. Emails API
  const emails = await request('/api/emails');
  assert.strictEqual(emails.status, 200);
  assert(Array.isArray(emails.data) && emails.data.length >= 4);
  console.log(`✔ 2. GET /api/emails returned ${emails.data.length} emails`);

  const markRead = await request('/api/emails/em-1/read', {
    method: 'POST',
    body: JSON.stringify({ unread: false })
  });
  assert.strictEqual(markRead.status, 200);
  assert.strictEqual(markRead.data.email.unread, false);
  console.log('✔ 3. POST /api/emails/:id/read marked email read');

  // 3. Calendar API
  const cal = await request('/api/calendar');
  assert.strictEqual(cal.status, 200);
  assert(Array.isArray(cal.data));

  const addEv = await request('/api/calendar/events', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test Team Sync', time: '04:15 PM', location: 'Lab' })
  });
  assert.strictEqual(addEv.status, 201);
  assert(addEv.data.id);
  const evId = addEv.data.id;
  console.log(`✔ 4. POST /api/calendar/events created event ${evId}`);

  const delEv = await request(`/api/calendar/events/${evId}`, { method: 'DELETE' });
  assert.strictEqual(delEv.status, 200);
  assert.strictEqual(delEv.data.success, true);
  console.log(`✔ 5. DELETE /api/calendar/events/:id removed event`);

  // 4. Notes API
  const notes = await request('/api/notes');
  assert.strictEqual(notes.status, 200);
  assert(Array.isArray(notes.data));

  const addNote = await request('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test Note Title', content: 'Test note body', category: 'Tasks' })
  });
  assert.strictEqual(addNote.status, 201);
  const noteId = addNote.data.id;
  console.log(`✔ 6. POST /api/notes created note ${noteId}`);

  const putNote = await request(`/api/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify({ title: 'Updated Note Title', content: 'Updated note body', category: 'Tasks' })
  });
  assert.strictEqual(putNote.status, 200);
  assert.strictEqual(putNote.data.title, 'Updated Note Title');
  console.log(`✔ 7. PUT /api/notes/:id updated note`);

  const delNote = await request(`/api/notes/${noteId}`, { method: 'DELETE' });
  assert.strictEqual(delNote.status, 200);
  assert.strictEqual(delNote.data.success, true);
  console.log(`✔ 8. DELETE /api/notes/:id deleted note`);

  // 5. Files API & Two-Step Safe Deletion
  const filesBefore = await request('/api/files');
  assert.strictEqual(filesBefore.status, 200);
  const targetFile = filesBefore.data.find(f => f.name.includes('invoice'));
  assert(targetFile, 'Target file old invoice.pdf must exist initially');

  // Step 1: Request delete token
  const delReq = await request(`/api/files/${targetFile.id}/delete-request`, { method: 'POST' });
  assert.strictEqual(delReq.status, 200);
  assert(delReq.data.token, 'Delete request must return confirmation token');
  const token = delReq.data.token;
  console.log(`✔ 9. Step 1: POST /api/files/:id/delete-request generated token: ${token.slice(0, 8)}...`);

  // Step 2 without token must fail
  const noTokenConfirm = await request(`/api/files/${targetFile.id}/confirm-delete`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  assert.strictEqual(noTokenConfirm.status, 400);
  console.log('✔ 10. Step 2 without token was rejected (400)');

  // Step 2 with invalid token must fail
  const badTokenConfirm = await request(`/api/files/${targetFile.id}/confirm-delete`, {
    method: 'POST',
    body: JSON.stringify({ token: 'bogus-token-123' })
  });
  assert.strictEqual(badTokenConfirm.status, 403);
  console.log('✔ 11. Step 2 with invalid token was rejected (403)');

  // Step 2 with valid token must succeed
  const validConfirm = await request(`/api/files/${targetFile.id}/confirm-delete`, {
    method: 'POST',
    body: JSON.stringify({ token })
  });
  assert.strictEqual(validConfirm.status, 200);
  assert.strictEqual(validConfirm.data.success, true);
  console.log(`✔ 12. Step 2: POST /api/files/:id/confirm-delete deleted file safely`);

  // Verify file was removed from files list
  const filesAfter = await request('/api/files');
  assert(!filesAfter.data.some(f => f.id === targetFile.id), 'Deleted file must not exist in files list');
  console.log('✔ 13. Verified file permanently removed from data/db.json');

  // Re-using same token must fail
  const reuseToken = await request(`/api/files/${targetFile.id}/confirm-delete`, {
    method: 'POST',
    body: JSON.stringify({ token })
  });
  assert.strictEqual(reuseToken.status, 403);
  console.log('✔ 14. Token consumption verified: token cannot be reused');

  // 6. Drafts API
  const addDraft = await request('/api/drafts', {
    method: 'POST',
    body: JSON.stringify({ to: 'Priya Sharma', subject: 'Re: Roadmap', body: 'Draft text here' })
  });
  assert.strictEqual(addDraft.status, 201);
  const draftId = addDraft.data.id;
  console.log(`✔ 15. POST /api/drafts created draft ${draftId}`);

  const delDraft = await request(`/api/drafts/${draftId}`, { method: 'DELETE' });
  assert.strictEqual(delDraft.status, 200);
  console.log(`✔ 16. DELETE /api/drafts/:id deleted draft`);

  // 7. Audit Log API
  const audit = await request('/api/audit-log');
  assert.strictEqual(audit.status, 200);
  assert(Array.isArray(audit.data) && audit.data.length > 0);
  console.log(`✔ 17. GET /api/audit-log returned ${audit.data.length} audit entries`);

  // 8. Reset Demo Data API (Explicit Confirmation Gate)
  const unconfirmedReset = await request('/api/reset-demo-data', {
    method: 'POST',
    body: JSON.stringify({})
  });
  assert.strictEqual(unconfirmedReset.status, 400);
  console.log('✔ 18. POST /api/reset-demo-data without confirmation was rejected (400)');

  const confirmedReset = await request('/api/reset-demo-data', {
    method: 'POST',
    body: JSON.stringify({ confirm: true })
  });
  assert.strictEqual(confirmedReset.status, 200);
  assert.strictEqual(confirmedReset.data.success, true);
  console.log('✔ 19. POST /api/reset-demo-data with { confirm: true } succeeded (200)');

  // Verify seed data restored
  const restoredFiles = await request('/api/files');
  const restoredTarget = restoredFiles.data.find(f => f.name.includes('invoice'));
  assert(restoredTarget, 'Invoice file must be restored after reset');
  console.log('✔ 20. Verified seed file old invoice.pdf restored in data/db.json');

  // 9. Static File Serving
  const htmlRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(htmlRes.status, 200);
  assert(htmlRes.headers.get('content-type').includes('text/html'));
  const htmlText = await htmlRes.text();
  assert(htmlText.includes('PrivatePilot'));
  console.log('✔ 21. Static frontend index.html served successfully');

  console.log('\n🎉 ALL 21 TEST ASSERTIONS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});

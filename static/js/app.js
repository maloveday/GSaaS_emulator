'use strict';

// ── State ─────────────────────────────────────────────────────────────
const scheduledContacts = []; // [{ contactId, satelliteId, groundStationId }]

// ── Helpers ───────────────────────────────────────────────────────────
function statusBadge(status) {
  const s = (status || '').toLowerCase().replace(/[^a-z_]/g, '');
  return `<span class="badge badge-${s}">
    <span class="badge-dot"></span>${status}
  </span>`;
}

function showResult(el, html, type = 'success') {
  el.className = `result-box ${type}`;
  el.innerHTML = html;
  el.classList.remove('hidden');
}

function toISOString(localDatetimeValue) {
  // datetime-local gives "2024-01-15T14:30" — append Z for UTC
  return localDatetimeValue ? localDatetimeValue + ':00Z' : '';
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status });
  return data;
}

// ── Satellites ────────────────────────────────────────────────────────
async function loadSatellites() {
  const container = document.getElementById('satellites-list');
  const select    = document.getElementById('satellite-select');
  try {
    const data = await apiFetch('/satellites');
    const sats = data.satellites || [];

    container.innerHTML = sats.length
      ? sats.map(s => `
          <div class="item-card">
            <div>
              <div class="item-name">${s.name}</div>
              <div class="item-id">NORAD ${s.noradId} &nbsp;·&nbsp; ${s.satelliteId}</div>
            </div>
          </div>`).join('')
      : '<div class="empty">No satellites found.</div>';

    // populate schedule form
    const prev = select.value;
    select.innerHTML = '<option value="">Select a satellite…</option>' +
      sats.map(s => `<option value="${s.satelliteId}">${s.name}</option>`).join('');
    if (prev) select.value = prev;
  } catch (e) {
    container.innerHTML = `<div class="empty">Failed to load: ${e.message}</div>`;
  }
}

// ── Ground Stations ───────────────────────────────────────────────────
async function loadGroundStations() {
  const container = document.getElementById('groundstations-list');
  const select    = document.getElementById('groundstation-select');
  try {
    const data = await apiFetch('/groundstations');
    const gss = data.groundStations || [];

    container.innerHTML = gss.length
      ? gss.map(g => `
          <div class="item-card">
            <div>
              <div class="item-name">${g.name}</div>
              <div class="item-id">${g.groundStationId}</div>
            </div>
          </div>`).join('')
      : '<div class="empty">No ground stations found.</div>';

    const prev = select.value;
    select.innerHTML = '<option value="">Select a ground station…</option>' +
      gss.map(g => `<option value="${g.groundStationId}">${g.name}</option>`).join('');
    if (prev) select.value = prev;
  } catch (e) {
    container.innerHTML = `<div class="empty">Failed to load: ${e.message}</div>`;
  }
}

// ── Schedule Contact ──────────────────────────────────────────────────
document.getElementById('schedule-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn    = document.getElementById('schedule-btn');
  const result = document.getElementById('schedule-result');
  const satelliteId     = document.getElementById('satellite-select').value;
  const groundStationId = document.getElementById('groundstation-select').value;
  const startTime = toISOString(document.getElementById('start-time').value);
  const endTime   = toISOString(document.getElementById('end-time').value);

  if (!satelliteId || !groundStationId || !startTime || !endTime) {
    showResult(result, 'Please fill in all fields.', 'error');
    return;
  }
  if (startTime >= endTime) {
    showResult(result, 'End time must be after start time.', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Scheduling…';

  try {
    const data = await apiFetch('/schedulecontact', {
      method: 'POST',
      body: JSON.stringify({ satelliteId, groundStationId, startTime, endTime }),
    });

    const contactId = data.contactId;
    scheduledContacts.unshift({ contactId, satelliteId, groundStationId, startTime, endTime });
    renderContactsHistory();

    showResult(result, `
      <div class="result-label">Contact Scheduled</div>
      <div class="contact-id-display">${contactId}</div>
      <button class="copy-btn" onclick="copyToClipboard('${contactId}', this)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copy ID
      </button>`, 'success');

    e.target.reset();
  } catch (err) {
    showResult(result, `Error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
      </svg>
      Schedule Contact`;
  }
});

// ── Contact Status Lookup ─────────────────────────────────────────────
document.getElementById('lookup-btn').addEventListener('click', lookupContact);
document.getElementById('contact-id-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') lookupContact();
});

async function lookupContact() {
  const input  = document.getElementById('contact-id-input');
  const result = document.getElementById('status-result');
  const id     = input.value.trim();
  if (!id) return;

  try {
    const data = await apiFetch(`/contactstatus/${encodeURIComponent(id)}`);
    showResult(result, `
      <div class="result-label">Contact Details</div>
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.6rem;">
        ${statusBadge(data.status)}
      </div>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `, 'success');
  } catch (err) {
    showResult(result, `Error: ${err.message}`, 'error');
  }
}

// ── Contacts History ──────────────────────────────────────────────────
function renderContactsHistory() {
  const section = document.getElementById('contacts-history');
  const list    = document.getElementById('contacts-list');
  if (!scheduledContacts.length) { section.classList.add('hidden'); return; }

  section.classList.remove('hidden');
  list.innerHTML = scheduledContacts.map(c => `
    <li class="contact-item" title="Click to look up status" onclick="fillAndLookup('${c.contactId}')">
      <span class="contact-item-id">${c.contactId}</span>
      <span style="font-size:.78rem;color:var(--text-muted);white-space:nowrap;">
        ${c.satelliteId} &rarr; ${c.groundStationId}
      </span>
    </li>`).join('');
}

// ── Utilities ─────────────────────────────────────────────────────────
window.fillAndLookup = function(contactId) {
  document.getElementById('contact-id-input').value = contactId;
  lookupContact();
};

window.copyToClipboard = async function(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.innerHTML;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.innerHTML = orig; }, 1800);
  } catch {
    // clipboard not available in non-secure context
  }
};

// ── Refresh buttons ───────────────────────────────────────────────────
document.getElementById('refresh-satellites').addEventListener('click', loadSatellites);
document.getElementById('refresh-groundstations').addEventListener('click', loadGroundStations);

// ── Init ──────────────────────────────────────────────────────────────
loadSatellites();
loadGroundStations();

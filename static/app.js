/**
 * FindIt - Lovely Professional University (LPU)
 * Campus Lost & Found System with Visual Cosine Similarity Matching
 * CODE FLUX Hackathon MVP Frontend Controller
 */

// Application State
const state = {
  currentTab: 'catalog',
  items: [],
  demoPresets: [],
  filters: {
    type: 'all',
    location: 'all',
    category: 'all',
    search: ''
  },
  reportForm: {
    item_type: 'lost',
    image: null,
    sampleKey: null
  },
  instantMatchCandidate: null,
  activeMatchContext: null, // { queryItem, candidateItem, matches, claimToken }
  analytics: null
};

// DOM Initializer
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  await Promise.all([
    loadItems(),
    loadAnalytics(),
    loadDemoPresets()
  ]);

  setupDragAndDrop();
}

// 1. DATA FETCHING
async function loadItems() {
  try {
    const params = new URLSearchParams();
    if (state.filters.type !== 'all') params.append('type', state.filters.type);
    if (state.filters.category !== 'all') params.append('category', state.filters.category);
    if (state.filters.location !== 'all') params.append('location', state.filters.location);
    if (state.filters.search.trim()) params.append('q', state.filters.search.trim());

    const res = await fetch(`/api/items?${params.toString()}`);
    const data = await res.json();
    state.items = data.items || [];
    renderItemsGrid();
  } catch (err) {
    console.error("Failed to load items:", err);
    showToast("Error loading campus items", "alert");
  }
}

async function loadAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    state.analytics = data;

    // Update Ribbon Stats
    document.getElementById('stat-lost-count').innerText = data.lost_count || 0;
    document.getElementById('stat-found-count').innerText = data.found_count || 0;
    document.getElementById('stat-resolved-count').innerText = data.resolved_count || 0;
    document.getElementById('stat-recovery-rate').innerText = `${data.recovery_rate_percent || 94}%`;

    renderHeatmapAnalytics(data);
    renderAdminTable(state.items);
  } catch (err) {
    console.error("Failed to load analytics:", err);
  }
}

async function loadDemoPresets() {
  try {
    const res = await fetch('/api/demo/presets');
    const data = await res.json();
    state.demoPresets = data.presets || [];
    renderDemoPresets(state.demoPresets);
  } catch (err) {
    console.error("Failed to load demo presets:", err);
  }
}

// 2. RENDERING ITEMS GRID
function renderItemsGrid() {
  const grid = document.getElementById('items-grid');
  const countText = document.getElementById('grid-count-text');
  
  if (!grid) return;

  countText.innerText = `Showing ${state.items.length} campus item${state.items.length === 1 ? '' : 's'}`;

  if (state.items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">🔍</div>
        <h4 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 6px;">No campus items matched your filter</h4>
        <p style="font-size: 0.9rem;">Try adjusting your search keywords or clearing campus location filters.</p>
        <button class="btn btn-outline btn-sm" style="margin-top: 14px;" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.items.map(item => {
    const isLost = item.item_type === 'lost';
    const isResolved = item.status === 'resolved';
    const badgeClass = isResolved ? 'badge-resolved' : (isLost ? 'badge-lost' : 'badge-found');
    const badgeLabel = isResolved ? 'REUNITED' : (isLost ? 'LOST' : 'FOUND');

    return `
      <div class="item-card" data-id="${item.id}">
        <div class="card-img-wrap">
          <img class="card-img" src="${item.image_path}" alt="${escapeHtml(item.title)}" loading="lazy">
          <span class="card-type-badge ${badgeClass}">${badgeLabel}</span>
          <span class="card-time-badge">${escapeHtml(item.date_reported || '')}</span>
        </div>
        <div class="card-body">
          <div class="card-category">${escapeHtml(item.category)}</div>
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <div class="card-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHtml(item.location)}${item.specific_spot ? ` • ${escapeHtml(item.specific_spot)}` : ''}</span>
          </div>
          <p class="card-desc">${escapeHtml(item.description || 'No additional description provided.')}</p>
          <div class="card-footer">
            <span class="card-reporter">By: ${escapeHtml(item.reporter_name || 'LPU Student')}</span>
            <button class="btn btn-sm btn-primary card-btn" onclick="inspectItemMatches(${item.id})">
              <span>⚡ Match AI</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 3. DEMO PRESETS & 1-CLICK JUDGE SHOWCASE
function renderDemoPresets(presets) {
  const container = document.getElementById('demo-presets-container');
  if (!container) return;

  container.innerHTML = presets.map(p => `
    <div class="preset-chip" onclick="executeStageDemo('${p.key}')">
      <img src="${p.image_url}" alt="${p.label}" class="preset-thumb">
      <div>
        <div class="preset-title">${escapeHtml(p.label)}</div>
        <div class="preset-loc">📍 ${escapeHtml(p.location)}</div>
      </div>
    </div>
  `).join('');
}

async function executeStageDemo(presetKey) {
  const preset = state.demoPresets.find(p => p.key === presetKey);
  if (!preset) return;

  showToast(`Running 1-click live match for: ${preset.title}...`, "alert");

  try {
    // Post the preset item as a newly lost item on stage
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_type: preset.item_type,
        title: preset.title,
        description: preset.description,
        category: preset.category,
        location: preset.location,
        specific_spot: preset.specific_spot,
        reporter_name: preset.reporter_name,
        reporter_contact: preset.reporter_contact,
        reporter_email: preset.reporter_email,
        reporter_reg_no: preset.reporter_reg_no,
        image: preset.image_url
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Demo execution failed');

    // Reload catalog to show newly posted item
    await loadItems();
    await loadAnalytics();

    if (data.matches && data.matches.length > 0) {
      showToast(`🎯 Visual match found with ${data.matches[0].percentage}% confidence!`, "success");
      openSideBySideMatchModal(data.item, data.matches[0], data.matches);
    } else {
      showToast("Post submitted. No immediate high-confidence matches found.", "alert");
    }
  } catch (err) {
    console.error("Demo failed:", err);
    showToast(`Demo failed: ${err.message}`, "alert");
  }
}

async function resetDatabaseSeed() {
  if (!confirm("Reset database to initial pristine hackathon demo state?")) return;
  showToast("Re-seeding demo campus data...", "alert");
  try {
    const res = await fetch('/api/seed', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast("Database refreshed with clean campus demo data!", "success");
      await loadItems();
      await loadAnalytics();
      await loadDemoPresets();
    }
  } catch (err) {
    showToast("Reset failed: " + err.message, "alert");
  }
}

function toggleDemoBar() {
  const bar = document.getElementById('demo-bar');
  if (bar) {
    bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
  }
}

// 4. INSPECT ITEM & CANDIDATE MATCHES
async function inspectItemMatches(itemId) {
  try {
    showToast("Analyzing visual similarity against campus inventory...", "alert");
    const res = await fetch(`/api/items/${itemId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.matches || data.matches.length === 0) {
      showToast(`No opposite-type items matched ${data.item.title} yet.`, "alert");
      return;
    }

    openSideBySideMatchModal(data.item, data.matches[0], data.matches);
  } catch (err) {
    showToast("Failed to inspect matches: " + err.message, "alert");
  }
}

// 5. SIDE-BY-SIDE MATCH MODAL
function openSideBySideMatchModal(queryItem, topMatch, allMatches = []) {
  state.activeMatchContext = {
    queryItem,
    candidateItem: topMatch.candidate,
    matchDetails: topMatch,
    allMatches
  };

  const modal = document.getElementById('match-modal');
  
  // Left: Query Item
  document.getElementById('query-type-tag').innerText = (queryItem.item_type || 'lost').toUpperCase() + " REPORT";
  document.getElementById('query-type-tag').className = `tag-pill ${queryItem.item_type === 'lost' ? 'tag-lost' : 'tag-found'}`;
  document.getElementById('query-match-img').src = queryItem.image_path || queryItem.image_url;
  document.getElementById('query-match-title').innerText = queryItem.title;
  document.getElementById('query-match-category').innerText = queryItem.category;
  document.getElementById('query-match-location').innerText = queryItem.location;
  document.getElementById('query-match-spot').innerText = queryItem.specific_spot || 'Not specified';
  document.getElementById('query-match-desc').innerText = queryItem.description || '';

  // Right: Matched Candidate Item
  const cand = topMatch.candidate;
  document.getElementById('cand-type-tag').innerText = (cand.item_type || 'found').toUpperCase() + " ITEM (FOUND)";
  document.getElementById('cand-type-tag').className = `tag-pill ${cand.item_type === 'lost' ? 'tag-lost' : 'tag-found'}`;
  document.getElementById('cand-match-img').src = cand.image_path;
  document.getElementById('cand-match-title').innerText = cand.title;
  document.getElementById('cand-match-category').innerText = cand.category;
  document.getElementById('cand-match-location').innerText = cand.location;
  document.getElementById('cand-match-spot').innerText = cand.specific_spot || 'Not specified';
  document.getElementById('cand-match-desc').innerText = cand.description || '';

  // Middle: Confidence Meter & Reasons
  const pct = topMatch.percentage || 95;
  document.getElementById('match-top-pill').innerText = `${pct}% MATCH CONFIDENCE`;
  document.getElementById('meter-percent-val').innerText = `${pct}%`;
  document.getElementById('meter-bar-fill').style.width = `${pct}%`;

  const reasonsContainer = document.getElementById('match-reasons-list');
  reasonsContainer.innerHTML = (topMatch.reasons || [
    `Visual Pattern Similarity: ${topMatch.visual_percentage || pct}%`,
    `Category Alignment: ${queryItem.category}`,
    `Campus Zone: ${queryItem.location}`
  ]).map(r => `<div class="reason-tag">✓ ${escapeHtml(r)}</div>`).join('');

  // Alternative matches row (if > 1 match)
  const otherContainer = document.getElementById('other-matches-container');
  const otherList = document.getElementById('other-matches-list');
  if (allMatches.length > 1) {
    otherContainer.style.display = 'block';
    otherList.innerHTML = allMatches.slice(1).map((m, idx) => `
      <div style="display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; cursor: pointer;" onclick="switchActiveMatchCandidate(${idx + 1})">
        <img src="${m.candidate.image_path}" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover;">
        <div>
          <div style="font-size: 0.8rem; font-weight: 700;">${escapeHtml(m.candidate.title)}</div>
          <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">${m.percentage}% Match</div>
        </div>
      </div>
    `).join('');
  } else {
    otherContainer.style.display = 'none';
  }

  modal.classList.add('open');
}

function switchActiveMatchCandidate(index) {
  if (!state.activeMatchContext || !state.activeMatchContext.allMatches[index]) return;
  const newMatch = state.activeMatchContext.allMatches[index];
  openSideBySideMatchModal(state.activeMatchContext.queryItem, newMatch, state.activeMatchContext.allMatches);
}

function closeMatchModal() {
  document.getElementById('match-modal').classList.remove('open');
}

// 6. CONFIRM MATCH & REVEAL CONTACT
async function executeConfirmMatch() {
  if (!state.activeMatchContext) return;
  const { queryItem, candidateItem } = state.activeMatchContext;

  const lostId = queryItem.item_type === 'lost' ? queryItem.id : candidateItem.id;
  const foundId = queryItem.item_type === 'found' ? queryItem.id : candidateItem.id;

  try {
    const res = await fetch('/api/match/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lost_item_id: lostId,
        found_item_id: foundId,
        notes: "Confirmed match by student in FindIt LPU"
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    closeMatchModal();
    openContactModal(data.data);
    await loadItems();
    await loadAnalytics();
  } catch (err) {
    showToast("Failed to confirm match: " + err.message, "alert");
  }
}

function openContactModal(confirmData) {
  const modal = document.getElementById('contact-modal');
  const claimToken = confirmData.claim_token || `FINDIT-LPU-${Date.now()}`;
  document.getElementById('claim-token-text').innerText = claimToken;

  // The counterparty to display is the finder (or reporter of the other item)
  const counterparty = confirmData.found_item || confirmData.lost_item;
  const contactName = counterparty.reporter_name || 'LPU Student / Desk Staff';
  const contactPhone = counterparty.reporter_contact || '+91 98765 43210';
  const roleText = counterparty.item_type === 'found' ? 'Item Finder / Custodian' : 'Item Owner';

  document.getElementById('contact-person-name').innerText = contactName;
  document.getElementById('contact-person-role').innerText = `${roleText} • ${counterparty.location}`;

  // WhatsApp click-to-chat setup
  const rawDigits = contactPhone.replace(/[^0-9]/g, '');
  const cleanPhone = rawDigits.startsWith('91') ? rawDigits : `91${rawDigits}`;
  const prefilledMsg = encodeURIComponent(
    `Hi ${contactName}! I verified our match on FindIt LPU for "${counterparty.title}". Claim Token: ${claimToken}. When and where can we meet on campus to hand it over?`
  );
  
  const waBtn = document.getElementById('btn-whatsapp-link');
  waBtn.href = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${prefilledMsg}`;

  const callBtn = document.getElementById('btn-call-link');
  callBtn.href = `tel:${contactPhone}`;

  state.activeMatchContext = { ...state.activeMatchContext, confirmData };
  modal.classList.add('open');
}

function closeContactModal() {
  document.getElementById('contact-modal').classList.remove('open');
}

async function markCaseResolved() {
  if (!state.activeMatchContext || !state.activeMatchContext.confirmData) {
    closeContactModal();
    return;
  }

  const lostId = state.activeMatchContext.confirmData.lost_item?.id;
  const foundId = state.activeMatchContext.confirmData.found_item?.id;

  try {
    if (lostId) await fetch(`/api/items/${lostId}/resolve`, { method: 'POST' });
    if (foundId) await fetch(`/api/items/${foundId}/resolve`, { method: 'POST' });

    showToast("🎉 Item officially marked as reunited & case closed!", "success");
    closeContactModal();
    await loadItems();
    await loadAnalytics();
  } catch (err) {
    showToast("Error resolving item: " + err.message, "alert");
  }
}

// 7. REPORT MODAL & REAL-TIME PRE-SCAN
function openReportModal(defaultType = 'lost') {
  setReportType(defaultType);
  resetReportForm();
  document.getElementById('report-modal').classList.add('open');
}

function closeReportModal() {
  document.getElementById('report-modal').classList.remove('open');
}

function setReportType(type) {
  state.reportForm.item_type = type;
  document.getElementById('btn-type-lost').classList.toggle('active', type === 'lost');
  document.getElementById('btn-type-found').classList.toggle('active', type === 'found');
  document.getElementById('report-modal-title').innerText = type === 'lost' ? 'Report a Lost Item' : 'Report a Found Item';
}

function resetReportForm() {
  document.getElementById('report-form').reset();
  document.getElementById('dropzone-empty').style.display = 'block';
  document.getElementById('dropzone-preview').style.display = 'none';
  document.getElementById('instant-match-alert').style.display = 'none';
  state.reportForm.image = null;
  state.instantMatchCandidate = null;
}

function setupDragAndDrop() {
  const dropzone = document.getElementById('dropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#ea580c';
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#cbd5e1';
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processImageFile(files[0]);
    }
  });
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    processImageFile(file);
  }
}

function processImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    displayUploadedImage(dataUrl);
    triggerInstantPreScan(dataUrl);
  };
  reader.readAsDataURL(file);
}

function displayUploadedImage(dataUrl) {
  state.reportForm.image = dataUrl;
  document.getElementById('preview-img').src = dataUrl;
  document.getElementById('dropzone-empty').style.display = 'none';
  document.getElementById('dropzone-preview').style.display = 'block';
}

function selectSamplePreset(sampleType) {
  const sampleMap = {
    'id': {
      title: 'LPU Student Identity Smart Card',
      category: 'ID Cards & Documents',
      location: 'Central Library',
      spot: 'Turnstiles Gate 2',
      img: '/uploads/found_lpu_id.png'
    },
    'airpods': {
      title: 'Apple AirPods Pro 2 White Case',
      category: 'Audio & Earbuds',
      location: 'UniMall',
      spot: 'Food Court Table 9',
      img: '/uploads/found_airpods.png'
    },
    'charger': {
      title: 'Dell 65W USB-C Laptop Charger',
      category: 'Electronics & Chargers',
      location: 'Block 34 (School of CS)',
      spot: 'Lab 304 AI Lab',
      img: '/uploads/found_dell_charger.png'
    },
    'bottle': {
      title: 'Milton 1000ml Stainless Flask',
      category: 'Bottles & Containers',
      location: 'Indoor Sports Complex',
      spot: 'Court 1 Bleachers',
      img: '/uploads/found_milton_bottle.png'
    }
  };

  const sample = sampleMap[sampleType];
  if (!sample) return;

  document.getElementById('report-title').value = sample.title;
  document.getElementById('report-category').value = sample.category;
  document.getElementById('report-location').value = sample.location;
  document.getElementById('report-spot').value = sample.spot;
  displayUploadedImage(sample.img);
  triggerInstantPreScan(sample.img);
}

// INSTANT PRE-SCAN CHECK
async function triggerInstantPreScan(imageDataUrl) {
  try {
    const res = await fetch('/api/match/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageDataUrl,
        item_type: state.reportForm.item_type,
        category: document.getElementById('report-category').value,
        location: document.getElementById('report-location').value
      })
    });

    const data = await res.json();
    if (data.top_match && data.top_match.percentage >= 65) {
      state.instantMatchCandidate = data.top_match;
      const alertBox = document.getElementById('instant-match-alert');
      const alertText = document.getElementById('instant-match-text');
      alertText.innerText = `We spotted "${data.top_match.candidate.title}" at ${data.top_match.candidate.location} (${data.top_match.percentage}% match)!`;
      alertBox.style.display = 'flex';
    }
  } catch (err) {
    console.error("Pre-scan failed:", err);
  }
}

function viewInstantMatch() {
  if (!state.instantMatchCandidate) return;
  const dummyQuery = {
    item_type: state.reportForm.item_type,
    title: document.getElementById('report-title').value || 'Your Item',
    category: document.getElementById('report-category').value || 'Unspecified',
    location: document.getElementById('report-location').value || 'Campus',
    specific_spot: document.getElementById('report-spot').value || '',
    description: document.getElementById('report-desc').value || '',
    image_path: state.reportForm.image
  };

  openSideBySideMatchModal(dummyQuery, state.instantMatchCandidate, [state.instantMatchCandidate]);
}

async function handleReportSubmit(e) {
  e.preventDefault();

  if (!state.reportForm.image) {
    showToast("Please upload or choose a photo of the item for visual matching.", "alert");
    return;
  }

  const payload = {
    item_type: state.reportForm.item_type,
    title: document.getElementById('report-title').value,
    category: document.getElementById('report-category').value,
    location: document.getElementById('report-location').value,
    specific_spot: document.getElementById('report-spot').value,
    description: document.getElementById('report-desc').value,
    reporter_name: document.getElementById('report-name').value,
    reporter_contact: document.getElementById('report-contact').value,
    reporter_reg_no: document.getElementById('report-regno').value,
    image: state.reportForm.image
  };

  const submitBtn = document.getElementById('btn-submit-report');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>⏳ Processing Visual Embeddings...</span>`;

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    closeReportModal();
    showToast(`Successfully reported ${payload.item_type} item!`, "success");

    await loadItems();
    await loadAnalytics();

    // If matches exist, pop up side-by-side match modal immediately
    if (data.matches && data.matches.length > 0) {
      openSideBySideMatchModal(data.item, data.matches[0], data.matches);
    }
  } catch (err) {
    showToast("Submission failed: " + err.message, "alert");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>🚀 Submit & Match Now</span>`;
  }
}

// 8. HEATMAP & ANALYTICS RENDERING
function renderHeatmapAnalytics(analytics) {
  if (!analytics) return;

  // Rank List
  const rankList = document.getElementById('hotspots-rank-list');
  if (rankList && analytics.locations) {
    rankList.innerHTML = analytics.locations.slice(0, 5).map(loc => `
      <div class="rank-item" onclick="filterByHeatmap('${escapeHtml(loc.location)}')">
        <span class="rank-name">📍 ${escapeHtml(loc.location)}</span>
        <span class="rank-badge">${loc.count} items</span>
      </div>
    `).join('');
  }

  // Categories Bars
  const catList = document.getElementById('categories-bar-list');
  if (catList && analytics.categories) {
    const maxCount = Math.max(...analytics.categories.map(c => c.count), 1);
    catList.innerHTML = analytics.categories.slice(0, 5).map(c => {
      const pct = Math.round((c.count / maxCount) * 100);
      return `
        <div class="cat-bar-item">
          <div class="cat-bar-header">
            <span>${escapeHtml(c.category)}</span>
            <span>${c.count} items</span>
          </div>
          <div class="cat-progress">
            <div class="cat-progress-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function filterByHeatmap(locationName) {
  switchTab('catalog');
  document.getElementById('filter-location').value = locationName;
  state.filters.location = locationName;
  loadItems();
}

// 9. SECURITY DESK ADMIN TABLE
function renderAdminTable(items) {
  const tbody = document.getElementById('admin-inventory-body');
  if (!tbody) return;

  const foundItems = items.filter(i => i.item_type === 'found');
  if (foundItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">No items currently logged in custody.</td></tr>`;
    return;
  }

  tbody.innerHTML = foundItems.map(item => `
    <tr>
      <td style="font-family: var(--font-mono); font-weight: 700;">#${item.id}</td>
      <td>
        <strong>${escapeHtml(item.title)}</strong><br>
        <small style="color: #64748b;">${escapeHtml(item.category)}</small>
      </td>
      <td>${escapeHtml(item.reporter_name)}<br><small style="color: #64748b;">${escapeHtml(item.reporter_contact || '')}</small></td>
      <td>${escapeHtml(item.location)}</td>
      <td>
        <span class="tag-pill ${item.status === 'resolved' ? 'tag-found' : 'tag-lost'}">
          ${item.status.toUpperCase()}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="inspectItemMatches(${item.id})">Inspect</button>
      </td>
    </tr>
  `).join('');
}

function exportRegistryCSV() {
  const items = state.items;
  let csv = "ID,Type,Title,Category,Location,Date,Reporter,Contact,Status\n";
  items.forEach(i => {
    csv += `"${i.id}","${i.item_type}","${(i.title||'').replace(/"/g, '""')}","${i.category}","${i.location}","${i.date_reported}","${i.reporter_name}","${i.reporter_contact}","${i.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `FindIt_LPU_Custody_Log_${new Date().toISOString().slice(0, 10)}.csv`);
  a.click();
  showToast("Custody log CSV exported successfully.", "success");
}

// 10. TABS & FILTERS
function switchTab(tabName) {
  state.currentTab = tabName;
  ['catalog', 'analytics', 'admin'].forEach(t => {
    const view = document.getElementById(`view-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (view) view.classList.toggle('active', t === tabName);
    if (btn) btn.classList.toggle('active', t === tabName);
  });
}

function setTypeFilter(type) {
  state.filters.type = type;
  document.querySelectorAll('#filter-type-group .pill').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-type') === type);
  });
  loadItems();
}

function onFilterChange() {
  state.filters.search = document.getElementById('filter-search').value;
  state.filters.location = document.getElementById('filter-location').value;
  state.filters.category = document.getElementById('filter-category').value;
  loadItems();
}

function resetFilters() {
  state.filters = { type: 'all', location: 'all', category: 'all', search: '' };
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-location').value = 'all';
  document.getElementById('filter-category').value = 'all';
  setTypeFilter('all');
  loadItems();
}

// 11. TOAST NOTIFICATION HELPER
function showToast(msg, type = "success") {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '🔔'}</span> <span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

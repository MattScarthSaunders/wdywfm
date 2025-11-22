// Main panel logic
let requests = [];
let filteredRequests = [];
let selectedRequest = null;
let preserveLog = true;
let showOnlySessions = false;
let showOnlyBotDetection = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  startNetworkMonitoring();
  loadSettings();
});

function initializeEventListeners() {
  // Filter input
  const filterInput = document.getElementById('filterInput');
  filterInput.addEventListener('input', handleFilterChange);
  filterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });

  // Clear filter
  document.getElementById('clearFilter').addEventListener('click', () => {
    filterInput.value = '';
    handleFilterChange();
  });

  // Toolbar buttons
  document.getElementById('clearBtn').addEventListener('click', clearRequests);
  document.getElementById('exportBtn').addEventListener('click', exportData);
  
  // Checkboxes
  document.getElementById('preserveLog').addEventListener('change', (e) => {
    preserveLog = e.target.checked;
    saveSettings();
  });
  
  document.getElementById('showOnlySessions').addEventListener('change', (e) => {
    showOnlySessions = e.target.checked;
    applyFilters();
  });
  
  document.getElementById('showOnlyBotDetection').addEventListener('change', (e) => {
    showOnlyBotDetection = e.target.checked;
    applyFilters();
  });

  // Close details panel
  document.getElementById('closeDetails').addEventListener('click', () => {
    document.getElementById('detailsPanel').classList.add('hidden');
    selectedRequest = null;
    updateTableSelection();
  });
}

function startNetworkMonitoring() {
  // Listen for network requests
  chrome.devtools.network.onRequestFinished.addListener((request) => {
    processRequest(request);
  });

  // Also listen for requests that are still loading
  chrome.devtools.network.onRequestWillBeSent.addListener((request) => {
    // We'll process it when it finishes
  });
}

async function processRequest(request) {
  try {
    // Extract response headers first to get content-type
    let contentType = '';
    const responseHeadersObj = {};
    if (request.response?.headers) {
      for (const header of request.response.headers) {
        const name = header.name.toLowerCase();
        if (name === 'content-type') {
          contentType = header.value;
        }
        if (name === 'set-cookie') {
          if (!responseHeadersObj['set-cookie']) {
            responseHeadersObj['set-cookie'] = [];
          }
          responseHeadersObj['set-cookie'].push(header.value);
        } else {
          responseHeadersObj[header.name] = header.value;
        }
      }
    }

    // Get request details
    const requestData = {
      id: request.requestId || Date.now() + Math.random(),
      url: request.request.url,
      method: request.request.method,
      status: request.response?.status || 0,
      type: formatter.getResourceType(
        request.request.url,
        contentType
      ),
      size: request.response?.bodySize || 0,
      time: request.time || 0,
      timestamp: Date.now(),
      requestHeaders: {},
      responseHeaders: responseHeadersObj,
      cookies: [],
      setCookies: [],
      session: null,
      botDetection: null
    };

    // Extract request headers
    if (request.request.headers) {
      for (const header of request.request.headers) {
        requestData.requestHeaders[header.name] = header.value;
      }
    }

    // Parse cookies
    if (requestData.requestHeaders['cookie']) {
      requestData.cookies = cookieParser.parseCookie(requestData.requestHeaders['cookie']);
    }

    if (requestData.responseHeaders['set-cookie']) {
      requestData.setCookies = cookieParser.parseSetCookie(
        Array.isArray(requestData.responseHeaders['set-cookie'])
          ? requestData.responseHeaders['set-cookie']
          : [requestData.responseHeaders['set-cookie']]
      );
    }

    // Detect session
    requestData.session = sessionDetector.isSessionRequest(requestData);

    // Detect bot detection
    requestData.botDetection = botDetector.detect(requestData);

    // Add to requests array
    requests.push(requestData);

    // Update UI
    applyFilters();
    updateStats();
  } catch (error) {
    console.error('Error processing request:', error);
  }
}

function handleFilterChange() {
  applyFilters();
}

function applyFilters() {
  const filterInput = document.getElementById('filterInput');
  const filterText = filterInput.value.trim();

  // Parse filter
  const parser = filterParser.parse(filterText);
  
  // Apply filters
  filteredRequests = requests.filter(request => {
    // Text/property filter
    if (parser && !parser.matches(request)) {
      return false;
    }

    // Session filter
    if (showOnlySessions && !request.session.isSession) {
      return false;
    }

    // Bot detection filter
    if (showOnlyBotDetection && !request.botDetection.isBotDetection) {
      return false;
    }

    return true;
  });

  renderTable();
  updateStats();
}

function renderTable() {
  const tbody = document.getElementById('requestsBody');
  tbody.innerHTML = '';

  filteredRequests.forEach((request, index) => {
    const row = createTableRow(request, index);
    tbody.appendChild(row);
  });
}

function createTableRow(request, index) {
  const row = document.createElement('tr');
  row.dataset.requestId = request.id;
  
  if (request.session.isSession) {
    row.classList.add('session-request');
  }
  
  if (request.botDetection.isBotDetection) {
    row.classList.add('bot-detection');
  }

  if (selectedRequest && selectedRequest.id === request.id) {
    row.classList.add('selected');
  }

  row.addEventListener('click', () => {
    selectedRequest = request;
    updateTableSelection();
    showRequestDetails(request);
  });

  // Name column
  const nameCell = document.createElement('td');
  const url = new URL(request.url);
  nameCell.textContent = url.pathname.split('/').pop() || url.pathname || url.hostname;
  nameCell.title = request.url;
  row.appendChild(nameCell);

  // Method column
  const methodCell = document.createElement('td');
  const methodSpan = document.createElement('span');
  methodSpan.className = `method method-${request.method}`;
  methodSpan.textContent = request.method;
  methodCell.appendChild(methodSpan);
  row.appendChild(methodCell);

  // Status column
  const statusCell = document.createElement('td');
  if (request.status > 0) {
    const statusSpan = document.createElement('span');
    statusSpan.className = 'status-code';
    const statusClass = 
      request.status >= 200 && request.status < 300 ? 'status-2xx' :
      request.status >= 300 && request.status < 400 ? 'status-3xx' :
      request.status >= 400 && request.status < 500 ? 'status-4xx' :
      'status-5xx';
    statusSpan.classList.add(statusClass);
    statusSpan.textContent = request.status;
    statusCell.appendChild(statusSpan);
  } else {
    statusCell.textContent = '-';
  }
  row.appendChild(statusCell);

  // Type column
  const typeCell = document.createElement('td');
  typeCell.textContent = request.type || 'other';
  row.appendChild(typeCell);

  // Size column
  const sizeCell = document.createElement('td');
  sizeCell.textContent = formatter.formatSize(request.size);
  row.appendChild(sizeCell);

  // Time column
  const timeCell = document.createElement('td');
  timeCell.textContent = formatter.formatTime(request.time);
  row.appendChild(timeCell);

  // Session column
  const sessionCell = document.createElement('td');
  if (request.session.isSession) {
    const badge = document.createElement('span');
    badge.className = 'session-badge';
    badge.textContent = 'Session';
    badge.title = request.session.reason;
    sessionCell.appendChild(badge);
  } else {
    sessionCell.textContent = '-';
  }
  row.appendChild(sessionCell);

  // Bot Detection column
  const botCell = document.createElement('td');
  if (request.botDetection.isBotDetection) {
    const badge = document.createElement('span');
    badge.className = 'bot-badge';
    badge.textContent = request.botDetection.confidence;
    badge.title = request.botDetection.indicators.join(', ');
    botCell.appendChild(badge);
  } else {
    botCell.textContent = '-';
  }
  row.appendChild(botCell);

  return row;
}

function updateTableSelection() {
  const rows = document.querySelectorAll('#requestsBody tr');
  rows.forEach(row => {
    if (selectedRequest && row.dataset.requestId === selectedRequest.id) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });
}

function showRequestDetails(request) {
  const panel = document.getElementById('detailsPanel');
  panel.classList.remove('hidden');

  // Title
  document.getElementById('detailsTitle').textContent = 
    new URL(request.url).pathname.split('/').pop() || request.url;

  // General
  const generalDiv = document.getElementById('detailsGeneral');
  generalDiv.textContent = `URL: ${request.url}
Method: ${request.method}
Status: ${request.status}
Type: ${request.type}
Size: ${formatter.formatSize(request.size)}
Time: ${formatter.formatTime(request.time)}
Timestamp: ${new Date(request.timestamp).toLocaleString()}`;

  // Request Headers
  const requestHeadersDiv = document.getElementById('detailsRequestHeaders');
  requestHeadersDiv.innerHTML = formatHeadersForDisplay(request.requestHeaders);

  // Response Headers
  const responseHeadersDiv = document.getElementById('detailsResponseHeaders');
  responseHeadersDiv.innerHTML = formatHeadersForDisplay(request.responseHeaders);

  // Cookies
  const cookiesDiv = document.getElementById('detailsCookies');
  if (request.cookies.length > 0 || request.setCookies.length > 0) {
    let html = '';
    
    if (request.cookies.length > 0) {
      html += '<div style="margin-bottom: 12px;"><strong>Request Cookies:</strong></div>';
      request.cookies.forEach(cookie => {
        html += `<div class="cookie-item">
          <div class="cookie-name">${escapeHtml(cookie.name)}</div>
          <div class="cookie-value">${escapeHtml(cookie.value)}</div>
        </div>`;
      });
    }
    
    if (request.setCookies.length > 0) {
      html += '<div style="margin-top: 16px; margin-bottom: 12px;"><strong>Set-Cookie Headers:</strong></div>';
      request.setCookies.forEach(cookie => {
        html += `<div class="cookie-item">
          <div class="cookie-name">${escapeHtml(cookie.name)}</div>
          <div class="cookie-value">${escapeHtml(cookie.value)}</div>
          <div style="font-size: 10px; color: #999; margin-top: 4px;">
            ${Object.entries(cookie.attributes).map(([k, v]) => 
              `${k}: ${v === true ? 'true' : escapeHtml(String(v))}`
            ).join(', ')}
          </div>
        </div>`;
      });
    }
    
    cookiesDiv.innerHTML = html;
  } else {
    cookiesDiv.textContent = 'No cookies';
  }

  // Session Analysis
  const sessionDiv = document.getElementById('detailsSession');
  if (request.session.isSession) {
    sessionDiv.innerHTML = `<div style="color: #ff9800; font-weight: 600; margin-bottom: 8px;">
      ✓ Session Request Detected
    </div>
    <div>Reason: ${escapeHtml(request.session.reason)}</div>`;
  } else {
    sessionDiv.textContent = 'No session indicators detected';
  }

  // Bot Detection Analysis
  const botDiv = document.getElementById('detailsBotDetection');
  if (request.botDetection.isBotDetection) {
    let html = `<div style="color: #f44336; font-weight: 600; margin-bottom: 8px;">
      ⚠ Bot Detection Detected (${request.botDetection.confidence} confidence)
    </div>
    <div style="margin-top: 8px;"><strong>Indicators:</strong></div>
    <ul style="margin-top: 4px; padding-left: 20px;">`;
    
    request.botDetection.indicators.forEach(indicator => {
      html += `<li style="margin-bottom: 4px;">${escapeHtml(indicator)}</li>`;
    });
    
    html += '</ul>';
    botDiv.innerHTML = html;
  } else {
    botDiv.textContent = 'No bot detection measures identified';
  }
}

function formatHeadersForDisplay(headers) {
  if (!headers || Object.keys(headers).length === 0) {
    return '<div style="color: #999;">No headers</div>';
  }

  let html = '';
  for (const [key, value] of Object.entries(headers)) {
    const val = Array.isArray(value) ? value.join(', ') : value;
    html += `<div class="header-row">
      <div class="header-name">${escapeHtml(key)}</div>
      <div class="header-value">${escapeHtml(String(val))}</div>
    </div>`;
  }
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateStats() {
  document.getElementById('totalRequests').textContent = `Total: ${requests.length}`;
  document.getElementById('filteredRequests').textContent = `Filtered: ${filteredRequests.length}`;
  
  const sessionCount = requests.filter(r => r.session.isSession).length;
  document.getElementById('sessionRequests').textContent = `Sessions: ${sessionCount}`;
  
  const botCount = requests.filter(r => r.botDetection.isBotDetection).length;
  document.getElementById('botDetection').textContent = `Bot Detection: ${botCount}`;
}

function clearRequests() {
  requests = [];
  filteredRequests = [];
  selectedRequest = null;
  renderTable();
  updateStats();
  document.getElementById('detailsPanel').classList.add('hidden');
}

function exportData() {
  const data = {
    exportDate: new Date().toISOString(),
    totalRequests: requests.length,
    requests: requests.map(r => ({
      url: r.url,
      method: r.method,
      status: r.status,
      type: r.type,
      size: r.size,
      time: r.time,
      timestamp: r.timestamp,
      requestHeaders: r.requestHeaders,
      responseHeaders: r.responseHeaders,
      cookies: r.cookies,
      setCookies: r.setCookies,
      session: r.session,
      botDetection: r.botDetection
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `network-analysis-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadSettings() {
  chrome.storage.local.get(['preserveLog', 'showOnlySessions', 'showOnlyBotDetection'], (result) => {
    if (result.preserveLog !== undefined) {
      preserveLog = result.preserveLog;
      document.getElementById('preserveLog').checked = preserveLog;
    }
    if (result.showOnlySessions !== undefined) {
      showOnlySessions = result.showOnlySessions;
      document.getElementById('showOnlySessions').checked = showOnlySessions;
    }
    if (result.showOnlyBotDetection !== undefined) {
      showOnlyBotDetection = result.showOnlyBotDetection;
      document.getElementById('showOnlyBotDetection').checked = showOnlyBotDetection;
    }
  });
}

function saveSettings() {
  chrome.storage.local.set({
    preserveLog,
    showOnlySessions,
    showOnlyBotDetection
  });
}

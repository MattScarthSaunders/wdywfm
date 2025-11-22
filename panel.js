// Main panel logic
let requests = [];
let filteredRequests = [];
let selectedRequest = null;
let preserveLog = true;
let showOnlySessions = false;
let showOnlyBotDetection = false;
let requestHeadersViewMode = 'json'; // 'json' or 'formatted'
let responseHeadersViewMode = 'formatted'; // 'json' or 'formatted' (default to formatted since that's current behavior)

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  startNetworkMonitoring();
  loadSettings();
  updateRequestHeadersToggleButton(); // Initialize toggle button state
  updateResponseHeadersToggleButton(); // Initialize toggle button state
  
  // Update panel width on window resize
  window.addEventListener('resize', () => {
    updateDetailsPanelWidth();
    constrainTableWidth();
  });
  
  // Constrain table width on initial load
  constrainTableWidth();
  
  // Initialize column resize after a short delay to ensure table is rendered
  setTimeout(() => {
    initializeColumnResize();
    initializePanelResize();
  }, 100);
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

  // Request headers view toggle
  document.getElementById('requestHeadersToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    requestHeadersViewMode = requestHeadersViewMode === 'json' ? 'formatted' : 'json';
    updateRequestHeadersToggleButton();
    // Re-render request headers if a request is selected
    if (selectedRequest) {
      renderRequestHeaders(selectedRequest);
    }
  });

  // Response headers view toggle
  document.getElementById('responseHeadersToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    responseHeadersViewMode = responseHeadersViewMode === 'json' ? 'formatted' : 'json';
    updateResponseHeadersToggleButton();
    // Re-render response headers if a request is selected
    if (selectedRequest) {
      renderResponseHeaders(selectedRequest);
    }
  });

  // Copy URL button
  document.getElementById('copyUrlBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!selectedRequest) return;
    
    const url = selectedRequest.url;
    (async () => {
      try {
        await navigator.clipboard.writeText(url);
        const copyBtn = e.target;
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          const copyBtn = e.target;
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch (err2) {
          console.error('Fallback copy failed:', err2);
        }
        document.body.removeChild(textArea);
      }
    })();
  });

  // Close details panel
  document.getElementById('closeDetails').addEventListener('click', () => {
    document.getElementById('detailsPanel').classList.add('hidden');
    selectedRequest = null;
    updateTableSelection();
  });

  // Event delegation for header expand/collapse and copy button
  const detailsPanel = document.getElementById('detailsPanel');
  detailsPanel.addEventListener('click', (e) => {
    if (e.target.classList.contains('header-expand')) {
      e.stopPropagation();
      const expandBtn = e.target;
      const headerId = expandBtn.dataset.id;
      const fullValue = expandBtn.dataset.full;
      const textSpan = document.getElementById(`${headerId}-text`);
      
      if (expandBtn.classList.contains('expanded')) {
        // Collapse
        textSpan.textContent = fullValue.substring(0, 100);
        expandBtn.textContent = '[...]';
        expandBtn.classList.remove('expanded');
      } else {
        // Expand
        textSpan.textContent = fullValue;
        expandBtn.textContent = '[collapse]';
        expandBtn.classList.add('expanded');
      }
    } else if (e.target.classList.contains('cookie-expand')) {
      e.stopPropagation();
      const expandBtn = e.target;
      const cookieId = expandBtn.dataset.id;
      const fullValue = expandBtn.dataset.full;
      const textSpan = document.getElementById(`${cookieId}-text`);
      
      if (expandBtn.classList.contains('expanded')) {
        // Collapse
        textSpan.innerHTML = fullValue.substring(0, 100);
        expandBtn.textContent = '[...]';
        expandBtn.classList.remove('expanded');
      } else {
        // Expand
        textSpan.innerHTML = fullValue;
        expandBtn.textContent = '[collapse]';
        expandBtn.classList.add('expanded');
      }
    } else if (e.target.classList.contains('copy-json-btn') || e.target.classList.contains('copy-json-btn-header')) {
      e.stopPropagation();
      const copyBtn = e.target;
      let jsonStr;
      
      // Get JSON from button data attribute or from section header
      if (copyBtn.dataset.json) {
        jsonStr = decodeURIComponent(copyBtn.dataset.json);
      } else {
        const sectionHeader = copyBtn.closest('.section-header');
        if (sectionHeader && sectionHeader.dataset.json) {
          jsonStr = decodeURIComponent(sectionHeader.dataset.json);
        } else {
          return;
        }
      }
      
      (async () => {
        try {
          await navigator.clipboard.writeText(jsonStr);
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = jsonStr;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.classList.remove('copied');
            }, 2000);
          } catch (err2) {
            console.error('Fallback copy failed:', err2);
          }
          document.body.removeChild(textArea);
        }
      })();
    } else if ((e.target.classList.contains('section-header') || e.target.closest('.section-header')) && 
               !e.target.classList.contains('copy-json-btn-header') && 
               !e.target.closest('.copy-json-btn-header') &&
               !e.target.classList.contains('toggle-view-btn') &&
               !e.target.closest('.toggle-view-btn')) {
      // Toggle section collapse (but not if clicking the copy button)
      const header = e.target.classList.contains('section-header') ? e.target : e.target.closest('.section-header');
      const section = header.closest('.details-section');
      const content = section.querySelector('.section-content');
      
      if (header.classList.contains('collapsed')) {
        // Expanding
        header.classList.remove('collapsed');
        content.classList.remove('collapsed');
        // Set max-height to actual content height
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        // Collapsing
        header.classList.add('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
        // Force reflow
        content.offsetHeight;
        content.classList.add('collapsed');
      }
    }
  });

  // Column resize functionality will be initialized in DOMContentLoaded
  // Panel resize functionality will be initialized in DOMContentLoaded
}

let isResizing = false;
let startX = 0;
let startNameWidth = 0;
let startOtherColumnsWidth = 0;
let handleMouseMove = null;
let handleMouseUp = null;

// Use event delegation for column resize
document.addEventListener('mousedown', (e) => {
  const resizeHandle = e.target.closest('.resize-handle[data-column="name"]');
  if (!resizeHandle) return;
  
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  isResizing = true;
  startX = e.clientX;
  const nameHeader = document.querySelector('.col-name');
  const table = nameHeader?.closest('table');
  const tableContainer = table?.closest('.table-container');
  
  if (!nameHeader || !table || !tableContainer) {
    isResizing = false;
    return;
  }
  
  // Ensure table width matches container
  const containerWidth = tableContainer.getBoundingClientRect().width;
  table.style.width = `${containerWidth}px`;
  
  // Get current widths
  const nameRect = nameHeader.getBoundingClientRect();
  startNameWidth = nameRect.width;
  
  // Calculate total width of other columns and store original widths
  const allHeaders = Array.from(table.querySelectorAll('thead th'));
  let otherColumnsWidth = 0;
  allHeaders.forEach(header => {
    if (!header.classList.contains('col-name')) {
      const width = header.getBoundingClientRect().width;
      header.dataset.originalWidth = width;
      otherColumnsWidth += width;
    }
  });
  startOtherColumnsWidth = otherColumnsWidth;
  
  resizeHandle.classList.add('active');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  // Create handlers
  handleMouseMove = (moveEvent) => {
    if (!isResizing) return;
    
    moveEvent.preventDefault();
    const diff = moveEvent.clientX - startX;
    
    const containerWidth = tableContainer.getBoundingClientRect().width;
    const minNameWidth = 200;
    const maxNameWidth = containerWidth - 300;
    
    let newNameWidth = Math.max(minNameWidth, Math.min(maxNameWidth, startNameWidth + diff));
    const remainingWidth = containerWidth - newNameWidth;
    
    const allHeaders = Array.from(table.querySelectorAll('thead th')).filter(h => !h.classList.contains('col-name'));
    
    nameHeader.style.width = `${newNameWidth}px`;
    nameHeader.style.minWidth = `${newNameWidth}px`;
    
    if (startOtherColumnsWidth > 0 && allHeaders.length > 0) {
      allHeaders.forEach(header => {
        const originalWidth = parseFloat(header.dataset.originalWidth || header.getBoundingClientRect().width);
        const proportion = originalWidth / startOtherColumnsWidth;
        const newWidth = Math.max(50, remainingWidth * proportion);
        header.style.width = `${newWidth}px`;
        header.style.minWidth = `${newWidth}px`;
      });
    }
    
    table.style.width = `${containerWidth}px`;
    updateDetailsPanelWidth();
  };
  
  handleMouseUp = () => {
    if (isResizing) {
      isResizing = false;
      resizeHandle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (handleMouseMove) {
        document.removeEventListener('mousemove', handleMouseMove);
        handleMouseMove = null;
      }
      if (handleMouseUp) {
        document.removeEventListener('mouseup', handleMouseUp);
        handleMouseUp = null;
      }
    }
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
});

function initializeColumnResize() {
  // Handlers are now attached via event delegation above
}

let isPanelResizing = false;
let panelStartX = 0;
let panelStartWidth = 0;
let handlePanelMouseMove = null;
let handlePanelMouseUp = null;

// Use event delegation for panel resize
document.addEventListener('mousedown', (e) => {
  const resizeHandle = e.target.closest('.panel-resize-handle');
  if (!resizeHandle) return;
  
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  isPanelResizing = true;
  panelStartX = e.clientX;
  const panel = document.getElementById('detailsPanel');
  
  if (!panel || panel.classList.contains('hidden')) {
    isPanelResizing = false;
    return;
  }
  
  const rect = panel.getBoundingClientRect();
  panelStartWidth = rect.width;
  
  resizeHandle.classList.add('active');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  // Create handlers
  handlePanelMouseMove = (moveEvent) => {
    if (!isPanelResizing) return;
    
    moveEvent.preventDefault();
    const diff = panelStartX - moveEvent.clientX; // Inverted because panel is on the right
    
    if (!panel || panel.classList.contains('hidden')) return;
    
    const minWidth = 300;
    const maxWidth = window.innerWidth * 0.9;
    
    let newWidth = Math.max(minWidth, Math.min(maxWidth, panelStartWidth + diff));
    
    panel.style.width = `${newWidth}px`;
    panel.dataset.manuallyResized = 'true';
  };
  
  handlePanelMouseUp = () => {
    if (isPanelResizing) {
      isPanelResizing = false;
      resizeHandle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (handlePanelMouseMove) {
        document.removeEventListener('mousemove', handlePanelMouseMove);
        handlePanelMouseMove = null;
      }
      if (handlePanelMouseUp) {
        document.removeEventListener('mouseup', handlePanelMouseUp);
        handlePanelMouseUp = null;
      }
    }
  };
  
  document.addEventListener('mousemove', handlePanelMouseMove);
  document.addEventListener('mouseup', handlePanelMouseUp);
});

function initializePanelResize() {
  // Handlers are now attached via event delegation above
}

function constrainTableWidth() {
  const table = document.querySelector('.requests-table');
  const tableContainer = document.querySelector('.table-container');
  
  if (!table || !tableContainer) return;
  
  const containerWidth = tableContainer.getBoundingClientRect().width;
  table.style.width = `${containerWidth}px`;
  table.style.maxWidth = `${containerWidth}px`;
}

function updateDetailsPanelWidth() {
  const panel = document.getElementById('detailsPanel');
  if (panel.classList.contains('hidden')) return;

  const tableContainer = document.querySelector('.table-container');
  const nameHeader = document.querySelector('.col-name');
  
  if (!tableContainer || !nameHeader) return;

  const containerWidth = tableContainer.offsetWidth;
  const nameColumnWidth = nameHeader.offsetWidth;
  
  // If panel has been manually resized, don't override it unless it exceeds constraints
  const currentPanelWidth = panel.offsetWidth;
  const minWidth = 300;
  const maxWidth = Math.min(containerWidth, nameColumnWidth, window.innerWidth * 0.9);
  
  // Only update if current width is outside valid range or if it's the default width
  if (currentPanelWidth < minWidth || currentPanelWidth > maxWidth || !panel.dataset.manuallyResized) {
    const panelWidth = Math.min(containerWidth, nameColumnWidth);
    panel.style.width = `${panelWidth}px`;
  }
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

    // Extract request headers (normalize to lowercase for consistent access)
    if (request.request.headers) {
      for (const header of request.request.headers) {
        const headerName = header.name.toLowerCase();
        // Store both original and normalized versions
        requestData.requestHeaders[header.name] = header.value;
        requestData.requestHeaders[headerName] = header.value;
      }
    }

    // Parse cookies (try both case variations)
    const cookieHeader = requestData.requestHeaders['cookie'] || requestData.requestHeaders['Cookie'];
    if (cookieHeader) {
      requestData.cookies = cookieParser.parseCookie(cookieHeader);
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
  updateTableSelection(); // Update highlighting after filtering
}

function renderTable() {
  const tbody = document.getElementById('requestsBody');
  tbody.innerHTML = '';

  filteredRequests.forEach((request, index) => {
    const row = createTableRow(request, index);
    tbody.appendChild(row);
  });
  
  // Ensure table width is constrained after rendering
  setTimeout(constrainTableWidth, 0);
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

  // Note: selected, cookie-source, and cookie-recipient classes are added in updateTableSelection()

  row.addEventListener('click', () => {
    selectedRequest = request;
    updateTableSelection();
    showRequestDetails(request);
    // Force a re-render to ensure highlighting is applied
    setTimeout(updateTableSelection, 0);
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

function findCookieSourceRequests(request) {
  // Find requests that set cookies used by this request
  const sourceRequestIds = new Set();
  
  // Check what cookies the request has
  if (!request.cookies || !Array.isArray(request.cookies) || request.cookies.length === 0) {
    return sourceRequestIds;
  }
  
  // Extract cookie names from request cookies (normalized)
  const cookieNames = new Set();
  request.cookies.forEach(cookie => {
    if (cookie && cookie.name && typeof cookie.name === 'string' && cookie.name.trim()) {
      const name = cookie.name.trim().toLowerCase();
      if (name.length > 0) {
        cookieNames.add(name);
      }
    }
  });
  
  if (cookieNames.size === 0) {
    return sourceRequestIds;
  }
  
  // Check all requests (use index as fallback if timestamps are the same)
  const requestIndex = requests.findIndex(r => String(r.id) === String(request.id));
  if (requestIndex === -1) return sourceRequestIds;
  
  // Check all earlier requests
  for (let i = 0; i < requestIndex; i++) {
    const req = requests[i];
    if (!req) continue;
    if (String(req.id) === String(request.id)) continue;
    if (!req.setCookies || !Array.isArray(req.setCookies) || req.setCookies.length === 0) continue;
    
    // Check if this request sets any cookies that the selected request uses
    req.setCookies.forEach(setCookie => {
      if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
        const setName = setCookie.name.trim().toLowerCase();
        if (setName.length > 0 && cookieNames.has(setName)) {
          sourceRequestIds.add(String(req.id));
        }
      }
    });
  }
  
  return sourceRequestIds;
}

function findCookieRecipientRequests(request) {
  // Find requests that use cookies set by this request
  const recipientRequestIds = new Set();
  
  // Check what cookies this request sets
  if (!request.setCookies || !Array.isArray(request.setCookies) || request.setCookies.length === 0) {
    return recipientRequestIds;
  }
  
  // Extract cookie names from set-cookie headers
  const cookieNames = new Set();
  request.setCookies.forEach(setCookie => {
    if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
      const name = setCookie.name.trim().toLowerCase();
      if (name.length > 0) {
        cookieNames.add(name);
      }
    }
  });
  
  if (cookieNames.size === 0) {
    return recipientRequestIds;
  }
  
  // Check all requests (use index as fallback if timestamps are the same)
  const requestIndex = requests.findIndex(r => String(r.id) === String(request.id));
  if (requestIndex === -1) return recipientRequestIds;
  
  // Check all later requests
  let checkedCount = 0;
  let withCookiesCount = 0;
  const sampleCookieNames = [];
  const matchingDetails = []; // Track which cookies matched
  let nextRequestCookies = null; // Debug: check the immediate next request
  for (let i = requestIndex + 1; i < requests.length; i++) {
    const req = requests[i];
    if (!req) continue;
    if (String(req.id) === String(request.id)) continue;
    checkedCount++;
    
    // Debug: capture the immediate next request's cookies
    if (i === requestIndex + 1 && req.cookies && Array.isArray(req.cookies)) {
      nextRequestCookies = req.cookies
        .filter(c => c && c.name && typeof c.name === 'string' && c.name.trim())
        .map(c => c.name.trim().toLowerCase());
    }
    
    if (!req.cookies || !Array.isArray(req.cookies) || req.cookies.length === 0) continue;
    withCookiesCount++;
    
    // Collect sample cookie names for debugging (first 3 requests with cookies)
    if (sampleCookieNames.length < 3 && req.cookies.length > 0) {
      const reqCookieNames = req.cookies
        .filter(c => c && c.name && typeof c.name === 'string' && c.name.trim())
        .map(c => c.name.trim().toLowerCase())
        .slice(0, 10); // Show more cookies
      if (reqCookieNames.length > 0) {
        sampleCookieNames.push(reqCookieNames.join(','));
      }
    }
    
    // Check if this request uses any cookies that the selected request sets
    req.cookies.forEach(cookie => {
      if (cookie && cookie.name && typeof cookie.name === 'string' && cookie.name.trim()) {
        const cookieName = cookie.name.trim().toLowerCase();
        if (cookieName.length > 0 && cookieNames.has(cookieName)) {
          recipientRequestIds.add(String(req.id));
          // Track what matched
          if (matchingDetails.length < 3) {
            matchingDetails.push(`${req.id}:${cookieName}`);
          }
        }
      }
    });
  }
  
  // Store debug info
  request._recipientDebug = {
    cookieNames: Array.from(cookieNames),
    checkedCount,
    withCookiesCount,
    foundIds: Array.from(recipientRequestIds),
    sampleCookieNames,
    matchingDetails,
    nextRequestCookies: nextRequestCookies || []
  };
  
  return recipientRequestIds;
}

function updateTableSelection() {
  const rows = document.querySelectorAll('#requestsBody tr');
  
  if (!selectedRequest) {
    // Clear all highlighting if nothing is selected
    rows.forEach(row => {
      row.classList.remove('selected', 'cookie-source', 'cookie-recipient');
    });
    return;
  }
  
  // Find the actual request object from the requests array to ensure we have the latest data
  const actualRequest = requests.find(r => String(r.id) === String(selectedRequest.id));
  if (!actualRequest) {
    // If not found, use selectedRequest as fallback
    const sourceRequestIds = findCookieSourceRequests(selectedRequest);
    const recipientRequestIds = findCookieRecipientRequests(selectedRequest);
    
    rows.forEach(row => {
      const requestId = String(row.dataset.requestId);
      const selectedId = String(selectedRequest.id);
      
      row.classList.remove('selected', 'cookie-source', 'cookie-recipient');
      
      if (requestId === selectedId) {
        row.classList.add('selected');
      } else if (sourceRequestIds.has(requestId)) {
        row.classList.add('cookie-source');
      } else if (recipientRequestIds.has(requestId)) {
        row.classList.add('cookie-recipient');
      }
    });
    return;
  }
  
  const sourceRequestIds = findCookieSourceRequests(actualRequest);
  const recipientRequestIds = findCookieRecipientRequests(actualRequest);
  
  // Add data attributes for debugging
  if (sourceRequestIds.size > 0 || recipientRequestIds.size > 0) {
    actualRequest._cookieSources = Array.from(sourceRequestIds);
    actualRequest._cookieRecipients = Array.from(recipientRequestIds);
  }
  
  rows.forEach(row => {
    const requestId = String(row.dataset.requestId);
    const selectedId = String(actualRequest.id);
    
    // Remove all selection-related classes
    row.classList.remove('selected', 'cookie-source', 'cookie-recipient');
    
    if (requestId === selectedId) {
      row.classList.add('selected');
      row.style.removeProperty('background');
      row.style.removeProperty('border-left');
    } else if (sourceRequestIds.has(requestId)) {
      row.classList.add('cookie-source');
      row.setAttribute('title', 'Cookie source: Sets cookies used by selected request');
      // Force style application with inline styles
      row.style.cssText += 'background: #e8f5e9 !important; border-left: 3px solid #4caf50 !important;';
    } else if (recipientRequestIds.has(requestId)) {
      row.classList.add('cookie-recipient');
      row.setAttribute('title', 'Cookie recipient: Uses cookies set by selected request');
      // Force style application with inline styles
      row.style.cssText += 'background: #f3e5f5 !important; border-left: 3px solid #9c27b0 !important;';
    } else {
      row.removeAttribute('title');
      // Clear inline styles if not a cookie-related row
      row.style.removeProperty('background');
      row.style.removeProperty('border-left');
    }
  });
}

function showRequestDetails(request) {
  const panel = document.getElementById('detailsPanel');
  panel.classList.remove('hidden');

  // Update panel width
  updateDetailsPanelWidth();

  // Initialize section max-heights
  setTimeout(() => {
    document.querySelectorAll('.section-content').forEach(content => {
      if (!content.classList.contains('collapsed')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
    // Ensure highlighting is applied after panel is shown
    updateTableSelection();
  }, 0);
  
  // Also update highlighting immediately and after a short delay
  updateTableSelection();
  setTimeout(updateTableSelection, 50);

  // Title
  const titleText = new URL(request.url).pathname.split('/').pop() || request.url;
  
  // Debug: Show cookie relationships in title
  const sourceIds = findCookieSourceRequests(request);
  const recipientIds = findCookieRecipientRequests(request);
  const cookieCount = request.cookies ? request.cookies.length : 0;
  const setCookieCount = request.setCookies ? request.setCookies.length : 0;
  
  // Show cookie names for debugging (first 3, normalized)
  const cookieNames = request.cookies && request.cookies.length > 0 
    ? request.cookies.filter(c => c && c.name && c.name.trim()).map(c => c.name.trim().toLowerCase()).slice(0, 3).join(', ') 
    : 'none';
  const setCookieNames = request.setCookies && request.setCookies.length > 0
    ? request.setCookies.filter(c => c && c.name && c.name.trim()).map(c => c.name.trim().toLowerCase()).slice(0, 3).join(', ')
    : 'none';
  
  // Show which request IDs were found and total requests checked
  const sourceIdList = sourceIds.size > 0 ? Array.from(sourceIds).slice(0, 3).join(',') : 'none';
  const recipientIdList = recipientIds.size > 0 ? Array.from(recipientIds).slice(0, 3).join(',') : 'none';
  const totalRequests = requests.length;
  const requestIndex = requests.findIndex(r => String(r.id) === String(request.id));
  
  // Add debug info for recipients
  let recipientDebug = '';
  if (request._recipientDebug) {
    recipientDebug = ` | checked:${request._recipientDebug.checkedCount} w/cookies:${request._recipientDebug.withCookiesCount}`;
    if (request._recipientDebug.cookieNames && request._recipientDebug.cookieNames.length > 0) {
      recipientDebug += ` lookingFor:${request._recipientDebug.cookieNames.join(',')}`;
    }
    if (request._recipientDebug.nextRequestCookies && request._recipientDebug.nextRequestCookies.length > 0) {
      recipientDebug += ` nextReq:${request._recipientDebug.nextRequestCookies.join(',')}`;
    }
    if (request._recipientDebug.sampleCookieNames && request._recipientDebug.sampleCookieNames.length > 0) {
      recipientDebug += ` samples:${request._recipientDebug.sampleCookieNames.join(';')}`;
    }
    if (request._recipientDebug.matchingDetails && request._recipientDebug.matchingDetails.length > 0) {
      recipientDebug += ` matched:${request._recipientDebug.matchingDetails.join(';')}`;
    }
  }
  
  document.getElementById('detailsTitle').textContent = 
    `${titleText} [idx:${requestIndex}/${totalRequests} | ${cookieCount} req: ${cookieNames}... | ${setCookieCount} set: ${setCookieNames}... | ${sourceIds.size} sources(${sourceIdList}), ${recipientIds.size} recipients(${recipientIdList})${recipientDebug}]`;

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
  renderRequestHeaders(request);
  
  // Store JSON string for copy button
  const requestHeadersSection = document.querySelector('[data-section="requestHeaders"]');
  if (requestHeadersSection) {
    const jsonStr = JSON.stringify(request.requestHeaders, null, 2);
    requestHeadersSection.dataset.json = encodeURIComponent(jsonStr);
  }
  
  // Update toggle button state
  updateRequestHeadersToggleButton();

  // Response Headers
  renderResponseHeaders(request);
  
  // Store JSON string for copy button
  const responseHeadersSection = document.querySelector('[data-section="responseHeaders"]');
  if (responseHeadersSection) {
    const jsonStr = JSON.stringify(request.responseHeaders, null, 2);
    responseHeadersSection.dataset.json = encodeURIComponent(jsonStr);
  }
  
  // Update toggle button state
  updateResponseHeadersToggleButton();

  // Set-Cookies
  const cookiesDiv = document.getElementById('detailsCookies');
  if (request.setCookies.length > 0) {
    let html = '';
    
    request.setCookies.forEach(cookie => {
      const cookieName = escapeHtml(cookie.name);
      const cookieValueRaw = cookie.value;
      const cookieValueEscaped = escapeHtml(cookieValueRaw);
      const isLongValue = cookieValueRaw.length > 100;
      const truncatedValue = isLongValue ? cookieValueEscaped.substring(0, 100) : cookieValueEscaped;
      const cookieId = `cookie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      html += `<div class="cookie-item">
        <div class="cookie-header">
          <div class="cookie-name" title="${cookieName}">${cookieName}</div>
          <div class="cookie-value">
            <span class="cookie-value-text" id="${cookieId}-text">${truncatedValue}</span>
            ${isLongValue ? `<span class="cookie-expand" id="${cookieId}-expand" data-full="${escapeHtml(cookieValueRaw)}" data-id="${cookieId}">[...]</span>` : ''}
          </div>
        </div>
        <div class="cookie-attributes">
          ${Object.entries(cookie.attributes).map(([k, v]) => 
            `${k}: ${v === true ? 'true' : escapeHtml(String(v))}`
          ).join(', ')}
        </div>
      </div>`;
    });
    
    cookiesDiv.innerHTML = html;
  } else {
    cookiesDiv.textContent = 'No set-cookies';
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
    </div>`;
    
    // Show matched providers
    if (request.botDetection.providers && request.botDetection.providers.length > 0) {
      html += `<div style="margin-top: 12px; margin-bottom: 8px;"><strong>Matched Providers:</strong></div>
      <div style="margin-bottom: 12px;">`;
      
      request.botDetection.providers.forEach(provider => {
        html += `<span class="provider-badge" style="display: inline-block; padding: 4px 8px; margin: 2px 4px 2px 0; background: #e3f2fd; color: #1976d2; border-radius: 4px; font-size: 10px; font-weight: 500;">${escapeHtml(provider)}</span>`;
      });
      
      html += `</div>`;
    }
    
    // Show indicators
    if (request.botDetection.indicators && request.botDetection.indicators.length > 0) {
      html += `<div style="margin-top: 8px;"><strong>Indicators:</strong></div>
      <ul style="margin-top: 4px; padding-left: 20px;">`;
      
      request.botDetection.indicators.forEach(indicator => {
        html += `<li style="margin-bottom: 4px;">${escapeHtml(indicator)}</li>`;
      });
      
      html += '</ul>';
    }
    
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
    const valStr = String(val);
    const isLong = valStr.length > 100;
    const truncatedVal = isLong ? valStr.substring(0, 100) : valStr;
    const headerId = `header-${key.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    html += `<div class="header-row">
      <div class="header-name">${escapeHtml(key)}</div>
      <div class="header-value">
        <span class="header-value-text" id="${headerId}-text">${escapeHtml(truncatedVal)}</span>
        ${isLong ? `<span class="header-expand" id="${headerId}-expand" data-full="${escapeHtml(valStr)}" data-id="${headerId}">[...]</span>` : ''}
      </div>
    </div>`;
  }
  
  return html;
}

function formatRequestHeadersAsJSON(headers) {
  if (!headers || Object.keys(headers).length === 0) {
    return '<div style="color: #999;">No headers</div>';
  }

  const jsonStr = JSON.stringify(headers, null, 2);
  
  let html = `<pre class="json-display">${escapeHtml(jsonStr)}</pre>`;
  
  return html;
}

function renderRequestHeaders(request) {
  const requestHeadersDiv = document.getElementById('detailsRequestHeaders');
  const sectionContent = requestHeadersDiv.closest('.section-content');
  const isCollapsed = sectionContent && sectionContent.classList.contains('collapsed');
  
  if (requestHeadersViewMode === 'formatted') {
    // Filter out lowercase duplicates to avoid showing the same header twice
    const cleanedHeaders = {};
    const seenLowercase = new Set();
    for (const [key, value] of Object.entries(request.requestHeaders)) {
      const lowerKey = key.toLowerCase();
      // Only include if it's the original case version (not a lowercase duplicate)
      // or if we haven't seen this lowercase key before
      if (key === lowerKey || !seenLowercase.has(lowerKey)) {
        cleanedHeaders[key] = value;
        seenLowercase.add(lowerKey);
      }
    }
    requestHeadersDiv.innerHTML = formatHeadersForDisplay(cleanedHeaders);
  } else {
    requestHeadersDiv.innerHTML = formatRequestHeadersAsJSON(request.requestHeaders);
  }
  
  // Recalculate maxHeight if section is expanded to ensure all content is visible
  if (sectionContent && !isCollapsed) {
    // Use setTimeout to ensure DOM has updated, then set a very large max-height
    // to allow all content to be visible (we use a large value instead of exact
    // calculation to handle dynamic content changes)
    setTimeout(() => {
      sectionContent.style.maxHeight = '9999px';
    }, 0);
  }
}

function renderResponseHeaders(request) {
  const responseHeadersDiv = document.getElementById('detailsResponseHeaders');
  const sectionContent = responseHeadersDiv.closest('.section-content');
  const isCollapsed = sectionContent && sectionContent.classList.contains('collapsed');
  
  if (responseHeadersViewMode === 'formatted') {
    responseHeadersDiv.innerHTML = formatHeadersForDisplay(request.responseHeaders);
  } else {
    responseHeadersDiv.innerHTML = formatRequestHeadersAsJSON(request.responseHeaders);
  }
  
  // Recalculate maxHeight if section is expanded to ensure all content is visible
  if (sectionContent && !isCollapsed) {
    // Use setTimeout to ensure DOM has updated, then set a very large max-height
    // to allow all content to be visible (we use a large value instead of exact
    // calculation to handle dynamic content changes)
    setTimeout(() => {
      sectionContent.style.maxHeight = '9999px';
    }, 0);
  }
}

function updateRequestHeadersToggleButton() {
  const toggleBtn = document.getElementById('requestHeadersToggle');
  if (toggleBtn) {
    toggleBtn.textContent = requestHeadersViewMode === 'json' ? 'Formatted' : 'JSON';
    toggleBtn.title = requestHeadersViewMode === 'json' 
      ? 'Switch to formatted view' 
      : 'Switch to JSON view';
  }
}

function updateResponseHeadersToggleButton() {
  const toggleBtn = document.getElementById('responseHeadersToggle');
  if (toggleBtn) {
    toggleBtn.textContent = responseHeadersViewMode === 'json' ? 'Formatted' : 'JSON';
    toggleBtn.title = responseHeadersViewMode === 'json' 
      ? 'Switch to formatted view' 
      : 'Switch to JSON view';
  }
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

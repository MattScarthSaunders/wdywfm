<template>
  <div id="detailsPanel" class="details-panel">
    <div class="panel-resize-handle"></div>
    <div class="details-header">
      <h2 id="detailsTitle">{{ requestTitle }}</h2>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>
    <div class="details-content">
      <DetailsSection title="General" :collapsed="false">
        <div id="detailsGeneral">{{ generalInfo }}</div>
        <button @click="copyUrl" class="copy-json-btn-header" title="Copy URL to clipboard">Copy URL</button>
      </DetailsSection>
      
      <DetailsSection title="Request Headers" :collapsed="false">
        <template #header-actions>
          <label class="checkbox-label-inline">
            <input 
              type="checkbox" 
              :checked="gradeHeaderImportance"
              @change="$emit('update:gradeHeaderImportance', ($event.target as HTMLInputElement).checked)"
            /> 
            Grade importance
          </label>
          <button 
            @click="requestHeadersViewMode = requestHeadersViewMode === 'json' ? 'formatted' : 'json'"
            class="toggle-view-btn"
          >
            {{ requestHeadersViewMode === 'json' ? 'Formatted' : 'JSON' }}
          </button>
          <button @click="copyRequestHeaders" class="copy-json-btn-header">Copy JSON</button>
        </template>
        <div 
          id="detailsRequestHeaders" 
          v-html="formattedRequestHeaders"
        ></div>
      </DetailsSection>
      
      <DetailsSection title="Payload" :collapsed="false">
        <template #header-actions>
          <button @click="copyPayload" class="copy-json-btn-header">Copy JSON</button>
        </template>
        <div id="detailsPayload" v-html="formattedPayload"></div>
      </DetailsSection>
      
      <DetailsSection title="Response Headers" :collapsed="false">
        <template #header-actions>
          <button 
            @click="responseHeadersViewMode = responseHeadersViewMode === 'json' ? 'formatted' : 'json'"
            class="toggle-view-btn"
          >
            {{ responseHeadersViewMode === 'json' ? 'Formatted' : 'JSON' }}
          </button>
          <button @click="copyResponseHeaders" class="copy-json-btn-header">Copy JSON</button>
        </template>
        <div id="detailsResponseHeaders" v-html="formattedResponseHeaders"></div>
      </DetailsSection>
      
      <DetailsSection title="Set-Cookies" :collapsed="false">
        <div id="detailsCookies" v-html="formattedCookies"></div>
      </DetailsSection>
      
      <DetailsSection title="Session Analysis" :collapsed="false">
        <div id="detailsSession" v-html="formattedSession"></div>
      </DetailsSection>
      
      <DetailsSection title="Bot Detection Analysis" :collapsed="false">
        <div id="detailsBotDetection" v-html="formattedBotDetection"></div>
      </DetailsSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import type { NetworkRequest } from '../types';
import { formatter } from '../utils';
import DetailsSection from './DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
  allRequests: NetworkRequest[];
  gradeHeaderImportance: boolean;
}>();

defineEmits<{
  'update:gradeHeaderImportance': [value: boolean];
  'close': [];
}>();

const requestHeadersViewMode = ref<'json' | 'formatted'>('formatted');
const responseHeadersViewMode = ref<'json' | 'formatted'>('formatted');

const requestTitle = computed(() => {
  const requestId = props.request.requestNumber || '?';
  let requestName: string;
  try {
    const url = new URL(props.request.url);
    requestName = url.pathname.split('/').pop() || props.request.url;
  } catch {
    requestName = props.request.url;
  }
  return `${requestId}: ${requestName}`;
});

const generalInfo = computed(() => {
  return `URL: ${props.request.url}
Method: ${props.request.method}
Status: ${props.request.status}
Type: ${props.request.type}
Size: ${formatter.formatSize(props.request.size)}
Time: ${formatter.formatTime(props.request.time)}
Timestamp: ${new Date(props.request.timestamp).toLocaleString()}`;
});

const formattedRequestHeaders = computed(() => {
  if (requestHeadersViewMode.value === 'json') {
    return formatHeadersAsJSON(props.request.requestHeaders);
  } else {
    return formatHeadersForDisplay(props.request.requestHeaders, props.gradeHeaderImportance);
  }
});

const formattedResponseHeaders = computed(() => {
  if (responseHeadersViewMode.value === 'json') {
    return formatHeadersAsJSON(props.request.responseHeaders);
  } else {
    return formatHeadersForDisplay(props.request.responseHeaders, props.gradeHeaderImportance);
  }
});

const formattedPayload = computed(() => {
  return formatPayload(props.request);
});

const formattedCookies = computed(() => {
  return formatCookies(props.request.setCookies);
});

const formattedSession = computed(() => {
  if (props.request.session.isSession) {
    return `<div style="color: #ff9800; font-weight: 600; margin-bottom: 8px;">
      ✓ Session Request Detected
    </div>
    <div>Reason: ${escapeHtml(props.request.session.reason || '')}</div>`;
  } else {
    return 'No session indicators detected';
  }
});

const formattedBotDetection = computed(() => {
  if (props.request.botDetection.isBotDetection) {
    let html = `<div style="color: #f44336; font-weight: 600; margin-bottom: 8px;">
      ⚠ Bot Detection Detected (${props.request.botDetection.confidence} confidence)
    </div>`;
    
    if (props.request.botDetection.providers && props.request.botDetection.providers.length > 0) {
      html += `<div style="margin-top: 12px; margin-bottom: 8px;"><strong>Matched Providers:</strong></div>
      <div style="margin-bottom: 12px;">`;
      props.request.botDetection.providers.forEach(provider => {
        html += `<span class="provider-badge" style="display: inline-block; padding: 4px 8px; margin: 2px 4px 2px 0; background: #e3f2fd; color: #1976d2; border-radius: 4px; font-size: 10px; font-weight: 500;">${escapeHtml(provider)}</span>`;
      });
      html += `</div>`;
    }
    
    if (props.request.botDetection.indicators && props.request.botDetection.indicators.length > 0) {
      html += `<div style="margin-top: 8px;"><strong>Indicators:</strong></div>
      <ul style="margin-top: 4px; padding-left: 20px;">`;
      props.request.botDetection.indicators.forEach(indicator => {
        html += `<li style="margin-bottom: 4px;">${escapeHtml(indicator)}</li>`;
      });
      html += '</ul>';
    }
    
    return html;
  } else {
    return 'No bot detection measures identified';
  }
});

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getHeaderImportance(headerName: string): string {
  if (!headerName) return 'unknown';
  const normalizedName = headerName.toLowerCase();
  
  if (normalizedName.startsWith('sec-ch')) {
    return 'required';
  }
  
  if (normalizedName.includes('ssgtoken') || 
      normalizedName.includes('ssotoken') ||
      normalizedName.includes('sso-token') ||
      normalizedName.includes('ssg-token')) {
    return 'required';
  }
  
  const requiredHeaders = [
    'host', 'cf-ray', 'cf-connecting-ip', 'cf-visitor', 'cf-ipcountry',
    'x-datadome', 'x-px', 'x-iinfo', 'x-cdn', 'x-akamai', 'x-amz-cf',
    'x-fastly', 'x-sucuri', 'x-f5', 'x-barracuda', 'x-shape', 'x-human',
    'x-kpsdk', 'x-radware', 'g-recaptcha', 'x-vercel-id', 'x-vercel',
    'x-amzn', 'x-azure', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
    'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-user', 'sec-fetch-dest',
    'user-agent', 'x-forwarded-for', 'x-real-ip', 'via', 'server'
  ];
  
  const optionalHeaders = [
    'accept', 'accept-language', 'accept-encoding', 'accept-charset',
    'referer', 'referrer-policy', 'cookie', 'authorization', 'content-type',
    'content-length', 'content-encoding', 'connection', 'cache-control',
    'if-modified-since', 'if-none-match', 'if-match', 'if-range', 'range',
    'origin', 'dnt', 'upgrade-insecure-requests', 'expect', 'te', 'trailer',
    'transfer-encoding', 'warning', 'x-requested-with', 'x-forwarded-proto',
    'x-forwarded-host'
  ];
  
  if (requiredHeaders.includes(normalizedName)) {
    return 'required';
  } else if (optionalHeaders.includes(normalizedName)) {
    return 'optional';
  } else {
    return 'unknown';
  }
}

function formatHeadersForDisplay(headers: Record<string, string | string[]>, gradeImportance: boolean): string {
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
    
    const importanceClass = gradeImportance ? `header-${getHeaderImportance(key)}` : '';
    
    html += `<div class="header-row ${importanceClass}">
      <div class="header-name ${importanceClass}">${escapeHtml(key)}</div>
      <div class="header-value ${importanceClass}">
        <span class="header-value-text" id="${headerId}-text">${escapeHtml(truncatedVal)}</span>
        ${isLong ? `<span class="header-expand" id="${headerId}-expand" data-full="${escapeHtml(valStr)}" data-id="${headerId}">[...]</span>` : ''}
      </div>
    </div>`;
  }
  
  return html;
}

function formatHeadersAsJSON(headers: Record<string, string | string[]>): string {
  if (!headers || Object.keys(headers).length === 0) {
    return '<div style="color: #999;">No headers</div>';
  }
  const jsonStr = JSON.stringify(headers, null, 2);
  return `<pre class="json-display">${escapeHtml(jsonStr)}</pre>`;
}

function formatPayload(request: NetworkRequest): string {
  let html = '';
  let hasContent = false;
  
  try {
    const url = new URL(request.url);
    if (url.search) {
      const queryParams = new URLSearchParams(url.search);
      if (queryParams.toString()) {
        hasContent = true;
        html += '<div class="payload-section"><div class="payload-section-title">Query String Parameters</div><div class="payload-table">';
        for (const [key, value] of queryParams.entries()) {
          html += `<div class="payload-row"><div class="payload-key">${escapeHtml(key)}</div><div class="payload-value">${escapeHtml(value)}</div></div>`;
        }
        html += '</div></div>';
      }
    }
  } catch (e) {
    // Invalid URL
  }
  
  if (request.postData) {
    hasContent = true;
    const contentType = (request.requestHeaders['content-type'] || '').toLowerCase();
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      html += '<div class="payload-section"><div class="payload-section-title">Form Data</div><div class="payload-table">';
      try {
        const params = new URLSearchParams(request.postData);
        for (const [key, value] of params.entries()) {
          html += `<div class="payload-row"><div class="payload-key">${escapeHtml(key)}</div><div class="payload-value">${escapeHtml(value)}</div></div>`;
        }
      } catch (e) {
        html += `<div class="payload-row"><div class="payload-value" style="grid-column: 1 / -1;">${escapeHtml(request.postData)}</div></div>`;
      }
      html += '</div></div>';
    } else if (contentType.includes('application/json') || contentType.includes('text/json')) {
      html += '<div class="payload-section"><div class="payload-section-title">Request Payload</div><div class="payload-json">';
      try {
        const jsonObj = JSON.parse(request.postData);
        const jsonStr = JSON.stringify(jsonObj, null, 2);
        html += `<pre class="json-display">${escapeHtml(jsonStr)}</pre>`;
      } catch (e) {
        html += `<pre class="json-display">${escapeHtml(request.postData)}</pre>`;
      }
      html += '</div></div>';
    } else {
      html += '<div class="payload-section"><div class="payload-section-title">Request Payload</div><div class="payload-raw">';
      html += `<pre class="json-display">${escapeHtml(request.postData)}</pre>`;
      html += '</div></div>';
    }
  }
  
  if (!hasContent) {
    return '<div style="color: #999;">No payload data</div>';
  }
  
  return html;
}

function findFirstSourceOfCookie(cookieName: string, cookieValue: string): { index: number; request: NetworkRequest } | null {
  // Find the very first request that sets this exact cookie (name + value)
  const normalizedCookieName = cookieName.trim().toLowerCase();
  const normalizedCookieValue = cookieValue.trim();
  
  if (normalizedCookieName.length === 0) {
    return null;
  }
  
  // Search from the beginning to find the first request that sets this exact cookie
  for (let i = 0; i < props.allRequests.length; i++) {
    const req = props.allRequests[i];
    if (!req) continue;
    if (!req.setCookies || !Array.isArray(req.setCookies) || req.setCookies.length === 0) {
      continue;
    }
    
    // Check if this request sets the exact cookie (name + value match)
    const setsCookie = req.setCookies.some(cookie => {
      if (!cookie) return false;
      if (!cookie.name || typeof cookie.name !== 'string') return false;
      if (!cookie.value || typeof cookie.value !== 'string') return false;
      const trimmedName = cookie.name.trim();
      if (trimmedName.length === 0) return false;
      const trimmedValue = cookie.value.trim();
      return trimmedName.toLowerCase() === normalizedCookieName && trimmedValue === normalizedCookieValue;
    });
    
    if (setsCookie) {
      return { index: i, request: req };
    }
  }
  
  return null;
}

function findAllUsagesOfCookie(cookieName: string, cookieValue: string, sourceRequestIndex: number, sourceRequestNumber: number) {
  // Find the very first request that sets this exact cookie (name + value pair)
  const normalizedCookieName = cookieName.trim().toLowerCase();
  const normalizedCookieValue = cookieValue.trim();
  
  if (normalizedCookieName.length === 0) {
    return {
      source: { id: sourceRequestNumber || '?', name: null },
      usages: []
    };
  }
  
  // Find the first request that sets this exact cookie (name + value)
  const firstSource = findFirstSourceOfCookie(cookieName, cookieValue);
  
  if (!firstSource) {
    // If no source found, use the current request as the source
    const currentRequest = props.allRequests[sourceRequestIndex];
    let sourceName: string | null = null;
    if (currentRequest) {
      try {
        const url = new URL(currentRequest.url);
        sourceName = url.pathname.split('/').pop() || url.pathname || url.hostname;
      } catch (e) {
        sourceName = currentRequest.url;
      }
    }
    return {
      source: { id: sourceRequestNumber || '?', name: sourceName },
      usages: []
    };
  }
  
  const usageRequestNumbers: number[] = [];
  const sourceIndex = firstSource.index;
  const sourceRequest = firstSource.request;
  
  // Check all requests after the first source that use this exact cookie in their Cookie header
  for (let i = sourceIndex + 1; i < props.allRequests.length; i++) {
    const req = props.allRequests[i];
    if (!req) continue;
    if (!req.cookies || !Array.isArray(req.cookies) || req.cookies.length === 0) continue;
    
    // Check if this request uses the exact cookie (name + value match)
    const usesCookie = req.cookies.some(cookie => {
      if (!cookie || !cookie.name || typeof cookie.name !== 'string') return false;
      if (!cookie.value || typeof cookie.value !== 'string') return false;
      const trimmedName = cookie.name.trim();
      if (trimmedName.length === 0) return false;
      const trimmedValue = cookie.value.trim();
      return trimmedName.toLowerCase() === normalizedCookieName && trimmedValue === normalizedCookieValue;
    });
    
    if (usesCookie && req.requestNumber) {
      usageRequestNumbers.push(req.requestNumber);
    }
  }
  
  // Get the source request name
  let sourceName: string | null = null;
  if (sourceRequest) {
    try {
      const url = new URL(sourceRequest.url);
      sourceName = url.pathname.split('/').pop() || url.pathname || url.hostname;
    } catch (e) {
      sourceName = sourceRequest.url;
    }
  }
  
  return {
    source: { id: sourceRequest.requestNumber || '?', name: sourceName },
    usages: usageRequestNumbers
  };
}

function formatCookies(cookies: typeof props.request.setCookies): string {
  if (!cookies || cookies.length === 0) {
    return 'No set-cookies';
  }
  
  // Find the index of the current request
  const requestIndex = props.allRequests.findIndex(r => String(r.id) === String(props.request.id));
  
  let html = '';
  cookies.forEach(cookie => {
    const cookieName = escapeHtml(cookie.name);
    const cookieValueRaw = cookie.value;
    const cookieValueEscaped = escapeHtml(cookieValueRaw);
    const isLongValue = cookieValueRaw.length > 100;
    const truncatedValue = isLongValue ? cookieValueEscaped.substring(0, 100) : cookieValueEscaped;
    const cookieId = `cookie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Find all usages of this exact cookie (name + value)
    const usageInfo = requestIndex !== -1 && props.request.requestNumber
      ? findAllUsagesOfCookie(cookie.name, cookie.value, requestIndex, props.request.requestNumber)
      : { source: { id: props.request.requestNumber || '?', name: null }, usages: [] };
    
    // Format usage information
    const sourceName = usageInfo.source.name ? escapeHtml(usageInfo.source.name) : 'unknown';
    const sourceText = `source: ${usageInfo.source.id}:${sourceName}`;
    const usagesText = usageInfo.usages.length > 0 
      ? `used in [${usageInfo.usages.join(',')}]`
      : 'unused';
    const usageDisplay = `${sourceText}, ${usagesText}`;
    const usageClass = usageInfo.usages.length > 0 ? 'cookie-used' : 'cookie-unused';
    
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
      <div class="cookie-usage ${usageClass}">
        ${usageDisplay}
      </div>
    </div>`;
  });
  
  return html;
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(props.request.url);
  } catch (err) {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = props.request.url;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

async function copyRequestHeaders() {
  const jsonStr = JSON.stringify(props.request.requestHeaders, null, 2);
  try {
    await navigator.clipboard.writeText(jsonStr);
  } catch (err) {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = jsonStr;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

async function copyResponseHeaders() {
  const jsonStr = JSON.stringify(props.request.responseHeaders, null, 2);
  try {
    await navigator.clipboard.writeText(jsonStr);
  } catch (err) {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = jsonStr;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

async function copyPayload() {
  // Simplified - could be enhanced
  const jsonStr = JSON.stringify({ url: props.request.url, postData: props.request.postData }, null, 2);
  try {
    await navigator.clipboard.writeText(jsonStr);
  } catch (err) {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = jsonStr;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

// Set up event delegation for expand/collapse buttons
let detailsPanelClickHandler: ((e: MouseEvent) => void) | null = null;

function setupEventDelegation() {
  const detailsPanel = document.getElementById('detailsPanel');
  if (!detailsPanel) return;

  // Remove existing handler if any
  if (detailsPanelClickHandler) {
    detailsPanel.removeEventListener('click', detailsPanelClickHandler);
  }

  detailsPanelClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Handle header expand/collapse
    if (target.classList.contains('header-expand')) {
      e.stopPropagation();
      const expandBtn = target;
      const headerId = expandBtn.dataset.id;
      const fullValue = expandBtn.dataset.full;
      if (!headerId || !fullValue) return;
      
      const textSpan = document.getElementById(`${headerId}-text`);
      if (!textSpan) return;
      
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
    } 
    // Handle cookie expand/collapse
    else if (target.classList.contains('cookie-expand')) {
      e.stopPropagation();
      const expandBtn = target;
      const cookieId = expandBtn.dataset.id;
      const fullValue = expandBtn.dataset.full;
      if (!cookieId || !fullValue) return;
      
      const textSpan = document.getElementById(`${cookieId}-text`);
      if (!textSpan) return;
      
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
    }
  };

  detailsPanel.addEventListener('click', detailsPanelClickHandler);
}

onMounted(() => {
  // Wait for DOM to be ready, then set up event delegation
  nextTick(() => {
    setupEventDelegation();
  });
});

// Re-setup event delegation when content changes (when request changes)
watch(() => props.request, () => {
  nextTick(() => {
    setupEventDelegation();
  });
}, { deep: true });

onUnmounted(() => {
  if (detailsPanelClickHandler) {
    const detailsPanel = document.getElementById('detailsPanel');
    if (detailsPanel) {
      detailsPanel.removeEventListener('click', detailsPanelClickHandler);
    }
    detailsPanelClickHandler = null;
  }
});
</script>


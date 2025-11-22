<template>
  <div class="table-container">
    <table id="requestsTable" class="requests-table">
      <thead>
        <tr>
          <th class="col-id">ID</th>
          <th class="col-name">
            <span>Name</span>
            <div class="resize-handle" data-column="name"></div>
          </th>
          <th class="col-method">Method</th>
          <th class="col-status">Status</th>
          <th class="col-type">Type</th>
          <th class="col-size">Size</th>
          <th class="col-time">Time</th>
          <th class="col-session">Session</th>
          <th class="col-bot">Bot Detection</th>
        </tr>
      </thead>
      <tbody id="requestsBody">
        <tr
          v-for="request in requests"
          :key="request.id"
          :data-request-id="request.id"
          :class="{
            'session-request': request.session.isSession,
            'bot-detection': request.botDetection.isBotDetection,
            'selected': selectedRequest?.id === request.id,
            'cookie-source': cookieSourceIds.has(String(request.id)),
            'cookie-recipient': cookieRecipientIds.has(String(request.id))
          }"
          @click="$emit('selectRequest', request)"
        >
          <td class="col-id">{{ request.requestNumber || '-' }}</td>
          <td :title="request.url">{{ getRequestName(request.url) }}</td>
          <td>
            <span :class="`method method-${request.method}`">{{ request.method }}</span>
          </td>
          <td>
            <span v-if="request.status > 0" :class="`status-code ${getStatusClass(request.status)}`">
              {{ request.status }}
            </span>
            <span v-else>-</span>
          </td>
          <td>{{ request.type || 'other' }}</td>
          <td>{{ formatSize(request.size) }}</td>
          <td>{{ formatTime(request.time) }}</td>
          <td>
            <span v-if="request.session.isSession" class="session-badge" :title="request.session.reason ?? undefined">
              Session
            </span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="request.botDetection.isBotDetection" class="bot-badge" :title="request.botDetection.indicators.join(', ')">
              {{ request.botDetection.confidence }}
            </span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NetworkRequest } from '../types';
import { formatter } from '../utils';

const props = defineProps<{
  requests: NetworkRequest[];
  selectedRequest: NetworkRequest | null;
  allRequests: NetworkRequest[];
}>();

defineEmits<{
  selectRequest: [request: NetworkRequest];
}>();

function findCookieSourceRequests(request: NetworkRequest): Set<string> {
  // Find requests that set cookies used by this request
  // Only track the closest (most recent) source for each cookie
  const cookieToClosestSource = new Map<string, string>();
  
  // Check what cookies the request has
  if (!request.cookies || !Array.isArray(request.cookies) || request.cookies.length === 0) {
    return new Set();
  }
  
  // Extract cookie names from request cookies (normalized)
  const cookieNames = new Set<string>();
  request.cookies.forEach(cookie => {
    if (cookie && cookie.name && typeof cookie.name === 'string' && cookie.name.trim()) {
      const name = cookie.name.trim().toLowerCase();
      if (name.length > 0) {
        cookieNames.add(name);
      }
    }
  });
  
  if (cookieNames.size === 0) {
    return new Set();
  }
  
  // Check all requests (use index as fallback if timestamps are the same)
  const requestIndex = props.allRequests.findIndex(r => String(r.id) === String(request.id));
  if (requestIndex === -1) return new Set();
  
  // Iterate backwards from the closest request to find the most recent source for each cookie
  for (let i = requestIndex - 1; i >= 0; i--) {
    const req = props.allRequests[i];
    if (!req) continue;
    if (String(req.id) === String(request.id)) continue;
    if (!req.setCookies || !Array.isArray(req.setCookies) || req.setCookies.length === 0) continue;
    
    // Check if this request sets any cookies that the selected request uses
    req.setCookies.forEach(setCookie => {
      if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
        const setName = setCookie.name.trim().toLowerCase();
        if (setName.length > 0 && cookieNames.has(setName)) {
          // Only add if we haven't found a closer source for this cookie yet
          if (!cookieToClosestSource.has(setName)) {
            cookieToClosestSource.set(setName, String(req.id));
          }
        }
      }
    });
    
    // Early exit if we've found sources for all cookies
    if (cookieToClosestSource.size === cookieNames.size) {
      break;
    }
  }
  
  // Return a Set of unique source request IDs
  return new Set(cookieToClosestSource.values());
}

function findCookieRecipientRequests(request: NetworkRequest): Set<string> {
  // Find requests that use cookies set by this request
  // Only include recipients if the selected request is the closest source for at least one cookie
  const recipientRequestIds = new Set<string>();
  
  // Check what cookies this request sets
  if (!request.setCookies || !Array.isArray(request.setCookies) || request.setCookies.length === 0) {
    return recipientRequestIds;
  }
  
  // Extract cookie names from set-cookie headers
  const cookieNames = new Set<string>();
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
  const requestIndex = props.allRequests.findIndex(r => String(r.id) === String(request.id));
  if (requestIndex === -1) return recipientRequestIds;
  
  // Check all later requests
  for (let i = requestIndex + 1; i < props.allRequests.length; i++) {
    const req = props.allRequests[i];
    if (!req) continue;
    if (String(req.id) === String(request.id)) continue;
    
    if (!req.cookies || !Array.isArray(req.cookies) || req.cookies.length === 0) continue;
    
    // Extract cookies used by this recipient request
    const recipientCookieNames = new Set<string>();
    req.cookies.forEach(cookie => {
      if (cookie && cookie.name && typeof cookie.name === 'string' && cookie.name.trim()) {
        const cookieName = cookie.name.trim().toLowerCase();
        if (cookieName.length > 0) {
          recipientCookieNames.add(cookieName);
        }
      }
    });
    
    // Find cookies that both the selected request sets and the recipient uses
    const matchingCookies = new Set<string>();
    cookieNames.forEach(cookieName => {
      if (recipientCookieNames.has(cookieName)) {
        matchingCookies.add(cookieName);
      }
    });
    
    if (matchingCookies.size === 0) continue;
    
    // For each matching cookie, check if the selected request is the closest source
    // Only add recipient if selected request is closest source for at least one cookie
    let isClosestSourceForAnyCookie = false;
    
    for (const cookieName of matchingCookies) {
      // Find the closest source for this cookie for the recipient request
      const recipientIndex = i;
      let closestSourceId: string | null = null;
      
      // Iterate backwards from the recipient to find the closest source
      for (let j = recipientIndex - 1; j >= 0; j--) {
        const potentialSource = props.allRequests[j];
        if (!potentialSource) continue;
        if (!potentialSource.setCookies || !Array.isArray(potentialSource.setCookies) || potentialSource.setCookies.length === 0) continue;
        
        // Check if this request sets the cookie
        const setsCookie = potentialSource.setCookies.some(setCookie => {
          if (setCookie && setCookie.name && typeof setCookie.name === 'string' && setCookie.name.trim()) {
            return setCookie.name.trim().toLowerCase() === cookieName;
          }
          return false;
        });
        
        if (setsCookie) {
          closestSourceId = String(potentialSource.id);
          break; // Found the closest source
        }
      }
      
      // If the closest source is the selected request, mark this recipient
      if (closestSourceId === String(request.id)) {
        isClosestSourceForAnyCookie = true;
        break; // No need to check other cookies if we found one
      }
    }
    
    // Only add if selected request is closest source for at least one cookie
    if (isClosestSourceForAnyCookie) {
      recipientRequestIds.add(String(req.id));
    }
  }
  
  return recipientRequestIds;
}

// Compute cookie source and recipient IDs based on selected request
const cookieSourceIds = computed(() => {
  if (!props.selectedRequest) {
    return new Set<string>();
  }
  return findCookieSourceRequests(props.selectedRequest);
});

const cookieRecipientIds = computed(() => {
  if (!props.selectedRequest) {
    return new Set<string>();
  }
  return findCookieRecipientRequests(props.selectedRequest);
});

function getRequestName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').pop() || urlObj.pathname || urlObj.hostname;
  } catch {
    return url;
  }
}

function getStatusClass(status: number): string {
  if (status >= 200 && status < 300) return 'status-2xx';
  if (status >= 300 && status < 400) return 'status-3xx';
  if (status >= 400 && status < 500) return 'status-4xx';
  return 'status-5xx';
}

function formatSize(bytes: number): string {
  return formatter.formatSize(bytes);
}

function formatTime(ms: number): string {
  return formatter.formatTime(ms);
}
</script>

<style scoped>
.table-container {
  flex: 1;
  overflow: auto;
  overflow-x: hidden;
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  table-layout: fixed;
}

.requests-table thead {
  position: sticky;
  top: 0;
  background: #f5f5f5;
  z-index: 10;
}

.requests-table th {
  padding: 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  color: #666;
  font-size: 11px;
}

.requests-table th.col-name {
  padding-right: 12px;
}

.requests-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #eee;
}

.requests-table tbody tr {
  cursor: pointer;
  transition: background-color 0.1s;
}

.requests-table tbody tr:hover {
  background: #f5f5f5;
}

.requests-table tbody tr.selected {
  background: #e3f2fd;
  outline: 1px solid black;
}

.requests-table tbody tr.selected td:first-child {
  border-left: 3px solid #2f9c19 !important;
}

.requests-table tbody tr.cookie-source {
  background: #e8f5e9 !important;
  border-left: 3px solid #4caf50 !important;
}

.requests-table tbody tr.cookie-source:hover {
  background: #c8e6c9 !important;
}

.requests-table tbody tr.cookie-recipient {
  background: #f3e5f5 !important;
  border-left: 4px solid #9c27b0 !important;
}

.requests-table tbody tr.cookie-recipient:hover {
  background: #e1bee7 !important;
  border-left: 4px solid #7b1fa2 !important;
}

/* Cookie highlighting should override session highlighting */
.requests-table tbody tr.cookie-source.session-request {
  background: #e8f5e9 !important;
  border-left: 3px solid #4caf50 !important;
}

.requests-table tbody tr.cookie-recipient.session-request {
  background: #f3e5f5 !important;
  border-left: 4px solid #9c27b0 !important;
}

.requests-table tbody tr.session-request {
  background: #fff3e0;
}

.requests-table tbody tr.session-request:hover {
  background: #ffe0b2;
}

.requests-table tbody tr.bot-detection {
  border-left: 3px solid #f44336;
}

.col-name {
  width: 40%;
  min-width: 200px;
  position: relative;
  overflow: hidden;
}

.col-name span {
  display: block;
  padding-right: 8px;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: rgba(0, 120, 212, 0.1);
  z-index: 100;
  touch-action: none;
  pointer-events: auto;
}

.resize-handle:hover {
  background: rgba(0, 120, 212, 0.5);
}

.resize-handle.active {
  background: #0078d4;
}

.col-id {
  width: 50px;
  min-width: 50px;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.col-method {
  width: 8%;
  min-width: 60px;
}

.col-status {
  width: 8%;
  min-width: 70px;
}

.col-type {
  width: 10%;
  min-width: 80px;
}

.col-size {
  width: 10%;
  min-width: 80px;
}

.col-time {
  width: 8%;
  min-width: 70px;
}

.col-session {
  width: 8%;
  min-width: 80px;
}

.col-bot {
  width: 8%;
  min-width: 80px;
}

.status-code {
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  font-size: 10px;
}

.status-2xx {
  background: #c8e6c9;
  color: #2e7d32;
}

.status-3xx {
  background: #fff9c4;
  color: #f57f17;
}

.status-4xx {
  background: #ffccbc;
  color: #d84315;
}

.status-5xx {
  background: #ef9a9a;
  color: #c62828;
}

.method {
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 10px;
}

.method-GET {
  color: #1976d2;
}

.method-POST {
  color: #388e3c;
}

.method-PUT {
  color: #f57c00;
}

.method-DELETE {
  color: #d32f2f;
}

.method-PATCH {
  color: #7b1fa2;
}

.session-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #ff9800;
  color: white;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
}

.bot-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #f44336;
  color: white;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
}
</style>


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
            'bot-detection': request.botDetection.isBotDetection,
            'selected': selectedRequest?.id === request.id,
            'cookie-source': cookieSourceIds.has(String(request.id)),
            'cookie-recipient': cookieRecipientIds.has(String(request.id))
          }"
          @click="$emit('selectRequest', request)"
        >
          <td class="col-id">{{ request.requestNumber || '-' }}</td>
          <td :title="request.url">{{ RequestFormatter.getRequestName(request.url) }}</td>
          <td>
            <span :class="`method method-${request.method}`">{{ request.method }}</span>
          </td>
          <td>
            <span v-if="request.status > 0" :class="`status-code ${RequestFormatter.getStatusClass(request.status)}`">
              {{ request.status }}
            </span>
            <span v-else>-</span>
          </td>
          <td>{{ request.type || 'other' }}</td>
          <td>{{ RequestFormatter.formatSize(request.size) }}</td>
          <td>{{ RequestFormatter.formatTime(request.time) }}</td>
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
import { CookieTracker } from '../services/CookieTracker';
import { RequestFormatter } from '../services/RequestFormatter';

const props = defineProps<{
  requests: NetworkRequest[];
  selectedRequest: NetworkRequest | null;
  allRequests: NetworkRequest[];
}>();

defineEmits<{
  selectRequest: [request: NetworkRequest];
}>();

// Compute cookie source and recipient IDs based on selected request
const cookieSourceIds = computed(() => {
  if (!props.selectedRequest) {
    return new Set<string>();
  }
  return CookieTracker.findCookieSourceRequests(props.selectedRequest, props.allRequests);
});

const cookieRecipientIds = computed(() => {
  if (!props.selectedRequest) {
    return new Set<string>();
  }
  return CookieTracker.findCookieRecipientRequests(props.selectedRequest, props.allRequests);
});
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
  background: #fff8e1 !important;
  border-left: 3px solid #ffc107 !important;
}

.requests-table tbody tr.cookie-source:hover {
  background: #ffecb3 !important;
}

.requests-table tbody tr.cookie-recipient {
  background: #e8f5e9 !important;
  border-left: 4px solid #4caf50 !important;
}

.requests-table tbody tr.cookie-recipient:hover {
  background: #c8e6c9 !important;
  border-left: 4px solid #2e7d32 !important;
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


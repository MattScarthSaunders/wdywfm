<template>
  <div class="table-container">
    <table id="requestsTable" class="requests-table">
      <thead>
        <tr>
          <th class="col-id">ID</th>
          <th class="col-name">
            <span>Name</span>
          </th>
          <th class="col-method responsive-hide">Method</th>
          <th class="col-status responsive-hide">Status</th>
          <th class="col-type responsive-hide">Type</th>
          <th class="col-size responsive-hide">Size</th>
          <th class="col-time responsive-hide">Time</th>
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
          <td class="col-name" :title="request.url">{{ RequestFormatter.getRequestName(request.url) }}</td>
          <td class="responsive-hide">
            <span :class="`method method-${request.method}`">{{ request.method }}</span>
          </td>
          <td class="responsive-hide">
            <span v-if="request.status > 0" :class="`status-code ${RequestFormatter.getStatusClass(request.status)}`">
              {{ request.status }}
            </span>
            <span v-else>-</span>
          </td>
          <td class="responsive-hide">{{ request.type || 'other' }}</td>
          <td class="responsive-hide">{{ RequestFormatter.formatSize(request.size) }}</td>
          <td class="responsive-hide">{{ RequestFormatter.formatTime(request.time) }}</td>
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
  overflow-x: auto;
}

.requests-table {
  width: 100%;
  min-width: 310px; /* Minimum width: ID(50) + Name(50) + Session(80) + Bot(100) + padding */
  border-collapse: collapse;
  font-size: 11px;
  table-layout: fixed;
}

.requests-table thead {
  position: sticky;
  top: 0;
  background: var(--color-bg-light);
  z-index: 10;
}

.requests-table th {
  padding: 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: 11px;
}

.requests-table th.col-name {
  padding-right: 12px;
}

.responsive-hide {
  display: table-cell;
}

.requests-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #eee; /* EEEEEEEEE! */
}

.requests-table tbody tr {
  cursor: pointer;
  transition: background-color 0.1s;
}

.requests-table tbody tr:hover {
  background: var(--color-bg-light);
}

.requests-table tbody tr.selected {
  background: var(--color-primary-light);
  outline: 1px solid black;
}

.requests-table tbody tr.selected td:first-child {
  border-left: 3px solid var(--color-success-border) !important;
}

.requests-table tbody tr.cookie-source {
  background: var(--color-warning-bg-light) !important;
  border-left: 3px solid var(--color-warning-yellow) !important;
}

.requests-table tbody tr.cookie-source:hover {
  background: var(--color-warning-bg-yellow) !important;
}

.requests-table tbody tr.cookie-recipient {
  background: var(--color-success-bg-light) !important;
  border-left: 4px solid var(--color-success) !important;
}

.requests-table tbody tr.cookie-recipient:hover {
  background: var(--color-success-bg) !important;
  border-left: 4px solid var(--color-success-dark) !important;
}


.requests-table tbody tr.bot-detection {
  border-left: 3px solid var(--color-error-variant);
}

.col-name {
  min-width: 50px;
  width: auto;
  position: relative;
  overflow: hidden;
}

.col-name span {
  display: block;
  padding-right: 8px;
}

.requests-table td.col-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-id {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  text-align: center;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.col-method {
  width: 60px;
  min-width: 60px;
  max-width: 60px;
}

.col-status {
  width: 70px;
  min-width: 70px;
  max-width: 70px;
}

.col-type {
  width: 80px;
  min-width: 80px;
  max-width: 80px;
}

.col-size {
  width: 80px;
  min-width: 80px;
  max-width: 80px;
}

.col-time {
  width: 70px;
  min-width: 70px;
  max-width: 70px;
}

.col-session {
  width: 80px;
  min-width: 80px;
  max-width: 80px;
}

.col-bot {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
}

.status-code {
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  font-size: 10px;
}

.status-2xx {
  background: var(--color-success-bg);
  color: var(--color-success-dark);
}

.status-3xx {
  background: var(--color-warning-bg-light);
  color: var(--color-warning-alt);
}

.status-4xx {
  background: var(--color-warning-bg);
  color: var(--color-error-alt);
}

.status-5xx {
  background: var(--color-error-bg);
  color: var(--color-error-dark);
}

.method {
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 10px;
}

.method-GET {
  color: var(--color-primary);
}

.method-POST {
  color: var(--color-success-alt);
}

.method-PUT {
  color: var(--color-warning-dark);
}

.method-DELETE {
  color: var(--color-error);
}

.method-PATCH {
  color: var(--color-purple);
}

.session-badge {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-warning);
  color: white;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
}

.bot-badge {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-error-variant);
  color: white;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
}

/* Responsive behavior: hide Method, Status, Type, Size, Time columns when window is small */
/* Breakpoint calculated: ID(50) + Name(50) + Method(60) + Status(70) + Type(80) + Size(80) + Time(70) + Session(80) + Bot(100) = 640px + padding */
@media (max-width: 700px) {
  .responsive-hide {
    display: none !important;
  }
}
</style>


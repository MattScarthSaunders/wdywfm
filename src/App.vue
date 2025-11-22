<template>
  <div class="container">
    <HeaderComponent
      :filter-text="filterText"
      :total-requests="requests.length"
      :filtered-requests="filteredRequests.length"
      :session-requests="sessionCount"
      :bot-detection-count="botCount"
      @update:filter-text="filterText = $event"
      @clear-filter="clearFilter"
    />
    
    <ToolbarComponent
      :preserve-log="preserveLog"
      :show-only-sessions="showOnlySessions"
      :show-only-bot-detection="showOnlyBotDetection"
      :grade-header-importance="gradeHeaderImportance"
      @update:preserve-log="preserveLog = $event"
      @update:show-only-sessions="showOnlySessions = $event"
      @update:show-only-bot-detection="showOnlyBotDetection = $event"
      @update:grade-header-importance="gradeHeaderImportance = $event"
      @clear="clearRequests"
      @export="exportData"
    />

    <RequestsTableComponent
      :requests="filteredRequests"
      :selected-request="selectedRequest"
      :all-requests="requests"
      @select-request="handleRequestSelect"
    />

    <DetailsPanelComponent
      v-if="selectedRequest"
      :request="selectedRequest"
      :all-requests="requests"
      :grade-header-importance="gradeHeaderImportance"
      @update:grade-header-importance="gradeHeaderImportance = $event"
      @close="selectedRequest = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { NetworkRequest } from './types';
import { filterParser, sessionDetector, botDetector, cookieParser, formatter } from './utils';
import HeaderComponent from './components/HeaderComponent.vue';
import ToolbarComponent from './components/ToolbarComponent.vue';
import RequestsTableComponent from './components/RequestsTableComponent.vue';
import DetailsPanelComponent from './components/DetailsPanelComponent.vue';
import { useNetworkMonitoring } from './composables/useNetworkMonitoring';
import { useSettings } from './composables/useSettings';

const requests = ref<NetworkRequest[]>([]);
const filteredRequests = ref<NetworkRequest[]>([]);
const selectedRequest = ref<NetworkRequest | null>(null);
const filterText = ref('');

const { preserveLog, showOnlySessions, showOnlyBotDetection, gradeHeaderImportance, loadSettings, saveSettings } = useSettings();

const sessionCount = computed(() => requests.value.filter(r => r.session.isSession).length);
const botCount = computed(() => requests.value.filter(r => r.botDetection.isBotDetection).length);

const { startMonitoring } = useNetworkMonitoring({
  onRequest: (requestData: NetworkRequest) => {
    requests.value.push(requestData);
    applyFilters();
  }
});

function clearFilter() {
  filterText.value = '';
  applyFilters();
}

function applyFilters() {
  const parser = filterParser.parse(filterText.value);
  
  filteredRequests.value = requests.value.filter(request => {
    if (parser && !parser.matches(request)) {
      return false;
    }
    if (showOnlySessions.value && !request.session.isSession) {
      return false;
    }
    if (showOnlyBotDetection.value && !request.botDetection.isBotDetection) {
      return false;
    }
    return true;
  });
}

function handleRequestSelect(request: NetworkRequest) {
  selectedRequest.value = request;
}

function clearRequests() {
  requests.value = [];
  filteredRequests.value = [];
  selectedRequest.value = null;
}

function exportData() {
  const data = {
    exportDate: new Date().toISOString(),
    totalRequests: requests.value.length,
    requests: requests.value.map(r => ({
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
      botDetection: r.botDetection,
      postData: r.postData
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

watch([filterText, showOnlySessions, showOnlyBotDetection], () => {
  applyFilters();
});

watch([preserveLog, gradeHeaderImportance], () => {
  saveSettings();
});

onMounted(() => {
  loadSettings();
  // Delay monitoring start to ensure DevTools API is available
  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        startMonitoring();
      } catch (error) {
        console.error('Failed to start network monitoring:', error);
      }
    }, 200);
  });
});
</script>


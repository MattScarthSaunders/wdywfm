<template>
  <div class="container">
    <HeaderComponent
      :filter-text="filterText"
      :total-requests="requests.length"
      :filtered-requests="filteredRequests.length"
      :search-value="searchValue"
      :capture-mode-enabled="captureModeEnabled"
      @update:filter-text="filterText = $event"
      @clear-filter="clearFilter"
      @update:searchValue="searchValue = $event"
      @triggerSearch="runSearchFromInput"
      @toggle-capture-mode="toggleCaptureMode"
    />
    
    <ToolbarComponent
      :preserve-log="preserveLog"
      :hide-java-script="hideJavaScript"
      :hide-assets="hideAssets"
      @update:preserve-log="preserveLog = $event"
      @update:hideJavaScript="hideJavaScript = $event"
      @update:hideAssets="hideAssets = $event"
      @clear="clearRequests"
      @export="exportData"
    />

    <RequestsTableComponent
      :requests="filteredRequests"
      :selected-request="selectedRequest"
      :all-requests="requests"
      :value-match-ids="valueMatchIds"
      :value-match-paths="valueMatchPaths"
      @select-request="handleRequestSelect"
    />

    <DetailsPanelComponent
      v-if="selectedRequest"
      :request="selectedRequest"
      :all-requests="requests"
      :grade-header-importance="gradeHeaderImportance"
      :captured-value="lastCapturedValue"
      :captured-paths="valueMatchPaths[String(selectedRequest.id)] || []"
      @update:grade-header-importance="gradeHeaderImportance = $event"
      @close="selectedRequest = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { deps } from 'vue-cocoon';
import type { NetworkRequest } from './types';
import { filterParser } from './utils';
import HeaderComponent from './components/HeaderComponent.vue';
import ToolbarComponent from './components/ToolbarComponent.vue';
import RequestsTableComponent from './components/RequestsTableComponent.vue';
import DetailsPanelComponent from './components/DetailsPanel/DetailsPanelComponent.vue';
import { useNetworkMonitoring } from './composables/useNetworkMonitoring';
import { useSettings } from './composables/useSettings';

const requests = ref<NetworkRequest[]>([]);
const filteredRequests = ref<NetworkRequest[]>([]);
const selectedRequest = ref<NetworkRequest | null>(null);
const filterText = ref('');
const captureModeEnabled = ref(false);
const searchValue = ref('');
const lastCapturedValue = ref<string | null>(null);
const valueMatchIds = ref<Set<string>>(new Set());
const valueMatchPaths = ref<Record<string, string[]>>({});

const { valueCaptureService } = deps();

const { preserveLog, gradeHeaderImportance, hideJavaScript, hideAssets, loadSettings, saveSettings } = useSettings();

const { startMonitoring } = useNetworkMonitoring({
  onRequest: (requestData: NetworkRequest) => {
    // Check if request with same ID already exists (for updates)
    const existingIndex = requests.value.findIndex(r => r.id === requestData.id);
    if (existingIndex !== -1) {
      // Update existing request
      requests.value[existingIndex] = requestData;
      // Update selected request if it's the same one
      if (selectedRequest.value && selectedRequest.value.id === requestData.id) {
        selectedRequest.value = requestData;
      }
    } else {
      // Add new request
      requests.value.push(requestData);
    }
    applyFilters();

    // If we already have a captured value, re-run value matching for new/updated requests
    if (lastCapturedValue.value) {
      updateValueMatches();
    }
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
    
    if (hideJavaScript.value && request.type === 'script') {
      return false;
    }
    
    if (hideAssets.value && ['stylesheet', 'image', 'font', 'media'].includes(request.type)) {
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
  valueMatchIds.value = new Set();
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

function updateValueMatches() {
  const { matchIds, matchPaths } = valueCaptureService.findMatches(
    requests.value,
    lastCapturedValue.value
  );
  valueMatchIds.value = matchIds;
  valueMatchPaths.value = matchPaths;
}

function runSearchFromInput() {
  const value = searchValue.value.trim();

  if (!value) {
    lastCapturedValue.value = null;
    valueMatchIds.value = new Set();
    valueMatchPaths.value = {};
    return;
  }

  lastCapturedValue.value = value;
  updateValueMatches();
}

function toggleCaptureMode() {
  // DevTools-only API guard
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return;
  }

  const tabId = chrome.devtools && chrome.devtools.inspectedWindow
    ? chrome.devtools.inspectedWindow.tabId
    : undefined;

  if (captureModeEnabled.value) {
    captureModeEnabled.value = false;
    chrome.runtime.sendMessage({ action: 'disableCaptureMode', tabId });
    return;
  }

  captureModeEnabled.value = true;
  valueMatchIds.value = new Set();
  chrome.runtime.sendMessage({ action: 'enableCaptureMode', tabId });
}

// Listen for captured value from background/content script
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'capturedValue' && typeof message.value === 'string') {
      captureModeEnabled.value = false;

      const raw = message.value.trim();
      if (!raw) {
        return;
      }

      searchValue.value = raw;
      runSearchFromInput();
      applyFilters();
    }
  });
}

watch(searchValue, () => {
  runSearchFromInput();
});

watch([filterText], () => {
  applyFilters();
});

watch([preserveLog, gradeHeaderImportance, hideJavaScript, hideAssets], () => {
  applyFilters();
  saveSettings();
});

onMounted(() => {
  loadSettings();
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

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>


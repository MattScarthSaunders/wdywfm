<template>
  <div id="detailsPanel" ref="panelRef" class="details-panel" :style="{ width: panelWidth + 'px' }">
    <div ref="resizeHandleRef" class="panel-resize-handle" :class="{ active: isResizing }"></div>
    <div class="details-header">
      <h2 id="detailsTitle">{{ requestTitle }}</h2>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>
    <div class="details-content">
      <GeneralSection :request="request" />
      
      <div class="divider"></div>
      
      <RequestHeadersSection 
      :request="request"
      :grade-header-importance="gradeHeaderImportance"
      @update:grade-header-importance="$emit('update:gradeHeaderImportance', $event)"
      />

      <PayloadSection :request="request" />

      <div class="divider"></div>
      
      <ResponseHeadersSection 
        :request="request"
        :grade-header-importance="gradeHeaderImportance"
      />
      
      <ResponseSchemaSection :request="request" />

      <SetCookiesSection 
        :request="request"
        :all-requests="allRequests"
      />

      <div class="divider"></div>
      
      <SessionAnalysisSection :request="request" />
      
      <BotDetectionSection :request="request" />
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { NetworkRequest } from '../../types';
import { RequestFormatter } from '../../services/RequestFormatter';
import GeneralSection from './sections/GeneralSection.vue';
import RequestHeadersSection from './sections/RequestHeadersSection.vue';
import PayloadSection from './sections/PayloadSection.vue';
import ResponseHeadersSection from './sections/ResponseHeadersSection.vue';
import SetCookiesSection from './sections/SetCookiesSection.vue';
import SessionAnalysisSection from './sections/SessionAnalysisSection.vue';
import BotDetectionSection from './sections/BotDetectionSection.vue';
import ResponseSchemaSection from './sections/ResponseSchemaSection.vue';

const props = defineProps<{
  request: NetworkRequest;
  allRequests: NetworkRequest[];
  gradeHeaderImportance: boolean;
}>();

defineEmits<{
  'update:gradeHeaderImportance': [value: boolean];
  'close': [];
}>();

const panelRef = ref<HTMLElement | null>(null);
const resizeHandleRef = ref<HTMLElement | null>(null);
const panelWidth = ref(400);
const isResizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

const requestTitle = computed(() => {
  const requestId = props.request.requestNumber || '?';
  const requestName = RequestFormatter.getRequestName(props.request.url);
  return `${requestId}: ${requestName}`;
});

function loadPanelWidth() {
  chrome.storage.local.get(['detailsPanelWidth'], (result) => {
    if (result.detailsPanelWidth !== undefined) {
      panelWidth.value = Math.max(300, Math.min(result.detailsPanelWidth, window.innerWidth * 0.9));
    }
  });
}

function savePanelWidth() {
  chrome.storage.local.set({ detailsPanelWidth: panelWidth.value });
}

function handleMouseDown(e: MouseEvent) {
  if (!resizeHandleRef.value || !panelRef.value) return;
  
  isResizing.value = true;
  startX.value = e.clientX;
  startWidth.value = panelRef.value.offsetWidth;
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  e.preventDefault();
}

function handleMouseMove(e: MouseEvent) {
  if (!isResizing.value || !panelRef.value) return;
  
  const deltaX = startX.value - e.clientX; // Inverted because panel is on the right
  const newWidth = startWidth.value + deltaX;
  const minWidth = 300;
  const maxWidth = window.innerWidth * 0.9;
  
  panelWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
}

function handleMouseUp() {
  if (isResizing.value) {
    isResizing.value = false;
    savePanelWidth();
  }
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

onMounted(() => {
  loadPanelWidth();
  if (resizeHandleRef.value) {
    resizeHandleRef.value.addEventListener('mousedown', handleMouseDown);
  }
});

onUnmounted(() => {
  if (resizeHandleRef.value) {
    resizeHandleRef.value.removeEventListener('mousedown', handleMouseDown);
  }
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
});
</script>

<style scoped>
.details-panel {
  position: fixed;
  right: 0;
  top: 0;
  min-width: 300px;
  max-width: 90vw;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-resize-handle {
  position: absolute;
  left: -2px;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: rgba(0, 120, 212, 0.1);
  z-index: 1002;
  touch-action: none;
  pointer-events: auto;
}

.panel-resize-handle:hover {
  background: rgba(0, 120, 212, 0.5);
}

.panel-resize-handle.active {
  background: var(--color-primary-alt);
}

.details-panel.hidden {
  display: none;
}

.details-header {
  padding: 12px;
  background: var(--color-bg-light);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-width: 0; /* Allow flex items to shrink */
}

.details-header h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  min-width: 0; /* Allow text to truncate */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  width: 24px;
  height: 24px;
  min-width: 24px; /* Prevent button from shrinking */
  flex-shrink: 0; /* Prevent button from shrinking */
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.details-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 12px;
}

:deep(.details-data .header-row) {
  display: flex;
  padding: 4px 0;
  border-bottom: 1px solid var(--color-border-lighter);
}

:deep(.details-data .header-name) {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 150px;
}

:deep(.details-data .header-value) {
  color: var(--color-text-primary);
  flex: 1;
  word-break: break-word;
}

:deep(.details-data .header-row.header-required .header-name),
:deep(.details-data .header-row.header-required .header-value),
:deep(.details-data .header-row.header-required .header-value-text),
:deep(.details-data .header-row.header-required .header-expand) {
  color: var(--color-error); /* Red for required */
}

:deep(.details-data .header-row.header-optional .header-name),
:deep(.details-data .header-row.header-optional .header-value),
:deep(.details-data .header-row.header-optional .header-value-text),
:deep(.details-data .header-row.header-optional .header-expand) {
  color: var(--color-warning-dark); /* Amber for optional */
}

:deep(.details-data .header-row.header-unknown .header-name),
:deep(.details-data .header-row.header-unknown .header-value),
:deep(.details-data .header-row.header-unknown .header-value-text),
:deep(.details-data .header-row.header-unknown .header-expand) {
  color: var(--color-text-primary); /* Black/default for unknown */
}

:deep(.details-data .header-expand) {
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
  margin-left: 4px;
  font-size: 10px;
  user-select: none;
}

:deep(.details-data .header-expand:hover) {
  color: var(--color-primary-hover);
}

:deep(.details-data .header-expand.expanded) {
  color: var(--color-error);
}

.copy-json-btn {
  padding: 4px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.copy-json-btn:hover {
  background: var(--color-primary-hover);
}

.copy-json-btn.copied {
  background: var(--color-success);
}

.copy-json-btn-header {
  padding: 2px 8px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: background-color 0.2s;
  margin-left: auto;
}

.copy-json-btn-header:hover {
  background: var(--color-primary-hover);
}

.copy-json-btn-header.copied {
  background: var(--color-success);
}

:deep(.details-data .json-display) {
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 12px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

:deep(#detailsCookies) {
  white-space: normal;
}

:deep(.details-data .session-indicator) {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-warning);
  color: white;
  border-radius: 3px;
  font-size: 9px;
  margin-left: 4px;
}

:deep(.details-data .bot-indicator) {
  display: inline-block;
  padding: 2px 6px;
  background: var(--color-error-variant);
  color: white;
  border-radius: 3px;
  font-size: 9px;
  margin-left: 4px;
}

:deep(.details-data .payload-section) {
  margin-bottom: 16px;
}

:deep(.details-data .payload-section:last-child) {
  margin-bottom: 0;
}

:deep(.details-data .payload-section-title) {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 11px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.details-data .payload-table) {
  background: var(--color-bg-lighter);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

:deep(.details-data .payload-row) {
  display: grid;
  grid-template-columns: 150px 1fr;
  border-bottom: 1px solid var(--color-border-lighter);
  padding: 6px 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}

:deep(.details-data .payload-row:last-child) {
  border-bottom: none;
}

:deep(.details-data .payload-key) {
  font-weight: 600;
  color: var(--color-primary);
  word-break: break-word;
  padding-right: 12px;
}

:deep(.details-data .payload-value) {
  color: var(--color-text-primary);
  word-break: break-word;
}

:deep(.details-data .payload-json),
:deep(.details-data .payload-raw) {
  background: var(--color-bg-lighter);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 8px;
}

.divider {
  width: 100%;
  height: 1px;
  margin-top: -15px;
  margin-bottom: 15px;
  border-bottom: 2px solid var(--color-primary-divider)
}
</style>


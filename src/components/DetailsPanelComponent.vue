<template>
  <div id="detailsPanel" class="details-panel">
    <div class="panel-resize-handle"></div>
    <div class="details-header">
      <h2 id="detailsTitle">{{ requestTitle }}</h2>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>
    <div class="details-content">
      <GeneralSection :request="request" />
      
      <RequestHeadersSection 
        :request="request"
        :grade-header-importance="gradeHeaderImportance"
        @update:grade-header-importance="$emit('update:gradeHeaderImportance', $event)"
      />
      
      <PayloadSection :request="request" />
      
      <ResponseHeadersSection 
        :request="request"
        :grade-header-importance="gradeHeaderImportance"
      />
      
      <SetCookiesSection 
        :request="request"
        :all-requests="allRequests"
      />
      
      <SessionAnalysisSection :request="request" />
      
      <BotDetectionSection :request="request" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import type { NetworkRequest } from '../types';
import { RequestFormatter } from '../services/RequestFormatter';
import GeneralSection from './GeneralSection.vue';
import RequestHeadersSection from './RequestHeadersSection.vue';
import PayloadSection from './PayloadSection.vue';
import ResponseHeadersSection from './ResponseHeadersSection.vue';
import SetCookiesSection from './SetCookiesSection.vue';
import SessionAnalysisSection from './SessionAnalysisSection.vue';
import BotDetectionSection from './BotDetectionSection.vue';

const props = defineProps<{
  request: NetworkRequest;
  allRequests: NetworkRequest[];
  gradeHeaderImportance: boolean;
}>();

defineEmits<{
  'update:gradeHeaderImportance': [value: boolean];
  'close': [];
}>();

const requestTitle = computed(() => {
  return RequestFormatter.getRequestTitle(props.request);
});

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

<style scoped>
.details-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 400px;
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
}

.details-header h2 {
  font-size: 14px;
  font-weight: 600;
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
  padding: 12px;
}

/* Styles for dynamically generated content inside details-data */
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

/* Header importance grading styles */
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

:deep(.details-data .cookie-item) {
  padding: 4px 6px;
  margin-bottom: 2px;
  background: #fff;
  border-left: 3px solid #4caf50;
  padding-left: 8px;
  line-height: 1.3;
  display: block;
  height: auto;
  min-height: 0;
  white-space: normal;
}

:deep(.details-data .cookie-header) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.3;
  min-height: 0;
}

:deep(.details-data .cookie-name) {
  font-weight: 600;
  color: #2e7d32;
  min-width: 150px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

:deep(.details-data .cookie-value) {
  color: #666;
  font-size: 11px;
  flex: 1;
  word-break: break-word;
  min-height: 0;
  line-height: 1.3;
}

:deep(.details-data .cookie-expand) {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
  margin-left: 4px;
  font-size: 10px;
  user-select: none;
}

:deep(.details-data .cookie-expand:hover) {
  color: #1565c0;
}

:deep(.details-data .cookie-expand.expanded) {
  color: #d32f2f;
}

:deep(.details-data .cookie-attributes) {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
  line-height: 1.2;
}

:deep(.details-data .cookie-usage) {
  margin-top: 4px;
  font-size: 11px;
  font-style: italic;
  padding-top: 4px;
  border-top: 1px solid #e0e0e0;
}

:deep(.details-data .cookie-usage.cookie-used) {
  color: #2e7d32;
}

:deep(.details-data .cookie-usage.cookie-unused) {
  color: #999;
}

:deep(.details-data .session-indicator) {
  display: inline-block;
  padding: 2px 6px;
  background: #ff9800;
  color: white;
  border-radius: 3px;
  font-size: 9px;
  margin-left: 4px;
}

:deep(.details-data .bot-indicator) {
  display: inline-block;
  padding: 2px 6px;
  background: #f44336;
  color: white;
  border-radius: 3px;
  font-size: 9px;
  margin-left: 4px;
}

/* Payload section styles */
:deep(.details-data .payload-section) {
  margin-bottom: 16px;
}

:deep(.details-data .payload-section:last-child) {
  margin-bottom: 0;
}

:deep(.details-data .payload-section-title) {
  font-weight: 600;
  color: #666;
  font-size: 11px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.details-data .payload-table) {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.details-data .payload-row) {
  display: grid;
  grid-template-columns: 150px 1fr;
  border-bottom: 1px solid #eee;
  padding: 6px 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}

:deep(.details-data .payload-row:last-child) {
  border-bottom: none;
}

:deep(.details-data .payload-key) {
  font-weight: 600;
  color: #1976d2;
  word-break: break-word;
  padding-right: 12px;
}

:deep(.details-data .payload-value) {
  color: #333;
  word-break: break-word;
}

:deep(.details-data .payload-json),
:deep(.details-data .payload-raw) {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}
</style>


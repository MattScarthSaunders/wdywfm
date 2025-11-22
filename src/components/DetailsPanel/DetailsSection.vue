<template>
  <div class="details-section">
    <h3 
      class="section-header" 
      :class="{ collapsed: isCollapsed }"
      @click="toggleCollapse"
    >
      <span class="section-title-group">
        <span class="section-toggle">▼</span>
        {{ title }}
      </span>
      <slot name="header-actions"></slot>
    </h3>
    <div 
      class="details-data section-content"
      :class="{ collapsed: isCollapsed }"
      :style="{ maxHeight: isCollapsed ? '0' : '9999px' }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  collapsed?: boolean;
}>();

const isCollapsed = ref(props.collapsed ?? false);

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}
</script>

<style scoped>
.details-section {
  margin-bottom: 20px;
}

.details-section h3 {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  transition: color 0.2s;
  width: 100%;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

:deep(.header-controls) {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

.section-header:hover {
  color: var(--color-text-primary);
}

.section-toggle {
  font-size: 10px;
  transition: transform 0.2s;
  display: inline-block;
}

.section-header.collapsed .section-toggle {
  transform: rotate(-90deg);
}

.section-content {
  transition: max-height 0.2s ease, opacity 0.15s ease, margin 0.2s ease, padding 0.2s ease;
  overflow: hidden;
}

.section-content.collapsed {
  max-height: 0 !important;
  opacity: 0;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  border: none;
  transition: max-height 0.1s ease, opacity 0.1s ease, margin 0.1s ease, padding 0.1s ease;
}

.details-data {
  background: var(--color-bg-lighter);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
}

.toggle-view-btn {
  padding: 2px 8px;
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: background-color 0.2s;
  margin-left: auto;
  margin-right: 6px;
}

.toggle-view-btn:hover {
  background: var(--color-border);
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

.checkbox-label-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  cursor: pointer;
  margin-left: auto;
  margin-right: 6px;
  white-space: nowrap;
}
</style>


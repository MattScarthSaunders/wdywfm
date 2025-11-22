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
  color: #666;
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
  color: #333;
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
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
}

.toggle-view-btn {
  padding: 2px 8px;
  background: #f5f5f5;
  color: #333;
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
  background: #e0e0e0;
}

.copy-json-btn-header {
  padding: 2px 8px;
  background: #1976d2;
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
  background: #1565c0;
}

.copy-json-btn-header.copied {
  background: #4caf50;
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


<template>
  <div class="cookie-item">
    <div class="cookie-header">
      <div class="cookie-name" :title="cookie.name">{{ cookie.name }}</div>
      <div class="cookie-value">
        <span class="cookie-value-text">{{ displayValue }}</span>
        <span 
          v-if="isLongValue" 
          class="cookie-expand" 
          :class="{ expanded: isExpanded }"
          @click="toggleExpand"
        >
          {{ isExpanded ? '[collapse]' : '[...]' }}
        </span>
      </div>
    </div>
    <div class="cookie-attributes">
      {{ formattedAttributes }}
    </div>
    <div class="cookie-usage" :class="usageClass">
      <div class="cookie-usage-source">
        {{ usageDisplay.sourceText }}
      </div>
      <div class="cookie-usage-usages">
        {{ usageDisplay.usagesText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ParsedCookie } from '../../../types';

interface CookieUsageInfo {
  source: { id: string | number; name: string | null };
  usages: number[];
}

const props = defineProps<{
  cookie: ParsedCookie;
  usageInfo: CookieUsageInfo;
}>();

const isExpanded = ref(false);
const isLongValue = computed(() => props.cookie.value.length > 100);
const displayValue = computed(() => {
  if (!isLongValue.value || isExpanded.value) {
    return props.cookie.value;
  }
  return props.cookie.value.substring(0, 100);
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

const formattedAttributes = computed(() => {
  return Object.entries(props.cookie.attributes)
    .map(([k, v]) => `${k}: ${v === true ? 'true' : String(v)}`)
    .join(', ');
});

const usageClass = computed(() => {
  return props.usageInfo.usages.length > 0 ? 'cookie-used' : 'cookie-unused';
});

const usageDisplay = computed(() => {
  const sourceName = props.usageInfo.source.name || 'unknown';
  const sourceText = `source: ${props.usageInfo.source.id}:${sourceName}`;
  const usagesText = props.usageInfo.usages.length > 0 
    ? `used in [${props.usageInfo.usages.join(',')}]`
    : 'unused';
  return {sourceText, usagesText}
});
</script>

<style scoped>
.cookie-item {
  padding: 4px 6px;
  margin-bottom: 2px;
  background: var(--color-bg-white);
  border-left: 3px solid var(--color-success);
  padding-left: 8px;
  line-height: 1.3;
  display: block;
  height: auto;
  min-height: 0;
  white-space: normal;
}

.cookie-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.3;
  min-height: 0;
}

.cookie-name {
  font-weight: 600;
  color: var(--color-success-dark);
  min-width: 150px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.cookie-value {
  color: var(--color-text-secondary);
  font-size: 11px;
  flex: 1;
  word-break: break-word;
  min-height: 0;
  line-height: 1.3;
}

.cookie-expand {
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
  margin-left: 4px;
  font-size: 10px;
  user-select: none;
}

.cookie-expand:hover {
  color: var(--color-primary-hover);
}

.cookie-expand.expanded {
  color: var(--color-error);
}

.cookie-attributes {
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
  line-height: 1.2;
}

.cookie-usage {
  margin-top: 4px;
  font-size: 11px;
  font-style: italic;
  padding-top: 4px;
  border-top: 1px solid var(--color-border);
}

.cookie-usage-usages {
  color: var(--color-success-dark);
}

.cookie-usage-source {
  color: var(--color-warning-yellow);
}

.cookie-usage.cookie-unused .cookie-usage-source {
  color: var(--color-text-tertiary);
}

.cookie-usage.cookie-unused .cookie-usage-usages {
  color: var(--color-text-tertiary);
}
</style>


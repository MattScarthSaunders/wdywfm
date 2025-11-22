<template>
  <div class="header-row" :class="importanceClass">
    <div class="header-name" :class="importanceClass" :title="header.name">{{ header.name }}</div>
    <div class="header-value" :class="importanceClass">
      <span class="header-value-text">{{ displayValue }}</span>
      <span 
        v-if="isLongValue" 
        class="header-expand" 
        :class="{ expanded: isExpanded }"
        @click="toggleExpand"
      >
        {{ isExpanded ? '[collapse]' : '[...]' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Header {
  name: string;
  value: string;
  importance?: string;
}

const props = defineProps<{
  header: Header;
  gradeImportance: boolean;
}>();

const isExpanded = ref(false);
const isLongValue = computed(() => props.header.value.length > 100);
const displayValue = computed(() => {
  if (!isLongValue.value || isExpanded.value) {
    return props.header.value;
  }
  return props.header.value.substring(0, 100);
});

const importanceClass = computed(() => {
  if (!props.gradeImportance || !props.header.importance) {
    return '';
  }
  return `header-${props.header.importance}`;
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}
</script>

<style scoped>
.header-row {
  display: flex;
  padding: 4px 0;
  border-bottom: 1px solid var(--color-border-lighter);
}

.header-name {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 150px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-value {
  color: var(--color-text-primary);
  flex: 1;
  word-break: break-word;
}

.header-row.header-required .header-name,
.header-row.header-required .header-value,
.header-row.header-required .header-value-text,
.header-row.header-required .header-expand {
  color: var(--color-error);
}

.header-row.header-optional .header-name,
.header-row.header-optional .header-value,
.header-row.header-optional .header-value-text,
.header-row.header-optional .header-expand {
  color: var(--color-warning-dark);
}

.header-row.header-unknown .header-name,
.header-row.header-unknown .header-value,
.header-row.header-unknown .header-value-text,
.header-row.header-unknown .header-expand {
  color: var(--color-text-primary);
}

.header-expand {
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
  margin-left: 4px;
  font-size: 10px;
  user-select: none;
}

.header-expand:hover {
  color: var(--color-primary-hover);
}

.header-expand.expanded {
  color: var(--color-error);
}
</style>


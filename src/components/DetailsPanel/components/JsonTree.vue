<template>
  <div class="json-node">
    <template v-if="isPrimitive">
      <span v-if="keyLabelDisplay !== null" class="json-key">
        {{ keyLabelDisplay }}:
      </span>
      <span
        class="json-value"
        :class="primitiveClass"
      >
        {{ displayPrimitive }}
      </span>
    </template>

    <template v-else>
      <div
        class="json-row"
        role="button"
        tabindex="0"
        @click="toggle"
        @keydown.enter.prevent="toggle"
        @keydown.space.prevent="toggle"
      >
        <span class="json-toggle">
          {{ collapsed ? '▶' : '▼' }}
        </span>
        <span v-if="keyLabelDisplay !== null" class="json-key">
          {{ keyLabelDisplay }}:
        </span>
        <span class="json-summary">
          {{ summary }}
        </span>
      </div>
      <div v-if="!collapsed" class="json-children">
        <JsonTree
          v-for="childKey in childKeys"
          :key="childKey"
          :value="getChildValue(childKey)"
          :key-label="childKey"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  value: unknown;
  keyLabel?: string | number | null;
}>();

const collapsed = ref(true);

const isObject = computed(() => {
  return typeof props.value === 'object' && props.value !== null && !Array.isArray(props.value);
});

const isArray = computed(() => {
  return Array.isArray(props.value);
});

const isPrimitive = computed(() => {
  return !isObject.value && !isArray.value;
});

const keyLabelDisplay = computed(() => {
  if (props.keyLabel === undefined || props.keyLabel === null) {
    return null;
  }
  return String(props.keyLabel);
});

const childKeys = computed<(string | number)[]>(() => {
  if (isArray.value && Array.isArray(props.value)) {
    const arr = props.value;
    const keys: number[] = [];
    for (let index = 0; index < arr.length; index += 1) {
      keys.push(index);
    }
    return keys;
  }

  if (isObject.value && props.value && typeof props.value === 'object') {
    return Object.keys(props.value as Record<string, unknown>);
  }

  return [];
});

function getChildValue(childKey: string | number) {
  if (isArray.value && Array.isArray(props.value)) {
    return props.value[Number(childKey)];
  }

  if (isObject.value && props.value && typeof props.value === 'object') {
    const obj = props.value as Record<string, unknown>;
    return obj[String(childKey)];
  }

  return undefined;
}

const summary = computed(() => {
  if (isArray.value && Array.isArray(props.value)) {
    return `Array(${props.value.length})`;
  }

  if (isObject.value && props.value && typeof props.value === 'object') {
    const keys = Object.keys(props.value as Record<string, unknown>);
    if (keys.length === 0) {
      return '{ }';
    }
    const label = keys.length === 1 ? 'key' : 'keys';
    return `{… ${keys.length} ${label}}`;
  }

  return '';
});

const displayPrimitive = computed(() => {
  if (typeof props.value === 'string') {
    return `"${props.value}"`;
  }

  if (props.value === null) {
    return 'null';
  }

  return String(props.value);
});

const primitiveClass = computed(() => {
  if (typeof props.value === 'string') {
    return 'json-primitive-string';
  }

  if (typeof props.value === 'number') {
    return 'json-primitive-number';
  }

  if (typeof props.value === 'boolean') {
    return 'json-primitive-boolean';
  }

  if (props.value === null) {
    return 'json-primitive-null';
  }

  return 'json-primitive-other';
});

function toggle() {
  collapsed.value = !collapsed.value;
}
</script>

<style scoped>
.json-node {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
}

.json-row {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.json-children {
  margin-left: 14px;
}

.json-toggle {
  display: inline-block;
  width: 14px;
  color: #ffffff;
}

.json-key {
  color: var(--color-text-secondary);
}

.json-summary {
  color: #ffffff;
}

.json-primitive-string {
  color: var(--color-success);
}

.json-primitive-number {
  color: var(--color-warning-yellow);
}

.json-primitive-boolean {
  color: var(--color-primary);
}

.json-primitive-null,
.json-primitive-other {
  color: var(--color-text-primary);
}
</style>


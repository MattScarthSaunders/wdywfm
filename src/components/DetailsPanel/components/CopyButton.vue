<template>
  <button
    type="button"
    :disabled="disabled"
    :class="['copy-btn', { copied, 'copy-btn--disabled': disabled }]"
    :title="copied ? copiedTitle || defaultTitle : defaultTitle"
    @click="$emit('click')"
  >
    <span class="material-icons">{{ copied ? 'check' : 'content_copy' }}</span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  copied: boolean;
  defaultTitle: string;
  copiedTitle?: string;
  disabled?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.copy-btn {
  padding: 4px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.copy-btn .material-icons {
  font-size: 16px;
}

.copy-btn:hover {
  background: var(--color-primary-hover);
}

.copy-btn.copied {
  background: var(--color-success);
}

.copy-btn--disabled {
  background: var(--color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.5;
}
</style>


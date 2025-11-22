<template>
  <div class="toolbar">
    <button @click="$emit('clear')" class="toolbar-btn">Clear</button>
    <button @click="$emit('export')" class="toolbar-btn">Export</button>
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        :checked="preserveLog"
        @change="$emit('update:preserveLog', ($event.target as HTMLInputElement).checked)"
      /> 
      Preserve log
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  preserveLog: boolean;
}>();

defineEmits<{
  'update:preserveLog': [value: boolean];
  'clear': [];
  'export': [];
}>();
</script>

<style scoped>
.toolbar {
  padding: 8px 12px;
  background: var(--color-bg-lightest);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  padding: 4px 12px;
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-input);
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.toolbar-btn:hover {
  background: var(--color-bg-light);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  cursor: pointer;
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


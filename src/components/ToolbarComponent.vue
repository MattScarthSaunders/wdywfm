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
  background: #fafafa;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-btn {
  padding: 4px 12px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.toolbar-btn:hover {
  background: #f5f5f5;
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


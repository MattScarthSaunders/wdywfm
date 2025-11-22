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
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        :checked="showOnlySessions"
        @change="$emit('update:showOnlySessions', ($event.target as HTMLInputElement).checked)"
      /> 
      Show only sessions
    </label>
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        :checked="showOnlyBotDetection"
        @change="$emit('update:showOnlyBotDetection', ($event.target as HTMLInputElement).checked)"
      /> 
      Show only bot detection
    </label>
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        :checked="gradeHeaderImportance"
        @change="$emit('update:gradeHeaderImportance', ($event.target as HTMLInputElement).checked)"
      /> 
      Grade header importance
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  preserveLog: boolean;
  showOnlySessions: boolean;
  showOnlyBotDetection: boolean;
  gradeHeaderImportance: boolean;
}>();

defineEmits<{
  'update:preserveLog': [value: boolean];
  'update:showOnlySessions': [value: boolean];
  'update:showOnlyBotDetection': [value: boolean];
  'update:gradeHeaderImportance': [value: boolean];
  'clear': [];
  'export': [];
}>();
</script>


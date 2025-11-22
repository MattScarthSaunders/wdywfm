<template>
  <div class="details-section">
    <h3 
      class="section-header" 
      :class="{ collapsed: isCollapsed }"
      @click="toggleCollapse"
    >
      <span class="section-toggle">{{ isCollapsed ? '▶' : '▼' }}</span>
      {{ title }}
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


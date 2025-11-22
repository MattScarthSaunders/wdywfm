<template>
  <div v-if="!session.isSession" class="no-session">
    No session indicators detected
  </div>
  <div v-else class="session-detected">
    <div class="session-title">
      ✓ Session Request Detected
    </div>
    <div class="session-reason">
      Reason: {{ session.reason || '' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SessionInfo } from '../../../types';

defineProps<{
  session: SessionInfo;
}>();
</script>

<style scoped>
.no-session {
  color: var(--color-text-secondary);
}

.session-detected {
  color: var(--color-text-primary);
}

.session-title {
  color: var(--color-warning);
  font-weight: 600;
  margin-bottom: 8px;
}

.session-reason {
  color: var(--color-text-primary);
}
</style>


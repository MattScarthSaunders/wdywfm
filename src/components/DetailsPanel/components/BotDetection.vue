<template>
  <div v-if="!botDetection.isBotDetection" class="no-bot-detection">
    No bot detection measures identified
  </div>
  <div v-else class="bot-detection-detected">
    <div class="bot-title">
      ⚠ Bot Detection Detected ({{ botDetection.confidence }} confidence)
    </div>
    
    <div v-if="botDetection.providers && botDetection.providers.length > 0" class="providers-section">
      <div class="section-label"><strong>Matched Providers:</strong></div>
      <div class="providers-list">
        <span
          v-for="(provider, index) in botDetection.providers"
          :key="index"
          class="provider-badge"
        >
          {{ provider }}
        </span>
      </div>
    </div>
    
    <div v-if="botDetection.indicators && botDetection.indicators.length > 0" class="indicators-section">
      <div class="section-label"><strong>Indicators:</strong></div>
      <ul class="indicators-list">
        <li v-for="(indicator, index) in botDetection.indicators" :key="index">
          {{ indicator }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BotDetectionInfo } from '../../../types';

defineProps<{
  botDetection: BotDetectionInfo;
}>();
</script>

<style scoped>
.no-bot-detection {
  color: var(--color-text-secondary);
}

.bot-detection-detected {
  color: var(--color-text-primary);
}

.bot-title {
  color: var(--color-error-variant);
  font-weight: 600;
  margin-bottom: 8px;
}

.providers-section {
  margin-top: 12px;
  margin-bottom: 8px;
}

.section-label {
  margin-bottom: 8px;
}

.providers-list {
  margin-bottom: 12px;
}

.provider-badge {
  display: inline-block;
  padding: 4px 8px;
  margin: 2px 4px 2px 0;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.indicators-section {
  margin-top: 8px;
}

.indicators-list {
  margin-top: 4px;
  padding-left: 20px;
}

.indicators-list li {
  margin-bottom: 4px;
}
</style>


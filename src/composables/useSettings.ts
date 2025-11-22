import { ref } from 'vue';

export function useSettings() {
  const preserveLog = ref(true);
  const showOnlySessions = ref(false);
  const showOnlyBotDetection = ref(false);
  const gradeHeaderImportance = ref(false);

  function loadSettings() {
    chrome.storage.local.get(['preserveLog', 'showOnlySessions', 'showOnlyBotDetection', 'gradeHeaderImportance'], (result) => {
      if (result.preserveLog !== undefined) {
        preserveLog.value = result.preserveLog;
      }
      if (result.showOnlySessions !== undefined) {
        showOnlySessions.value = result.showOnlySessions;
      }
      if (result.showOnlyBotDetection !== undefined) {
        showOnlyBotDetection.value = result.showOnlyBotDetection;
      }
      if (result.gradeHeaderImportance !== undefined) {
        gradeHeaderImportance.value = result.gradeHeaderImportance;
      }
    });
  }

  function saveSettings() {
    chrome.storage.local.set({
      preserveLog: preserveLog.value,
      showOnlySessions: showOnlySessions.value,
      showOnlyBotDetection: showOnlyBotDetection.value,
      gradeHeaderImportance: gradeHeaderImportance.value
    });
  }

  return {
    preserveLog,
    showOnlySessions,
    showOnlyBotDetection,
    gradeHeaderImportance,
    loadSettings,
    saveSettings
  };
}


import { ref } from 'vue';

export function useSettings() {
  const preserveLog = ref(true);
  const gradeHeaderImportance = ref(false);

  function loadSettings() {
    chrome.storage.local.get(['preserveLog', 'gradeHeaderImportance'], (result) => {
      if (result.preserveLog !== undefined) {
        preserveLog.value = result.preserveLog;
      }
      if (result.gradeHeaderImportance !== undefined) {
        gradeHeaderImportance.value = result.gradeHeaderImportance;
      }
    });
  }

  function saveSettings() {
    chrome.storage.local.set({
      preserveLog: preserveLog.value,
      gradeHeaderImportance: gradeHeaderImportance.value
    });
  }

  return {
    preserveLog,
    gradeHeaderImportance,
    loadSettings,
    saveSettings
  };
}


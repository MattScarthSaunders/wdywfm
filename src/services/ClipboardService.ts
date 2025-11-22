/**
 * Service for clipboard operations
 */
export class ClipboardService {
  /**
   * Copy text to clipboard with fallback
   */
  static async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  /**
   * Copy URL to clipboard
   */
  static async copyUrl(url: string): Promise<void> {
    return this.copyToClipboard(url);
  }

  /**
   * Copy headers as JSON to clipboard
   */
  static async copyHeaders(headers: Record<string, string | string[]>): Promise<void> {
    const jsonStr = JSON.stringify(headers, null, 2);
    return this.copyToClipboard(jsonStr);
  }

  /**
   * Copy payload as JSON to clipboard
   */
  static async copyPayload(url: string, postData?: string): Promise<void> {
    const jsonStr = JSON.stringify({ url, postData }, null, 2);
    return this.copyToClipboard(jsonStr);
  }
}


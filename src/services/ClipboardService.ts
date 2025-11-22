export class ClipboardService {

  static async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
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

  static async copyUrl(url: string): Promise<void> {
    return this.copyToClipboard(url);
  }

  static async copyHeaders(headers: Record<string, string | string[]>): Promise<void> {
    const jsonStr = JSON.stringify(headers, null, 2);
    return this.copyToClipboard(jsonStr);
  }
  
  static async copyPayload(url: string, postData?: string): Promise<void> {
    const jsonStr = JSON.stringify({ url, postData }, null, 2);
    return this.copyToClipboard(jsonStr);
  }
}


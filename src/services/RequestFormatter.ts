import { formatter } from '../utils';

/**
 * Service for formatting request-related data for display
 */
export class RequestFormatter {
  /**
   * Extract a display name from a URL
   */
  static getRequestName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || urlObj.pathname || urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Get CSS class for HTTP status code
   */
  static getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    return 'status-5xx';
  }

  /**
   * Format file size for display
   */
  static formatSize(bytes: number): string {
    return formatter.formatSize(bytes);
  }

  /**
   * Format time duration for display
   */
  static formatTime(ms: number): string {
    return formatter.formatTime(ms);
  }

  /**
   * Format request title for details panel
   */
  static getRequestTitle(request: { requestNumber?: number; url: string }): string {
    const requestId = request.requestNumber || '?';
    let requestName: string;
    try {
      const url = new URL(request.url);
      requestName = url.pathname.split('/').pop() || request.url;
    } catch {
      requestName = request.url;
    }
    return `${requestId}: ${requestName}`;
  }
}


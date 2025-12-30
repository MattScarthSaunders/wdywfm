import { formatter } from '../utils';

export class RequestFormatter {
  getRequestName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || urlObj.pathname || urlObj.hostname;
    } catch {
      return url;
    }
  }

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    return 'status-5xx';
  }

  formatSize(bytes: number): string {
    return formatter.formatSize(bytes);
  }

  formatTime(ms: number): string {
    return formatter.formatTime(ms);
  }

  getRequestTitle(request: { requestNumber?: number; url: string }): string {
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


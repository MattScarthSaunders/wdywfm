/**
 * Service for formatting HTTP headers for display
 */
export class HeaderFormatter {
  /**
   * Determine the importance level of a header
   */
  static getHeaderImportance(headerName: string): string {
    if (!headerName) return 'unknown';
    const normalizedName = headerName.toLowerCase();
    
    if (normalizedName.startsWith('sec-ch')) {
      return 'required';
    }
    
    if (normalizedName.includes('ssgtoken') || 
        normalizedName.includes('ssotoken') ||
        normalizedName.includes('sso-token') ||
        normalizedName.includes('ssg-token')) {
      return 'required';
    }
    
    const requiredHeaders = [
      'host', 'cf-ray', 'cf-connecting-ip', 'cf-visitor', 'cf-ipcountry',
      'x-datadome', 'x-px', 'x-iinfo', 'x-cdn', 'x-akamai', 'x-amz-cf',
      'x-fastly', 'x-sucuri', 'x-f5', 'x-barracuda', 'x-shape', 'x-human',
      'x-kpsdk', 'x-radware', 'g-recaptcha', 'x-vercel-id', 'x-vercel',
      'x-amzn', 'x-azure', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
      'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-user', 'sec-fetch-dest',
      'user-agent', 'x-forwarded-for', 'x-real-ip', 'via', 'server'
    ];
    
    const optionalHeaders = [
      'accept', 'accept-language', 'accept-encoding', 'accept-charset',
      'referer', 'referrer-policy', 'cookie', 'authorization', 'content-type',
      'content-length', 'content-encoding', 'connection', 'cache-control',
      'if-modified-since', 'if-none-match', 'if-match', 'if-range', 'range',
      'origin', 'dnt', 'upgrade-insecure-requests', 'expect', 'te', 'trailer',
      'transfer-encoding', 'warning', 'x-requested-with', 'x-forwarded-proto',
      'x-forwarded-host'
    ];
    
    if (requiredHeaders.includes(normalizedName)) {
      return 'required';
    } else if (optionalHeaders.includes(normalizedName)) {
      return 'optional';
    } else {
      return 'unknown';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format headers as HTML for display
   */
  static formatHeadersForDisplay(headers: Record<string, string | string[]>, gradeImportance: boolean): string {
    if (!headers || Object.keys(headers).length === 0) {
      return '<div style="color: #999;">No headers</div>';
    }

    let html = '';
    for (const [key, value] of Object.entries(headers)) {
      const val = Array.isArray(value) ? value.join(', ') : value;
      const valStr = String(val);
      const isLong = valStr.length > 100;
      const truncatedVal = isLong ? valStr.substring(0, 100) : valStr;
      const headerId = `header-${key.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const importanceClass = gradeImportance ? `header-${this.getHeaderImportance(key)}` : '';
      
      html += `<div class="header-row ${importanceClass}">
        <div class="header-name ${importanceClass}">${this.escapeHtml(key)}</div>
        <div class="header-value ${importanceClass}">
          <span class="header-value-text" id="${headerId}-text">${this.escapeHtml(truncatedVal)}</span>
          ${isLong ? `<span class="header-expand" id="${headerId}-expand" data-full="${this.escapeHtml(valStr)}" data-id="${headerId}">[...]</span>` : ''}
        </div>
      </div>`;
    }
    
    return html;
  }

  /**
   * Format headers as JSON for display
   */
  static formatHeadersAsJSON(headers: Record<string, string | string[]>): string {
    if (!headers || Object.keys(headers).length === 0) {
      return '<div style="color: #999;">No headers</div>';
    }
    const jsonStr = JSON.stringify(headers, null, 2);
    return `<pre class="json-display">${this.escapeHtml(jsonStr)}</pre>`;
  }
}


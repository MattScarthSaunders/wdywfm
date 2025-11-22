import type { NetworkRequest } from '../types';
import { HeaderFormatter } from './HeaderFormatter';

/**
 * Service for formatting request payloads for display
 */
export class PayloadFormatter {
  /**
   * Format request payload as HTML
   */
  static formatPayload(request: NetworkRequest): string {
    let html = '';
    let hasContent = false;
    
    try {
      const url = new URL(request.url);
      if (url.search) {
        const queryParams = new URLSearchParams(url.search);
        if (queryParams.toString()) {
          hasContent = true;
          html += '<div class="payload-section"><div class="payload-section-title">Query String Parameters</div><div class="payload-table">';
          for (const [key, value] of queryParams.entries()) {
            html += `<div class="payload-row"><div class="payload-key">${HeaderFormatter.escapeHtml(key)}</div><div class="payload-value">${HeaderFormatter.escapeHtml(value)}</div></div>`;
          }
          html += '</div></div>';
        }
      }
    } catch (e) {
      // Invalid URL
    }
    
    if (request.postData) {
      hasContent = true;
      const contentType = (request.requestHeaders['content-type'] || '').toLowerCase();
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        html += '<div class="payload-section"><div class="payload-section-title">Form Data</div><div class="payload-table">';
        try {
          const params = new URLSearchParams(request.postData);
          for (const [key, value] of params.entries()) {
            html += `<div class="payload-row"><div class="payload-key">${HeaderFormatter.escapeHtml(key)}</div><div class="payload-value">${HeaderFormatter.escapeHtml(value)}</div></div>`;
          }
        } catch (e) {
          html += `<div class="payload-row"><div class="payload-value" style="grid-column: 1 / -1;">${HeaderFormatter.escapeHtml(request.postData)}</div></div>`;
        }
        html += '</div></div>';
      } else if (contentType.includes('application/json') || contentType.includes('text/json')) {
        html += '<div class="payload-section"><div class="payload-section-title">Request Payload</div><div class="payload-json">';
        try {
          const jsonObj = JSON.parse(request.postData);
          const jsonStr = JSON.stringify(jsonObj, null, 2);
          html += `<pre class="json-display">${HeaderFormatter.escapeHtml(jsonStr)}</pre>`;
        } catch (e) {
          html += `<pre class="json-display">${HeaderFormatter.escapeHtml(request.postData)}</pre>`;
        }
        html += '</div></div>';
      } else {
        html += '<div class="payload-section"><div class="payload-section-title">Request Payload</div><div class="payload-raw">';
        html += `<pre class="json-display">${HeaderFormatter.escapeHtml(request.postData)}</pre>`;
        html += '</div></div>';
      }
    }
    
    if (!hasContent) {
      return '<div style="color: #999;">No payload data</div>';
    }
    
    return html;
  }
}


import type { NetworkRequest } from '../types';
import { HeaderFormatter } from './HeaderFormatter';
import { formatter } from '../utils';

/**
 * Service for formatting session and bot detection information
 */
export class DetailsFormatter {
  /**
   * Format session analysis information
   */
  static formatSession(session: NetworkRequest['session']): string {
    if (session.isSession) {
      return `<div style="color: #ff9800; font-weight: 600; margin-bottom: 8px;">
        ✓ Session Request Detected
      </div>
      <div>Reason: ${HeaderFormatter.escapeHtml(session.reason || '')}</div>`;
    } else {
      return 'No session indicators detected';
    }
  }

  /**
   * Format bot detection analysis information
   */
  static formatBotDetection(botDetection: NetworkRequest['botDetection']): string {
    if (botDetection.isBotDetection) {
      let html = `<div style="color: #f44336; font-weight: 600; margin-bottom: 8px;">
        ⚠ Bot Detection Detected (${botDetection.confidence} confidence)
      </div>`;
      
      if (botDetection.providers && botDetection.providers.length > 0) {
        html += `<div style="margin-top: 12px; margin-bottom: 8px;"><strong>Matched Providers:</strong></div>
        <div style="margin-bottom: 12px;">`;
        botDetection.providers.forEach(provider => {
          html += `<span class="provider-badge" style="display: inline-block; padding: 4px 8px; margin: 2px 4px 2px 0; background: #e3f2fd; color: #1976d2; border-radius: 4px; font-size: 10px; font-weight: 500;">${HeaderFormatter.escapeHtml(provider)}</span>`;
        });
        html += `</div>`;
      }
      
      if (botDetection.indicators && botDetection.indicators.length > 0) {
        html += `<div style="margin-top: 8px;"><strong>Indicators:</strong></div>
        <ul style="margin-top: 4px; padding-left: 20px;">`;
        botDetection.indicators.forEach(indicator => {
          html += `<li style="margin-bottom: 4px;">${HeaderFormatter.escapeHtml(indicator)}</li>`;
        });
        html += '</ul>';
      }
      
      return html;
    } else {
      return 'No bot detection measures identified';
    }
  }

  /**
   * Format general request information
   */
  static formatGeneralInfo(request: NetworkRequest): string {
    return `URL: ${request.url}
Method: ${request.method}
Status: ${request.status}
Type: ${request.type}
Size: ${formatter.formatSize(request.size)}
Time: ${formatter.formatTime(request.time)}
Timestamp: ${new Date(request.timestamp).toLocaleString()}`;
  }
}


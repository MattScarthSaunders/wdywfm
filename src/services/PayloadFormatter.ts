import type { NetworkRequest } from '../types';

export type PayloadSection = 
  | { type: 'data'; title: string; items: Array<{ key: string; value: string }>; rawValue?: string }
  | { type: 'json'; title: string; data: string }
  | { type: 'raw'; title: string; data: string };

/**
 * Service for formatting request payloads for display
 */
export class PayloadFormatter {
  /**
   * Get payload data as structured sections for Vue components
   */
  static getPayloadSections(request: NetworkRequest): PayloadSection[] {
    const sections: PayloadSection[] = [];
    
    // Query string parameters
    try {
      const url = new URL(request.url);
      if (url.search) {
        const queryParams = new URLSearchParams(url.search);
        if (queryParams.toString()) {
          const items: Array<{ key: string; value: string }> = [];
          for (const [key, value] of queryParams.entries()) {
            items.push({ key, value });
          }
          sections.push({
            type: 'data',
            title: 'Query String Parameters',
            items
          });
        }
      }
    } catch (e) {
      // Invalid URL
    }
    
    // Post data
    if (request.postData) {
      const contentType = (request.requestHeaders['content-type'] || '').toLowerCase();
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        // Form data
        try {
          const params = new URLSearchParams(request.postData);
          const items: Array<{ key: string; value: string }> = [];
          for (const [key, value] of params.entries()) {
            items.push({ key, value });
          }
          sections.push({
            type: 'data',
            title: 'Form Data',
            items
          });
        } catch (e) {
          // If parsing fails, show as raw
          sections.push({
            type: 'data',
            title: 'Form Data',
            items: [],
            rawValue: request.postData
          });
        }
      } else if (contentType.includes('application/json') || contentType.includes('text/json')) {
        // JSON payload
        sections.push({
          type: 'json',
          title: '',
          data: request.postData
        });
      } else {
        // Raw payload
        sections.push({
          type: 'raw',
          title: '',
          data: request.postData
        });
      }
    }
    
    return sections;
  }
}



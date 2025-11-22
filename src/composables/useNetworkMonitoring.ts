import { ref } from 'vue';
import type { NetworkRequest } from '../types';
import { sessionDetector, botDetector, cookieParser, formatter } from '../utils';

let requestCounter = 0;

export function useNetworkMonitoring(options: { onRequest: (request: NetworkRequest) => void }) {
  // Early check to ensure we're in the right context
  if (typeof window === 'undefined') {
    console.warn('useNetworkMonitoring: window is undefined');
  }
  function processRequest(request: chrome.devtools.network.Request) {
    try {
      // Extract response headers first to get content-type
      let contentType = '';
      const responseHeadersObj: Record<string, string | string[]> = {};
      if (request.response?.headers) {
        for (const header of request.response.headers) {
          const name = header.name.toLowerCase();
          if (name === 'content-type') {
            contentType = header.value;
          }
          if (name === 'set-cookie') {
            if (!responseHeadersObj['set-cookie']) {
              responseHeadersObj['set-cookie'] = [];
            }
            (responseHeadersObj['set-cookie'] as string[]).push(header.value);
          } else {
            responseHeadersObj[header.name] = header.value;
          }
        }
      }

      // Get request details
      requestCounter++;
      const requestData: NetworkRequest = {
        id: request.requestId || Date.now() + Math.random().toString(),
        requestNumber: requestCounter,
        url: request.request.url,
        method: request.request.method,
        status: request.response?.status || 0,
        type: formatter.getResourceType(
          request.request.url,
          contentType
        ),
        size: request.response?.bodySize || 0,
        time: request.time || 0,
        timestamp: Date.now(),
        requestHeaders: {},
        responseHeaders: responseHeadersObj,
        cookies: [],
        setCookies: [],
        session: { isSession: false, reason: null },
        botDetection: { isBotDetection: false, indicators: [], confidence: 'low', providers: [] },
        postData: request.request.postData ? (typeof request.request.postData === 'string' ? request.request.postData : request.request.postData.text || null) : null
      };

      // Extract request headers (normalize to lowercase for consistent access)
      if (request.request.headers) {
        for (const header of request.request.headers) {
          const headerName = header.name.toLowerCase();
          // Store both original and normalized versions
          requestData.requestHeaders[header.name] = header.value;
          requestData.requestHeaders[headerName] = header.value;
        }
      }

      // Parse cookies (try both case variations)
      const cookieHeader = requestData.requestHeaders['cookie'] || requestData.requestHeaders['Cookie'];
      if (cookieHeader) {
        requestData.cookies = cookieParser.parseCookie(cookieHeader);
      }

      if (requestData.responseHeaders['set-cookie']) {
        requestData.setCookies = cookieParser.parseSetCookie(
          Array.isArray(requestData.responseHeaders['set-cookie'])
            ? requestData.responseHeaders['set-cookie']
            : [requestData.responseHeaders['set-cookie']]
        );
      }

      // Detect session
      requestData.session = sessionDetector.isSessionRequest(requestData);

      // Detect bot detection
      requestData.botDetection = botDetector.detect(requestData);

      // Call the callback
      options.onRequest(requestData);
    } catch (error) {
      // Error processing request
      console.error('Error processing request:', error);
    }
  }

  function startMonitoring() {
    // Safely get the network API
    const getNetworkAPI = () => {
      try {
        if (typeof chrome === 'undefined') {
          return null;
        }
        if (!chrome.devtools) {
          return null;
        }
        if (!chrome.devtools.network) {
          return null;
        }
        return chrome.devtools.network;
      } catch (e) {
        return null;
      }
    };

    const networkAPI = getNetworkAPI();
    
    if (!networkAPI) {
      console.warn('Chrome DevTools API not available, retrying...');
      // Retry after a short delay in case the API loads asynchronously
      setTimeout(() => {
        const retryAPI = getNetworkAPI();
        if (retryAPI) {
          startMonitoring();
        } else {
          console.error('Chrome DevTools API still not available after retry');
        }
      }, 200);
      return;
    }

    try {
      // Listen for network requests - check each property before accessing
      if (networkAPI.onRequestFinished && typeof networkAPI.onRequestFinished.addListener === 'function') {
        networkAPI.onRequestFinished.addListener((request) => {
          processRequest(request);
        });
      } else {
        console.error('onRequestFinished.addListener is not available');
      }

      // Also listen for requests that are still loading
      if (networkAPI.onRequestWillBeSent && typeof networkAPI.onRequestWillBeSent.addListener === 'function') {
        networkAPI.onRequestWillBeSent.addListener((request) => {
          // We'll process it when it finishes
        });
      }
    } catch (error) {
      console.error('Error setting up network monitoring:', error);
    }
  }

  return {
    startMonitoring
  };
}


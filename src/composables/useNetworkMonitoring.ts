import type { NetworkRequest } from '../types';
import { sessionDetector, botDetector, cookieParser, formatter } from '../utils';

let requestCounter = 0;

export function useNetworkMonitoring(options: { onRequest: (request: NetworkRequest) => void }) {
  if (typeof window === 'undefined') {
    console.warn('useNetworkMonitoring: window is undefined');
  }
  function processRequest(request: chrome.devtools.network.Request) {
    try {
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

      if (request.request.headers) {
        for (const header of request.request.headers) {
          const headerName = header.name.toLowerCase();
          requestData.requestHeaders[header.name] = header.value;
          requestData.requestHeaders[headerName] = header.value;
        }
      }

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

      requestData.session = sessionDetector.isSessionRequest(requestData);

      requestData.botDetection = botDetector.detect(requestData);

      // Send initial request data
      options.onRequest(requestData);

      // Fetch response body asynchronously if available
      if (request.getContent && request.response) {
        request.getContent((content) => {
          if (content) {
            requestData.responseBody = content;
            // Update the request with response body (this will trigger a reactive update)
            options.onRequest({ ...requestData });
          }
        });
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  }

  function startMonitoring() {
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
      if (networkAPI.onRequestFinished && typeof networkAPI.onRequestFinished.addListener === 'function') {
        networkAPI.onRequestFinished.addListener((request) => {
          processRequest(request);
        });
      } else {
        console.error('onRequestFinished.addListener is not available');
      }

      if (networkAPI.onRequestWillBeSent && typeof networkAPI.onRequestWillBeSent.addListener === 'function') {
        networkAPI.onRequestWillBeSent.addListener(() => {
          // Reserved for future use
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


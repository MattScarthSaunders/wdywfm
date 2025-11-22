/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Ensure chrome.devtools is optional
declare namespace chrome {
  namespace devtools {
    namespace network {
      interface Request {
        requestId?: string;
        request: {
          url: string;
          method: string;
          headers?: Array<{ name: string; value: string }>;
          postData?: string | { text?: string };
        };
        response?: {
          status?: number;
          headers?: Array<{ name: string; value: string }>;
          bodySize?: number;
        };
        time?: number;
      }
      
      interface Event {
        addListener(callback: (request: Request) => void): void;
      }
    }
    
    const network: {
      onRequestFinished?: chrome.devtools.network.Event;
      onRequestWillBeSent?: chrome.devtools.network.Event;
    } | undefined;
  }
}


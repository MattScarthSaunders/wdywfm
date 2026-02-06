import { createApp } from 'vue';
import { registerDeps } from 'vue-cocoon';
import App from './App.vue';
import './styles.css';
import { ClipboardService } from './services/ClipboardService';
import { CookieFormatter } from './services/CookieFormatter';
import { CookieTracker } from './services/CookieTracker';
import { DetailsFormatter } from './services/DetailsFormatter';
import { HeaderFormatter } from './services/HeaderFormatter';
import { PayloadFormatter } from './services/PayloadFormatter';
import { RequestFormatter } from './services/RequestFormatter';
import { TypeScriptSchemaService } from './services/TypeScriptSchemaService';
import { ValueCaptureService } from './services/ValueCaptureService';

const app = createApp(App);

registerDeps(app, {
  clipboardService: () => new ClipboardService(),
  cookieFormatter: () => new CookieFormatter(),
  cookieTracker: () => new CookieTracker(),
  detailsFormatter: () => new DetailsFormatter(),
  headerFormatter: () => new HeaderFormatter(),
  payloadFormatter: () => new PayloadFormatter(),
  requestFormatter: () => new RequestFormatter(),
  typeScriptSchemaService: () => new TypeScriptSchemaService(),
  valueCaptureService: () => new ValueCaptureService(),
});

app.mount('#app');


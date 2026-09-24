import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { EMBEDDED_FONTS_CSS } from './utils/cachedFontsCss';

// Inject full base64 fonts into head so all rendering engines (html-to-image, html2canvas, browser) have instant access
if (typeof document !== 'undefined') {
  const existing = document.getElementById('embedded-fonts-global');
  if (!existing) {
    const style = document.createElement('style');
    style.id = 'embedded-fonts-global';
    style.textContent = EMBEDDED_FONTS_CSS;
    document.head.appendChild(style);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

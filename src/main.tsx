import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tier 1 Google Maps Platform Quota & Auth Failure Listener
let gmpQuotaEventDispatched = false;
const notifyGmpQuotaExceededOnce = () => {
  if (gmpQuotaEventDispatched) return;
  gmpQuotaEventDispatched = true;
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

(window as any).gm_authFailure = () => {
  notifyGmpQuotaExceededOnce();
};
const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  if (gmpQuotaEventDispatched) return;
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError')) {
    notifyGmpQuotaExceededOnce();
  }
};

createRoot(document.getElementById('root')!).render(<App />);

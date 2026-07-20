import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { FundingApplicationForm } from './components/FundingApplicationForm';

// Dev-only entry point — not shipped to Webflow.
// Webflow uses FundingApplicationForm.webflow.tsx (default export) instead.
// Preview the contact-first variant locally with ?variant=2
const devVariant = new URLSearchParams(window.location.search).get('variant') === '2'
  ? 'Variant 2 (contact first)'
  : undefined;

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <FundingApplicationForm formVariant={devVariant} />
  </React.StrictMode>,
);

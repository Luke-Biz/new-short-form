import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-phone-input-2/lib/style.css';
import './index.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

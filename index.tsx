
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthGate } from './components/AuthGate.tsx';
import { initI18n } from './i18n.ts';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { DateRangeProvider } from './contexts/DateRangeContext.tsx';

async function main() {
  // Wait for translations to load before rendering the app
  await initI18n();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to. Ensure an element with id='root' exists in your HTML.");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <DateRangeProvider>
          <AuthGate />
        </DateRangeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

main().catch(err => {
  console.error("Failed to start the application:", err);
  const rootElement = document.getElementById('root');
  if (rootElement) {
      rootElement.innerHTML = `<div style="padding: 2rem; text-align: center; font-family: sans-serif; color: #b91c1c;"><h2>Application failed to start</h2><p>${err.message}</p></div>`;
  }
});

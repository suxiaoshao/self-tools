import React from 'react';
import ReactDOM from 'react-dom/client';
import Garfish from 'garfish';

import App from './App';
import { init } from './micro';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

init();

export type { MicroState, MicroTheme } from './micro';

declare global {
  interface Window {
    Garfish: typeof Garfish;
  }
}

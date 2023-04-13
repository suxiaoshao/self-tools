import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerMicroApps } from 'qiankun';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

registerMicroApps([
  {
    name: 'collections',
    entry: { scripts: ['https://collections.sushao.top/main.js'] },
    container: '#micro',
    activeRule: '/collections',
  },
]);

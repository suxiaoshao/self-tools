/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-14 03:53:27
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-09-18 03:38:12
 * @FilePath: /self-tools/web/packages/portal/src/main.tsx
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(
  // eslint-disable-next-line no-console label-has-associated-control
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

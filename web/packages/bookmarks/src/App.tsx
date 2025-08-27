/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao 48886207+suxiaoshao@users.noreply.github.com
 * @LastEditTime: 2025-08-27 20:25:20
 * @FilePath: /self-tools/web/packages/bookmarks/src/App.tsx
 */
import { Outlet } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './utils/apolloClient';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Outlet />
    </ApolloProvider>
  );
}

export default App;

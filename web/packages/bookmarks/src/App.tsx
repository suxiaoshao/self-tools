/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 02:53:47
 * @FilePath: /self-tools/web/packages/bookmarks/src/App.tsx
 */
import { Outlet } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { getClient } from 'custom-graphql';

function App() {
  return (
    <ApolloProvider client={getClient('https://bookmarks.sushao.top/graphql')}>
      <Outlet />
    </ApolloProvider>
  );
}

export default App;

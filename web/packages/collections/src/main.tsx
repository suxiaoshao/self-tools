/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 02:44:02
 * @FilePath: /self-tools/web/packages/collections/src/main.tsx
 */
import type { Menu, MicroConfig } from 'types';
import Collection from './features/Collection';
import type { ReactNode } from 'react';
import App from './App';
import { Route } from 'react-router-dom';
import ItemList from './features/Item/List';
import ItemDetails from './features/Item/Details';

export default class CollectionConfig implements MicroConfig {
  getName() {
    return 'collections';
  }
  getIcon() {
    return '📦';
  }
  getActiveRule() {
    return '/collections';
  }
  getMenu() {
    return [
      {
        name: 'home',
        icon: '🏠',
        path: {
          tag: 'path',
          value: {
            path: '/collections',
            children: [
              <Route key="item-list" index element={<ItemList />} />,
              <Route key="item-details" path="/collections/item/:itemId" element={<ItemDetails />} />,
            ],
          },
        },
      },
      {
        name: 'collection',
        path: {
          tag: 'path',
          value: {
            path: '/collections/collections',
            element: <Collection />,
          },
        },
        icon: '📁',
      },
    ] satisfies Menu[];
  }
  getElement(): ReactNode {
    return <App />;
  }
}

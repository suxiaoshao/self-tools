/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-28 04:25:22
 * @FilePath: /self-tools/web/packages/bookmarks/src/main.tsx
 */
import App from './App';
import { Menu, MicroConfig } from 'types';
import { ReactNode } from 'react';
import NovelList from './features/Novel/List';
import Tags from './features/Tags';
import Author from './features/Author';
import Collections from './features/Collections';
import { Route } from 'react-router-dom';
import NovelDetails from './features/Novel/Details';

export default class BookmarkConfig implements MicroConfig {
  getName() {
    return 'bookmarks';
  }
  getIcon() {
    return '📖';
  }
  getActiveRule() {
    return '/bookmarks';
  }
  getMenu() {
    return [
      {
        name: 'workspace',
        icon: '👷',
        path: {
          tag: 'path',
          value: {
            path: '/bookmarks',
            children: (
              <>
                <Route index element={<NovelList />} />
                <Route path="/bookmarks/novel/:novelId" element={<NovelDetails />} />
              </>
            ),
          },
        },
      },
      {
        name: 'collection_manage',
        icon: '📁',
        path: {
          tag: 'path',
          value: {
            path: '/bookmarks/collections',
            element: <Collections />,
          },
        },
      },
      {
        name: 'tag_manage',
        icon: '🏷️',
        path: {
          tag: 'path',
          value: {
            path: '/bookmarks/tags',
            element: <Tags />,
          },
        },
      },
      {
        name: 'author_manage',
        icon: '👨‍💻',
        path: {
          tag: 'path',
          value: {
            path: '/bookmarks/authors',
            element: <Author />,
          },
        },
      },
    ] as Menu[];
  }
  getElement(): ReactNode {
    return <App />;
  }
}

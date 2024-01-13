/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 03:08:30
 * @FilePath: /self-tools/web/packages/bookmarks/src/main.tsx
 */
import App from './App';
import { Menu, MicroConfig } from 'types';
import { ReactNode } from 'react';
import Novel from './features/Novel';
import Tags from './features/Tags';
import Author from './features/Author';
import Collections from './features/Collections';

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
            element: <Novel />,
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

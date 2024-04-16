/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 17:56:35
 * @FilePath: /self-tools/web/packages/bookmarks/src/main.tsx
 */
import App from './App';
import { Menu, MicroConfig } from 'types';
import { ReactNode } from 'react';
import NovelList from './features/Novel/List';
import Tags from './features/Tags';
import AuthorList from './features/Author/List';
import Collections from './features/Collections';
import { Route } from 'react-router-dom';
import NovelDetails from './features/Novel/Details';
import AuthorDetails from './features/Author/Details';
import NovelFetch from './features/Novel/Fetch';
import AuthorFetch from './features/Author/Fetch';

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
            children: [
              <Route key="novel-list" index element={<NovelList />} />,
              <Route key="novel-details" path="/bookmarks/novel/:novelId" element={<NovelDetails />} />,
              <Route key="novel-fetch" path="/bookmarks/novel/fetch" element={<NovelFetch />} />,
            ],
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
            children: [
              <Route key="author-list" index element={<AuthorList />} />,
              <Route key="author-detail" path="/bookmarks/authors/:authorId" element={<AuthorDetails />} />,
              <Route key="author-fetch" path="/bookmarks/authors/fetch" element={<AuthorFetch />} />,
            ],
          },
        },
      },
    ] as Menu[];
  }
  getElement(): ReactNode {
    return <App />;
  }
}

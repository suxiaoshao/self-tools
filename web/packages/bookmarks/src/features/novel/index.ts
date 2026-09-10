import { lazy } from 'react';

export const NovelList = lazy(() => import('./list'));
export const NovelDetails = lazy(() => import('./details'));
export const NovelFetch = lazy(() => import('./fetch'));

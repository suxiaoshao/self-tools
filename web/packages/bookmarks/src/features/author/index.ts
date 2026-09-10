import { lazy } from 'react';

export const AuthorList = lazy(() => import('./list'));
export const AuthorDetails = lazy(() => import('./details'));
export const AuthorFetch = lazy(() => import('./fetch'));

import { lazy } from 'react';

export const ItemList = lazy(() => import('./list'));
export const ItemDetails = lazy(() => import('./details'));
export const CreateItemButton = lazy(() => import('./components/CreateItemButton'));
export const ItemActions = lazy(() => import('./components/ItemActions'));

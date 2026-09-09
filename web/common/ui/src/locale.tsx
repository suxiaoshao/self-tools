import { createContext, useContext, type ReactNode } from 'react';
export interface UiMessages {
  close: string;
  loading: string;
  breadcrumb: string;
  more: string;
  toggleSidebar: string;
  sidebarTitle: string;
  sidebarDescription: string;
}
const UiLocale = createContext<UiMessages>({
  close: 'Close',
  loading: 'Loading',
  breadcrumb: 'Breadcrumb',
  more: 'More',
  toggleSidebar: 'Toggle sidebar',
  sidebarTitle: 'Sidebar',
  sidebarDescription: 'Navigation menu',
});
export function UiLocaleProvider({ messages, children }: { messages: UiMessages; children: ReactNode }) {
  return <UiLocale.Provider value={messages}>{children}</UiLocale.Provider>;
}
export function useUiMessages() {
  return useContext(UiLocale);
}

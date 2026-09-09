import { BrowserRouter } from 'react-router';
import AppRouter from './components/AppRouter';
import { TooltipProvider } from 'ui/components/tooltip';
import I18next, { useI18n } from 'i18n';
import { UiLocaleProvider } from 'ui/locale';
import type { ReactNode } from 'react';
import { CustomTheme } from 'ui/theme';

function UiLanguage({ children }: { children: ReactNode }) {
  const t = useI18n();
  return (
    <UiLocaleProvider
      messages={{
        close: t('close'),
        loading: t('loading'),
        breadcrumb: t('breadcrumb'),
        more: t('more'),
        toggleSidebar: t('toggle_sidebar'),
        sidebarTitle: t('navigation'),
        sidebarDescription: t('navigation_description'),
      }}
    >
      {children}
    </UiLocaleProvider>
  );
}
function App() {
  return (
    <I18next>
      <UiLanguage>
        <CustomTheme>
          <TooltipProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </TooltipProvider>
        </CustomTheme>
      </UiLanguage>
    </I18next>
  );
}

export default App;

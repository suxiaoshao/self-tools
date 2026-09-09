import { BrowserRouter } from 'react-router';
import AppRouter from './components/AppRouter';
import { TooltipProvider } from 'ui/components/tooltip';
import I18next from 'i18n';
import { CustomTheme } from 'ui/theme';

function App() {
  return (
    <I18next>
      <CustomTheme>
        <TooltipProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </TooltipProvider>
      </CustomTheme>
    </I18next>
  );
}

export default App;

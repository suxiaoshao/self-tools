import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import { TooltipProvider } from './components/ui/tooltip';
import I18next from 'i18n';
import { CustomTheme } from './features/Theme';

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

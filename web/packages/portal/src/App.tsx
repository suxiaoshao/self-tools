import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import I18next from 'i18n';
import { CustomTheme } from './features/Theme';

function App() {
  return (
    <I18next>
      <CustomTheme>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </CustomTheme>
    </I18next>
  );
}

export default App;

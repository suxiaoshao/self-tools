import { BrowserRouter } from 'react-router-dom';
import { CustomTheme } from 'theme';
import AppRouter from './components/AppRouter';
import { SnackbarProvider } from 'notify';
import { Provider } from 'react-redux';
import store from './app/store';
import I18next from 'i18n';

function App() {
  return (
    <Provider store={store}>
      <I18next>
        <CustomTheme>
          <SnackbarProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </SnackbarProvider>
        </CustomTheme>
      </I18next>
    </Provider>
  );
}

export default App;

import { BrowserRouter } from 'react-router-dom';
import { CustomTheme } from 'theme';
import AppRouter from './components/AppRouter';
import { SnackbarProvider } from 'notify';
import { ApolloProvider } from '@apollo/client';
import { getClient } from 'custom-graphql';
import { Provider } from 'react-redux';
import store from './app/store';
import I18next from 'i18n';

function App() {
  return (
    <Provider store={store}>
      <I18next>
        <CustomTheme>
          <SnackbarProvider>
            <ApolloProvider client={getClient('https://bookmarks.sushao.top/graphql')}>
              <BrowserRouter>
                <AppRouter />
              </BrowserRouter>
            </ApolloProvider>
          </SnackbarProvider>
        </CustomTheme>
      </I18next>
    </Provider>
  );
}

export default App;

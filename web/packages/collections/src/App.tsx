import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import { SnackbarProvider } from 'notify';
import { ApolloProvider } from '@apollo/client';
import { getClient } from 'custom-graphql';
import { Provider } from 'react-redux';
import store from './app/store';
import I18next from 'i18n';
import { ThemeProvider, createTheme } from '@mui/material';
import { useAppSelector } from './app/hooks';
import { SelectTheme } from './app/features/themeSlice';

function InnerApp() {
  const theme = useAppSelector(SelectTheme);
  return (
    <I18next>
      <ThemeProvider theme={createTheme(theme)}>
        <SnackbarProvider>
          <ApolloProvider client={getClient('https://collections.sushao.top/graphql')}>
            <BrowserRouter basename="/collections">
              <AppRouter />
            </BrowserRouter>
          </ApolloProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </I18next>
  );
}

function App() {
  return (
    <Provider store={store}>
      <InnerApp />
    </Provider>
  );
}

export default App;

import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import { SnackbarProvider } from 'notify';
import { ApolloProvider } from '@apollo/client';
import { getClient } from 'custom-graphql';
import { Provider } from 'react-redux';
import store from './app/store';
import { i18n } from 'i18n';
import { ThemeProvider, createTheme } from '@mui/material';
import { useAppSelector } from './app/hooks';
import { SelectTheme } from './app/features/themeSlice';
import { useEffect } from 'react';
import { SelectLang } from './app/features/i18nSlice';
import React from 'react';

function InnerApp({ basename }: { basename: string }) {
  const theme = useAppSelector(SelectTheme);
  const lang = useAppSelector(SelectLang);
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);
  return (
    <ThemeProvider theme={createTheme(theme)}>
      <SnackbarProvider>
        <ApolloProvider client={getClient('https://collections.sushao.top/graphql')}>
          <BrowserRouter basename={basename}>
            <AppRouter />
          </BrowserRouter>
        </ApolloProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

function App({ basename }: { basename: string }) {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <InnerApp basename={basename} />
      </Provider>
    </React.StrictMode>
  );
}

export default App;

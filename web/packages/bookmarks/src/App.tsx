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

function InnerApp() {
  const theme = useAppSelector(SelectTheme);
  const lang = useAppSelector(SelectLang);
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);
  return (
    <ThemeProvider theme={createTheme(theme)}>
      <SnackbarProvider>
        <ApolloProvider client={getClient('https://bookmarks.sushao.top/graphql')}>
          <BrowserRouter basename="/bookmarks">
            <AppRouter />
          </BrowserRouter>
        </ApolloProvider>
      </SnackbarProvider>
    </ThemeProvider>
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

import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import { SnackbarProvider } from 'notify';
import { ApolloProvider } from '@apollo/client';
import { getClient } from 'custom-graphql';
import { Provider } from 'react-redux';
import store from './app/store';
import { i18n } from 'i18n';
import { ThemeProvider, createTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { SelectTheme, setTheme } from './app/features/themeSlice';
import { useCallback, useEffect } from 'react';
import { SelectLang, setLang } from './app/features/i18nSlice';
import React from 'react';
import { MicroState } from 'portal';

function InnerApp({ basename, props: { lang, theme } }: AppProps) {
  const dispatch = useAppDispatch();
  const storeTheme = useAppSelector(SelectTheme);
  const storeLang = useAppSelector(SelectLang);
  useEffect(() => {
    i18n.changeLanguage(storeLang);
  }, [storeLang]);
  useEffect(() => {
    dispatch(setLang(lang));
    dispatch(setTheme(theme));
  }, [dispatch, lang, theme]);
  const handlePropsChange = useCallback(
    ({ lang, theme }: MicroState) => {
      dispatch(setLang(lang));
      dispatch(setTheme(theme));
    },
    [dispatch],
  );
  useEffect(() => {
    window.Garfish.channel.on('propsChange', handlePropsChange);
    return () => {
      window.Garfish.channel.off('propsChange', handlePropsChange);
    };
  }, [handlePropsChange]);
  return (
    <ThemeProvider theme={createTheme(storeTheme)}>
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

export interface AppProps {
  basename: string;
  props: MicroState;
}

function App({ basename, props }: AppProps) {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <InnerApp basename={basename} props={props} />
      </Provider>
    </React.StrictMode>
  );
}

export default App;

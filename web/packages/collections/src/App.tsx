import { BrowserRouter } from 'react-router-dom';
import { CustomTheme } from 'theme';
import AppRouter from './components/AppRouter';
import { SnackbarProvider } from 'notify';
import { ApolloProvider } from '@apollo/client';
import { client } from 'custom-graphql';
import { Provider } from 'react-redux';
import store from './app/store';

function App() {
  return (
    <Provider store={store}>
      <CustomTheme>
        <SnackbarProvider>
          <ApolloProvider client={client}>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </ApolloProvider>
        </SnackbarProvider>
      </CustomTheme>
    </Provider>
  );
}

export default App;

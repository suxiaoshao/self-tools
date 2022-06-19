import { BrowserRouter } from 'react-router-dom';
import { CustomTheme } from 'theme';
import AppRouter from './components/AppRouter';
import { SnackbarProvider } from 'notify';
import { ApolloProvider } from '@apollo/client';
import { client } from 'custom-graphql';

function App() {
  return (
    <CustomTheme>
      <SnackbarProvider>
        <ApolloProvider client={client}>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </ApolloProvider>
      </SnackbarProvider>
    </CustomTheme>
  );
}

export default App;

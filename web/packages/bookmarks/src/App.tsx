import { BrowserRouter } from 'react-router-dom';
import { CustomTheme } from 'theme';
import AppRouter from './components/AppRouter';
import { SnackbarProvider } from 'notify';

function App() {
  return (
    <CustomTheme>
      <SnackbarProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </SnackbarProvider>
    </CustomTheme>
  );
}

export default App;

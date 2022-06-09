import { BrowserRouter } from 'react-router-dom';
import { CustomTheme } from 'theme';
import AppRouter from './components/AppRouter';

function App() {
  return (
    <CustomTheme>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </CustomTheme>
  );
}

export default App;
